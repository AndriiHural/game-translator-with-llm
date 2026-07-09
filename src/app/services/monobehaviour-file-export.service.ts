import { Injectable, inject } from '@angular/core';
import { FILE_PARSER_TOKEN } from '../tokens/file-processor.tokens';
import { MonoBehaviourFileParserService } from './monobehaviour-file-parser.service';

@Injectable()
export class MonoBehaviourFileExportService {
    private parser = inject(FILE_PARSER_TOKEN) as MonoBehaviourFileParserService;

    exportFile(csvContent: string[][], fileName: string): void {
        let rawContent = this.parser.rawFileContent;
        if (!rawContent) return;

        const lines = rawContent.split('\n');

        csvContent.forEach(row => {
            const lineIndex = parseInt(row[0], 10);
            const translatedText = row[2]; // Переклад від Ollama (чистий текст)

            if (!isNaN(lineIndex) && lines[lineIndex]) {
                const originalLine = lines[lineIndex];

                // Визначаємо відступи (табуляцію/пробіли) на початку рядка, щоб не ламати форматування
                const indentMatch = originalLine.match(/^(\s*)/);
                const indent = indentMatch ? indentMatch[1] : '         ';

                // Збираємо рядок заново, замість сліпої заміни регуляркою.
                // Це на 100% захищає від дублювання лапок.
                lines[lineIndex] = `${indent}1 string say_English = "${translatedText}"`;
            }
        });

        const finalContent = lines.join('\n');
        this.downloadBlob(finalContent, fileName);
    }

    private downloadBlob(content: string, fileName: string) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fileName.replace('.csv', '_translated.txt'));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}