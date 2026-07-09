import { Injectable } from '@angular/core';
import { IPromptStrategy } from '../tokens/prompt-strategy.type';
import { DEFAULT_PROMPT, RETRY_PROMPT } from '../constants/prompt';

@Injectable({ providedIn: 'root' })
export class CsvPromptStrategy implements IPromptStrategy {
    constructor() {
        console.log('CsvPromptStrategy constructor');
    }

    getSystemPrompt(): string { return DEFAULT_PROMPT; }
    getRetryPrompt(): string { return RETRY_PROMPT; }
    cleanSourceText(text: string): string { return text; } // Повертає без змін
}