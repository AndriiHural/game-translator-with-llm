import { Injectable } from '@angular/core';
import { IFileExport } from '../tokens/file-processor.type';

@Injectable({ providedIn: 'root' })
export class NaninovelFileExportService implements IFileExport {

    generateString(data: string[][]): string {
        // Беремо кожен рядок-масив і зшиваємо через звичайний перенос рядка,
        // а самі блоки розділяємо подвійним переносом
        return data
            .map(row => `${row[0]}\n${row[1]}\n${row[2]}`)
            .join('\n\n');
    }

    exportFile(data: string[][], fileName: string): void {
        const fileContent = this.generateString([...data]);
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    generateCsvString(_data: string[][]): string {
        return '';
    }

    downloadBlob(content: string, fileName: string): void {
        // not using
        return;
    }
}