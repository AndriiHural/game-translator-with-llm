import { inject, Injectable } from '@angular/core';
import { FileParserService } from './file-parser.service';
import { IFileExport } from '../tokens/file-processor.type';

@Injectable({
    providedIn: 'root'
})
export class FileExportService implements IFileExport {
    private fileParserService = inject(FileParserService);

    exportFile(csvContent: string[][], fileName: string) {
        const csvString = this.generateString(csvContent);
        const translatedFileName = fileName.startsWith('Translated_') ? fileName : `Translated_${fileName}`;

        this.downloadBlob(csvString, translatedFileName);
    }

    downloadBlob(content: string, fileName: string): void {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    public generateString(csvContent: string[][]): string {
        const body = csvContent
            .map(row => {
                return row
                    .map(cell => {
                        let escaped = cell;

                        if (escaped.includes('"')) {
                            escaped = escaped.replace(/"/g, '""');
                        }

                        // ДОДАЄМО ПЕРЕВІРКУ НА ЛАПКИ ТУТ 👇 (escaped.includes('"'))
                        // Але оскільки ми вище вже замінили їх на '""', перевіряємо на '""'
                        if (
                            escaped.includes('"') ||
                            escaped.includes(',') ||
                            escaped.includes('\n') ||
                            escaped.includes('\r')
                        ) {
                            return `"${escaped}"`;
                        }

                        return escaped;
                    })
                    .join(',');
            })
            .join('\r\n');

        return this.fileParserService.firstLine + '\r\n' + body;
    }
}