export interface IFileParser {
    firstLine: string;
    parseFile(data: string): string[][];
}

export interface IFileExport {
    exportFile(data: string[][], fileName: string, originalContent?: string): void;
    generateString(data: string[][]): string;
    downloadBlob(content: string, fileName: string): void;
}
