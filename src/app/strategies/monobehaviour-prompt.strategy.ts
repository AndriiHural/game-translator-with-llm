import { Injectable } from '@angular/core';
import { IPromptStrategy } from '../tokens/prompt-strategy.type';
import { DEFAULT_PROMPT_5, RETRY_PROMPT } from '../constants/prompt';

@Injectable({ providedIn: 'root' })
export class MonoBehaviourPromptStrategy implements IPromptStrategy {
    constructor() {
        console.log('MonoBehaviourPromptStrategy constructor');
    }

    getSystemPrompt(): string { return DEFAULT_PROMPT_5; }

    getRetryPrompt(): string { return RETRY_PROMPT; }

    cleanSourceText(text: string): string {
        console.log('MonoBehaviourPromptStrategy cleanSourceText', text);

        if (!text) return '';

        return text;
    }
}