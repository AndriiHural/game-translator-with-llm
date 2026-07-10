import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { DEFAULT_PROMPT, DEFAULT_PROMPT_2, DEFAULT_PROMPT_3, DEFAULT_PROMPT_4 } from '../constants/prompt';
import { Gemma, UncensoredModel } from '../constants/models';

interface TranslationIssue {
    row: number;
    original: string;
    translated: string;
}

interface OllamaChatResponse {

    model: string;

    created_at: string;

    message: {
        role: string;
        content: string;
    };

    done: boolean;

}

@Injectable({
    providedIn: 'root'
})
export class OllamaService {
    private model = UncensoredModel;
    private url = 'http://localhost:11434/api/generate';

    private http = inject(HttpClient);

    generate(prompt: string): Observable<any> {
        return this.http.post(
            this.url,
            {
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0,
                    top_p: 0.1
                }
            }
        );
    }

    async translate(prompt: string, model: string | undefined = this.model, options = { temperature: 0, top_p: 0.1 }): Promise<string> {
        // console.log(prompt);

        const response = await firstValueFrom(
            this.http.post<{
                created_at: string;
                done: boolean;
                done_reason: 'length' | 'stop' | 'content_filter' | 'timeout' | 'error';
                eval_count: number;
                eval_duration: number;
                load_duration: number;
                model: string;
                prompt_eval_count: number;
                prompt_eval_duration: number;
                response: string;
                total_duration: number;
            }>(
                this.url,
                {
                    model,
                    prompt,
                    stream: false,
                    options: {
                        ...options,

                        //Recomended
                        // temperature: 1.0,
                        // top_p: 0.95,
                        // top_k: 64

                        // for dialogs
                        // temperature: 0.2,
                        // top_p: 0.6,

                        num_predict: 12000,
                        num_ctx: 16384,

                        // No to long and lag
                        // num_ctx: 65536,
                        // num_predict: -1

                        // num_ctx: 32768,
                        // num_predict: -1,
                    }
                }
            ))

        if (!response.done || response.done_reason !== 'stop') {
            throw new Error('Ollama response is not done');
        }

        return this.cleanResponse(response.response);
    }

    async translateBySystem(input: string): Promise<string> {

        const response = await firstValueFrom(
            this.http.post<OllamaChatResponse>('http://localhost:11434/api/chat', {
                model: 'hf.co/HauhauCS/Gemma4-26B-A4B-Uncensored-HauhauCS-Balanced:Q2_K_P',

                stream: false,

                messages: [
                    {
                        role: 'system',
                        content: DEFAULT_PROMPT_4
                    },
                    {
                        role: 'user',
                        content: input
                    }
                ],

                options: {
                    temperature: 0,
                    top_p: 0.1
                }
            })
        );

        return this.extractTranslation(response.message.content);

    }

    /**
     * Перевіряє, чи модель не зламала кому (один з найчастіших артефактів)
     */
    async validateChunk(
        originalRows: string[][],
        translatedRows: string[][],
        sourceColumn: number,
        targetColumn: number
    ): Promise<TranslationIssue[]> {

        const originalColumn = originalRows
            .map(r => r[sourceColumn] ?? '');

        const translatedColumn = translatedRows
            .map(r => r[targetColumn] ?? '');

        return this.validateCommas(
            originalColumn,
            translatedColumn
        );

    }

    private cleanResponse(response: string): string {
        return response.split('<channel|>').pop() ?? '';
    }



    private validateCommas(
        original: string[],
        translated: string[]
    ): TranslationIssue[] {

        const issues: TranslationIssue[] = [];

        for (let i = 0; i < original.length; i++) {

            const originalHasComma = original[i].includes(',');
            const translatedHasComma = translated[i].includes(',');

            if (originalHasComma !== translatedHasComma) {

                issues.push({
                    row: i,
                    original: original[i],
                    translated: translated[i]
                });

            }

        }

        return issues;

    }

    isCommaAdded(original: string, translated: string): boolean {
        return original.includes(',') !== translated.includes(',')
    }

    isQuotesAdded(original: string, translated: string): boolean {
        return original.includes('"') !== translated.includes('"')
    }

    private extractTranslation(response: string): string {

        // Шукаємо перший markdown-блок
        const match = response.match(/```(?:text)?\s*([\s\S]*?)```/i);

        if (match) {
            return match[1].trim();
        }

        // Запасний варіант — якщо модель не поставила ```
        return response
            .split('\n')
            .filter(line => /^\d+\|/.test(line))
            .join('\n')
            .trim();

    }
}