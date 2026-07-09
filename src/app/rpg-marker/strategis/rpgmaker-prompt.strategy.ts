import { Injectable } from '@angular/core';
import { DEFAULT_PROMPT_6 } from '../../constants/prompt';

@Injectable()
export class RpgMakerPromptStrategy {
    // Погано справляється з текстом, добре перекладає теги і системні змінні але зависає і працює дуже довго,
    // постійно падає по часу і зависає над одним рядком. Ще хоч якось працює на проміжкув 500-800 текенів на вхід
    // 
    //    getSystemPrompt(): string {
    //         return `You are an expert game localizer specializing in RPG Maker MV/MZ games. 
    // Translate the provided text into Ukrainian.

    // CRITICAL RULES:
    // 1. Retain all control codes exactly as they are. Examples of control codes:
    //    \\V[n] (Variables), \\N[n] (Actor Names), \\P[n] (Party Member Names), \\C[n] (Color changes), \\G (Gold display), \\! (Wait for input), \\. (Wait 1/4 sec), \\| (Wait 1 sec).
    // 2. Never translate or alter the content inside brackets of control codes (e.g., if you see \\C[5], keep it exactly as \\C[5]).
    // 3. Maintain the original tone, punctuation, and character voice.
    // 4. Output format must be strictly "index|translation".`;
    //     }
    getSystemPrompt(): string { return DEFAULT_PROMPT_6; }

    cleanSourceText(text: string): string {
        return text;
    }
}