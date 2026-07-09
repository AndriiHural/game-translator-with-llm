import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LineParserService {

    /**
     * Парсить складний CSV-рядок з урахуванням лапок та переносів.
     * @param row Рядок для парсингу
     * @param expectedColumns Очікувана кількість колонок
     * @returns Масив розпарсених колонок
     * @throws Error якщо колонок більше, ніж очікувалось, або якщо лапки не закриті
     */
    parseLine(row: string, expectedColumns: number): string[] | null {
        const columns: string[] = [];
        let currentColumn = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Замість того, щоб просто писати '"', ми залишаємо екрановані лапки як є '""',
                    // щоб метод експорту потім правильно зрозумів, що там БУЛИ лапки!
                    currentColumn += '""';
                    i++; // Пропускаємо другу лапку
                } else {
                    inQuotes = !inQuotes;
                    // Зберігаємо зовнішню лапку в сирому значенні, 
                    // щоб addColumn знав, де були межі
                    currentColumn += '"';
                }
            } else if (char === ',' && !inQuotes) {
                this.addColumn(columns, currentColumn, expectedColumns);
                currentColumn = '';
            } else {
                currentColumn += char;
            }
        }

        if (inQuotes) {
            throw new Error('Знайдено незакриті лапки в кінці рядка.');
        }

        this.addColumn(columns, currentColumn, expectedColumns);

        if (columns.length < expectedColumns) {
            return null;
        }

        return columns;
    }

    private addColumn(columns: string[], value: string, maxColumns: number): void {
        console.log('addColumn', columns);
        if (columns.length >= maxColumns) {
            throw new Error(`Очікувалось колонок: ${maxColumns}, але знайдено більше. ${columns.toString()}`);
        }

        let cleanValue = value;

        // Видаляємо ТІЛЬКИ зовнішні лапки, які ми зберегли в циклі
        if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
            cleanValue = cleanValue.substring(1, cleanValue.length - 1);
        }

        // Тепер перетворюємо внутрішні екрановані '""' на нормальні '"' для внутрішнього масиву
        cleanValue = cleanValue.replace(/""/g, '"');

        columns.push(cleanValue);
    }
}