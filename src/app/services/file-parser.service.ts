import { Injectable } from '@angular/core';
import { LineParserService } from './line-parser.service';
import { IFileParser } from '../tokens/file-processor.type';

@Injectable({
    providedIn: 'root'
})
export class FileParserService implements IFileParser {
    public firstLine: string = '';

    constructor(private lineParser: LineParserService) { }

    /**
     * Приймає весь файл, ділить на логічні лінії та парсить кожну.
     * @param fileContent Весь сирий текст файлу
     * @param expectedColumns Кількість колонок, яку ми очікуємо в кожному рядку
     * @returns Масив розпарсених масивів (таблиця)
     */
    parseFile(data: string): string[][] {
        const fileContent = this.cutFirstLine(data);
        const expectedColumns = this.firstLine.split(',').length;

        const result: string[][] = [];
        let currentLine = '';
        let inQuotes = false;
        let visualLineCounter = 1; // Для точного відстеження номеру рядка у файлі для логів
        let lineStartNumber = 1;

        // Нормалізація переносу рядків
        const normalizedContent = fileContent.replace(/\r\n/g, '\n');

        for (let i = 0; i < normalizedContent.length; i++) {
            const char = normalizedContent[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            }

            if (char === '\n') {
                visualLineCounter++; // Рахуємо фізичні рядки у файлі
            }

            if (char === '\n' && !inQuotes) {
                // Знайшли кінець логічного рядка (перенос поза лапками)
                this.processAndPushLine(currentLine, expectedColumns, lineStartNumber, result);
                currentLine = '';
                lineStartNumber = visualLineCounter; // Наступний логічний рядок почнеться з цієї позиції
            } else {
                currentLine += char;
            }
        }

        // Обробка залишку файлу
        if (currentLine.trim()) {
            this.processAndPushLine(currentLine, expectedColumns, lineStartNumber, result);
        }

        return result;
    }

    private processAndPushLine(
        line: string,
        expectedColumns: number,
        lineNumber: number,
        targetArray: string[][]
    ): void {
        if (!line.trim()) return;

        try {
            const parsedRow = this.lineParser.parseLine(line, expectedColumns);
            if (parsedRow) {
                targetArray.push(parsedRow);
            } else {
                console.warn(`Рядок №${lineNumber} пропущено: кількість елементів менша ніж ${expectedColumns}.`);
            }
        } catch (error: any) {
            // Перехоплюємо ерор з LineParser і додаємо контекст (номер рядка), як ти хотів
            throw new Error(`Помилка у рядку №${lineNumber}: ${error.message}`);
        }
    }

    private cutFirstLine(str: string): string {
        const index = str.indexOf('\r');

        this.firstLine = index === -1
            ? str
            : str.slice(0, index);


        return str.slice(index);
    }
}