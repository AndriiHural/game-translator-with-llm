import { inject, Injector, runInInjectionContext } from '@angular/core';
import { TranslatorService } from '../services/translate.service';
import { TranslatedRow } from '../types/translated-row.model';

export class Chunk {
    private translatorService = inject(TranslatorService);
    private injector = inject(Injector);

    public isTranslated = false;
    public children: Chunk[] = [];

    constructor(
        public readonly id: string,
        public readonly rows: TranslatedRow[],
        private sourceColumn: number,
        private targetColumn: number,
        private parallelThreshold: number = 150,
        private chanksInProgress: number = 1,
        private retryCount: number = 0
    ) {
    }

    async translate(retryCount = this.retryCount): Promise<TranslatedRow[]> {
        console.log(`[Chunk ${this.id}] In progress: ${this.chanksInProgress}`);

        if (this.rows.length === 0) {
            this.isTranslated = true;
            return [];
        }

        try {
            this.rows.forEach(r => r.retryCount++);

            // 1. Конвертуємо TranslatedRow[] назад у string[][], як очікує твій сервіс.
            // Твій сервіс у методі buildPrompt(rows, ...) використовує rows для отримання тексту.
            const rawRowsForOllama: string[][] = this.rows.map(row => [
                row.id,
                row.sourceText,
                row.targetText
            ]);

            // 2. Викликаємо твій сервіс (він повертає об'єкт TranslateResult)
            const translateResult = await this.translatorService.translateChunk(
                rawRowsForOllama,
                this.sourceColumn,
                this.targetColumn,
                retryCount > 4 ? "hf.co/HauhauCS/Gemma4-26B-A4B-Uncensored-HauhauCS-Balanced:Q2_K_P" : "gemma4:latest"
            );

            // 3. 👈 ГЛАВНИЙ ФІКС: Беремо готову відпарсену мапу з результату
            const resultMap = translateResult.map;

            // 4. Мапимо переклад на наші TranslatedRow об'єкти.
            // Твій сервіс як ключ для мапи використовує індекс масиву, який йому передали (0, 1, 2...).
            // Тому ми беремо текст із мапи за поточним індексом `idx` всередині цього чанку.
            this.rows.forEach((row, idx) => {
                row.targetText = resultMap.get(idx) || '';
                row.isTranslated = !!row.targetText;
                if (row.error) delete row.error;
            });

            this.isTranslated = true;
            console.log(`[Chunk ${this.id}] Translated: ${this.rows.length} rows`);
            return this.rows;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[Chunk ${this.id}] Помилка: ${errorMessage}. Дробимо чанк...`);

            this.rows.forEach(r => r.error = errorMessage);
            return await this.handleFailureAndRetry();
        }
    }

    private async handleFailureAndRetry(): Promise<TranslatedRow[]> {
        if (this.rows.length <= 1) {
            // Пауза перед жорстким ретраєм останнього рядка
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await this.translate(999);
        }

        const half = Math.ceil(this.rows.length / 2);

        await runInInjectionContext(this.injector, async () => {
            this.children = [
                new Chunk(`${this.id}_L`, this.rows.slice(0, half), this.sourceColumn, this.targetColumn, this.parallelThreshold, this.chanksInProgress + 1),
                new Chunk(`${this.id}_R`, this.rows.slice(half), this.sourceColumn, this.targetColumn, this.parallelThreshold, this.chanksInProgress)
            ];
        });

        console.log(`[Chunk ${this.id}] Впав. Роздроблено на: L (${this.children[0].rows.length}) та R (${this.children[1].rows.length})`);

        let leftResult: TranslatedRow[];
        let rightResult: TranslatedRow[];

        // Якщо обидва під-чанки маленькі — пускаємо в паралель
        if (this.children[0].rows.length < this.parallelThreshold && this.children[1].rows.length < this.parallelThreshold) {
            const [resL, resR] = await Promise.all([
                this.children[0].translate(this.retryCount + 1),
                this.children[1].translate(this.retryCount + 1)
            ]);
            leftResult = resL;
            rightResult = resR;
        } else {
            // Інакше — послідовно
            leftResult = await this.children[0].translate(this.retryCount + 1);
            rightResult = await this.children[1].translate(this.retryCount + 1);
        }

        this.isTranslated = this.children.every(child => child.isTranslated);
        return [...leftResult, ...rightResult];
    }
}