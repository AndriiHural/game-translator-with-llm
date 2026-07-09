import { Injectable } from '@angular/core';

@Injectable()
export class MonoBehaviourFileParserService {
    public rawFileContent: string = '';
    public firstLine: string = 'LineID,English,Ukrainian';

    parseFile(rawContent: string): string[][] {
        this.rawFileContent = rawContent;
        const lines = rawContent.split('\n');
        const result: string[][] = [];

        // Шукаємо: say_English = " будь-який текст "
        // Символ ? після .* робить пошук лінивим (зупиняється на перших же закриваючих лапках)
        const regex = /say_English\s*=\s*"(.*?)"/;

        lines.forEach((line, index) => {
            const match = line.match(regex);
            if (match) {
                let englishText = match[1].trim();

                // Якщо текст всередині загорнутий у MonoBehaviour-лапки типу ""Text""
                if (englishText.startsWith('"') && englishText.endsWith('"')) {
                    englishText = englishText.slice(1, -1);
                }

                result.push([
                    index.toString(), // ID рядка
                    englishText,      // Чистий текст для перекладу
                    ''                // Місце під переклад
                ]);
            }
        });

        return result;
    }
}