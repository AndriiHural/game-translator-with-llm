import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ChunkService {

    splitByCharacters(
        rows: string[][],
        sourceColumn: number,
        maxCharacters = 3000
    ): string[][][] {

        const chunks: string[][][] = [];

        let currentChunk: string[][] = [];
        let currentLength = 0;

        for (const row of rows) {

            const text = row[sourceColumn] ?? '';

            if (
                currentChunk.length > 0 &&
                currentLength + text.length > maxCharacters
            ) {
                chunks.push(currentChunk);

                currentChunk = [];
                currentLength = 0;
            }

            currentChunk.push(row);
            currentLength += text.length;
        }

        if (currentChunk.length) {
            chunks.push(currentChunk);
        }

        return chunks;

    }

}