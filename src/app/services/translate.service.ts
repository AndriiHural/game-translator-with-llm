import { inject, Injectable } from "@angular/core";
import { OllamaService } from "./olama.service";
import { PROMPT_STRATEGY_TOKEN } from "../tokens/prompt-strategy.token";
import { RETRY_PROMPT } from "../constants/prompt";
import { CsvPromptStrategy } from "../strategies/csv-prompt.strategy";

interface TranslationItem {
    lineNumber: number;
    rowIndex: number;
    id: string;
}

export interface TranslateResult {
    map: Map<number, string>;
    items: TranslationItem[];
    rowResponse: string;
}

@Injectable()
export class TranslatorService {
    private ollama = inject(OllamaService);
    private promptStrategy = inject(PROMPT_STRATEGY_TOKEN, { optional: true }) ?? inject(CsvPromptStrategy);

    /**
       * rows - весь CSV
       * sourceColumn - звідки брати текст (наприклад English = 3)
       * targetColumn - куди записувати переклад (наприклад Ukrainian = 5)
       */
    async translateChunk(
        rows: string[][],
        sourceColumn: number,
        targetColumn: number,
        model: string | undefined = undefined
    ): Promise<TranslateResult> {
        const { prompt, items } = this.buildPrompt(rows, sourceColumn);

        const response = await this.ollama.translate(prompt, model);
        // console.log('response', response);
        const mapped = this.parseResponse(response);

        if (mapped.size !== rows.length) {
            console.warn('Model did not return all translations');
            throw new Error('Model did not return all translations');
        }
        return { map: mapped, items, rowResponse: response };
    }

    async validate(rows: string[][],
        result: string[][],
        sourceColumn: number,
        targetColumn: number) {
        const issues = await this.ollama.validateChunk(
            rows,
            result,
            sourceColumn,
            targetColumn
        );

        // if (issues.length > 0) {
        //     console.warn('Translation issues found:', issues);
        //     return result.map((row, index) => {
        //         if (this.ollama.isCommaAdded(rows[index][sourceColumn], rows[index][targetColumn]) && !this.ollama.isQuotesAdded(rows[index][sourceColumn], rows[index][targetColumn])) {
        //             row[targetColumn] = `"${row[targetColumn]}"`;
        //         }
        //         return row;
        //     });
        // }

        return result;
    }

    private cutFirstLine(str: string): string {
        const index = str.indexOf('\n');

        index === -1
            ? str
            : str.slice(0, index);


        return str.slice(index);
    }


    async translateLine(
        rows: string[][],
        sourceColumn: number,
        targetColumn: number
    ): Promise<string[][]> {

        const prompt = this.buildPromptForLine(rows[0][sourceColumn]);

        let response = await this.ollama.translate(prompt.prompt, 'gemma4:latest');

        console.log('responce', response);
        response = this.cutFirstLine(response);
        console.log('response cut', response);

        const translated = new Map<number, string>();
        translated.set(0, response);
        console.log("TODO check", rows[0][targetColumn][0]);

        const result = this.applyTranslations(
            rows,
            targetColumn,
            [{ lineNumber: 0, rowIndex: 0, id: rows[0][targetColumn][0] }],
            translated
        );

        const issues = await this.ollama.validateChunk(
            rows,
            result,
            sourceColumn,
            targetColumn
        );

        if (issues.length > 0) {
            console.warn('Translation issues found:', issues);
            return result.map((row, index) => {
                if (this.ollama.isCommaAdded(rows[index][sourceColumn], rows[index][targetColumn]) && !this.ollama.isQuotesAdded(rows[index][sourceColumn], rows[index][targetColumn])) {
                    console.log(rows[index][sourceColumn], rows[index][targetColumn]);

                    row[targetColumn] = `"${row[targetColumn]}"`;
                }
                return row;
            });
        }

        return result;
    }


    /**
    * Формує prompt
    */
    private buildPrompt(
        rows: string[][],
        sourceColumn: number
    ): { prompt: string; items: TranslationItem[] } {
        const items: TranslationItem[] = [];

        const body = rows
            .map((row, index) => {
                items.push({ lineNumber: index, rowIndex: index, id: row[0] });

                // 👉 ОЧИЩЕННЯ ТЕКСТУ: Замість raw тексту віддаємо підготовлений через стратегію
                const cleanedText = this.promptStrategy.cleanSourceText(row[sourceColumn]);
                return `${index}|${cleanedText}`;
            })
            .join('\n');

        // Беремо системний промт з нашої поточної стратегії
        const prompt = `${this.promptStrategy.getSystemPrompt()}\n\n${body}\n`;

        return { prompt, items };
    }

    /**
    * Формує prompt
    */
    private buildPromptSystem(
        rows: string[][],
        sourceColumn: number
    ): {
        prompt: string;
        items: TranslationItem[];
    } {

        const items: TranslationItem[] = [];

        const body = rows
            .map((row, index) => {

                items.push({ lineNumber: index, rowIndex: index, id: row[0] });

                return `${index}|${row[sourceColumn]}`;

            })
            .join('\n');

        return {
            prompt: body,
            items
        };
    }

    /**
   * Формує prompt
   */
    private buildPromptForLine(
        line: string,
    ): {
        prompt: string;
    } {
        const body = `${line}`;

        const prompt = `${RETRY_PROMPT}
    
${body}
        `;

        return {
            prompt
        };

    }

    /**
   * Парсимо відповідь моделі
   */
    parseResponse(response: string): Map<number, string> {
        const map = new Map<number, string>();

        response
            .split('\n')
            .forEach(line => {
                const separator = line.indexOf('|');

                if (separator === -1) return;

                const id = Number(line.substring(0, separator).trim());
                const text = line.substring(separator + 1).trim();

                map.set(id, text);
            });
        return map;
    }

    /**
    * Записуємо назад у CSV
    */
    applyTranslations(
        rows: string[][],
        targetColumn: number,
        items: TranslationItem[],
        translations: Map<number, string>
    ): string[][] {

        for (const item of items) {

            const translated = translations.get(item.lineNumber);

            if (!translated) {
                continue;
            }

            rows[item.rowIndex][targetColumn] = translated;

        }

        return rows;

    }
}