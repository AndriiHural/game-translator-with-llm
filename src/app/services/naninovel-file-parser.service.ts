import { Injectable } from '@angular/core';
import { IFileParser } from '../tokens/file-processor.type';

@Injectable({ providedIn: 'root' })
export class NaninovelFileParserService implements IFileParser {
    // Емулюємо "хедер", щоб компонент знав назви колонок
    public firstLine: string = 'Key/ID,Source (English),Target (Language)';

    parseFile(data: string): string[][] {
        const result: string[][] = [];

        // Нормалізуємо переноси рядків та ділимо файл на блоки по порожніх рядках
        const normalized = data.replace(/\r\n/g, '\n');
        const blocks = normalized.split(/\n\s*\n/);

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i].trim();
            if (!block) continue;

            // Ділимо блок на 3 окремі фізичні рядки
            const lines = block.split('\n').map(l => l.trim());

            // Очікуємо структуру: [0] # ID, [1] ; Source, [2] Target
            if (lines.length >= 3) {
                const key = lines[0];    // Напр: "# ~92169ec5"
                const source = lines[1]; // Напр: "; You guys are back~"
                const target = lines[2]; // Напр: "다시 왔네~"

                // Заганяємо як 3 елементи "рядка" для нашої таблиці
                result.push([key, source, target]);
            } else {
                console.warn(`Пропущено некоректний блок №${i + 1}:\n`, block);
            }
        }

        return result;
    }
}