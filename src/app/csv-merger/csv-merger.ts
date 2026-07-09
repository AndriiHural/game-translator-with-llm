import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileParserService } from '../services/file-parser.service';
import { FileExportService } from '../services/file-export.service';
import { TranslateTable } from '../components/translate-table/translate-table';
import { TranslatorService } from '../services/translate.service';

@Component({
    selector: 'app-csv-merger',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateTable],
    providers: [TranslatorService],
    templateUrl: './csv-merger.html',
    styleUrls: ['./csv-merger.scss']
})
export class CsvMergerComponent {
    private fileParserService = inject(FileParserService);
    private fileExportService = inject(FileExportService);

    // Імена завантажених файлів
    sourceFileName = signal<string>('');
    targetFileName = signal<string>('');
    error = signal<string | null>(null);

    // Хедери таблиць
    sourceHeaders = signal<string[]>([]);
    targetHeaders = signal<string[]>([]);

    // Контент таблиць
    sourceCsvContent = signal<string[][]>([]); // Таблиця 1 (Джерело)
    targetCsvContent = signal<string[][]>([]); // Таблиця 2 (Оригінальний Target)
    modifiedCsvContent = signal<string[][]>([]); // Результат після злиття

    // Індекси колонок (ngModel)
    sourceColumnIndex: number = 0;
    targetColumnIndex: number = 1;

    // Обробка першого файлу (Source)
    onSourceFileChange(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        this.sourceFileName.set(file.name);
        this.error.set(null);

        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const content = e.target.result as string;
                // Парсимо файл (очікуємо, наприклад, 7 колонок як у твоєму пресеті)
                const result = this.fileParserService.parseFile(content);

                this.sourceHeaders.set(this.fileParserService.firstLine.split(','));
                this.sourceCsvContent.set(result);
            } catch (err: any) {
                this.error.set(err instanceof Error ? err.message : 'Помилка парсингу Source файлу');
                alert(this.error());
            }
        };
        reader.readAsText(file);
    }

    // Обробка другого файлу (Target)
    onTargetFileChange(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        this.targetFileName.set(file.name);
        this.error.set(null);

        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const content = e.target.result as string;
                const result = this.fileParserService.parseFile(content);

                this.targetHeaders.set(this.fileParserService.firstLine.split(','));
                this.targetCsvContent.set(result);
                // Одразу копіюємо в модифікований масив, щоб було що рендерити до натискання мерджу
                this.modifiedCsvContent.set(JSON.parse(JSON.stringify(result)));
            } catch (err: any) {
                this.error.set(err instanceof Error ? err.message : 'Помилка парсингу Target файлу');
                alert(this.error());
            }
        };
        reader.readAsText(file);
    }

    // ОСНОВНА ЛОГІКА: Перенесення колонки
    mergeColumns() {
        const sourceData = this.sourceCsvContent();
        const targetData = this.targetCsvContent();

        if (sourceData.length === 0 || targetData.length === 0) {
            this.error.set('Обидва файли мають бути завантажені!');
            return;
        }

        this.error.set(null);

        // Глибоке копіювання цільового масиву для безпечної мутації даних
        const updatedTarget = JSON.parse(JSON.stringify(targetData)) as string[][];

        // Ітеруємося по рядках. Беремо мінімальну довжину, щоб уникнути виходу за межі масивів
        const rowsCount = Math.min(sourceData.length, updatedTarget.length);

        for (let i = 0; i < rowsCount; i++) {
            const sourceRow = sourceData[i];
            const targetRow = updatedTarget[i];

            // Валідація наявності колонок у конкретному рядку
            if (sourceRow && targetRow && sourceRow[this.sourceColumnIndex] !== undefined && targetRow[this.targetColumnIndex] !== undefined) {
                // Записуємо значення з першої таблиці на місце вибраної колонки у другу таблицю
                targetRow[this.targetColumnIndex] = sourceRow[this.sourceColumnIndex];
            }
        }

        // Оновлюємо сигнал модифікованого контенту
        this.modifiedCsvContent.set(updatedTarget);
        console.log('Колонки успішно синхронізовано!');
    }

    // Оновлення клітинки вручну користувачем прямо у другій таблиці
    onTargetDataChange(updatedData: string[][]) {
        this.modifiedCsvContent.set(updatedData);
    }

    // Експорт змердженого файлу
    exportMergedFile() {
        if (!this.modifiedCsvContent().length) return;
        this.fileExportService.exportFile(this.modifiedCsvContent(), `merged_${this.targetFileName()}`);
    }

    // Очистити стан сторінки
    clearAll() {
        this.sourceFileName.set('');
        this.targetFileName.set('');
        this.sourceCsvContent.set([]);
        this.targetCsvContent.set([]);
        this.modifiedCsvContent.set([]);
        this.sourceHeaders.set([]);
        this.targetHeaders.set([]);
        this.error.set(null);
    }
}