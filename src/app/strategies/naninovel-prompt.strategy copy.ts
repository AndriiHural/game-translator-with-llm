import { Injectable } from '@angular/core';
import { IPromptStrategy } from '../tokens/prompt-strategy.type';
import { DEFAULT_PROMPT_5, RETRY_PROMPT } from '../constants/prompt';

@Injectable({ providedIn: 'root' })
export class NaninovelPromptStrategy implements IPromptStrategy {
    constructor() {
        console.log('NaninovelPromptStrategy constructor');
    }

    getSystemPrompt(): string { return DEFAULT_PROMPT_5; }

    getRetryPrompt(): string { return RETRY_PROMPT; }

    cleanSourceText(text: string): string {
        console.log('cleanSourceText', text);
        console.log(' trim();', text.startsWith(';') ? text.substring(1).trim() : text.trim());

        if (!text) return '';
        // Якщо рядок починається з "; ", видаляємо цей префікс для ШІ
        return text.startsWith(';') ? text.substring(1).trim() : text.trim();
    }
}


/**
 * 3. Що ввести в поля Пошуку та Заміни
Поле пошуку (Find):

Фрагмент коду
say_English = ""(.*?)""
Як це працює: > * say_English = "" шукає точний збіг початку рядка та перших двох лапок.

(.*?) — це наша група захвату (завдяки дужкам). Крапка з зірочкою та знаком питання означають "захопити будь-який текст всередині лапок, але зупинитися на перших же зустрічних подвійних лапках" (лінивий пошук).

"" — шукає кінцеві дві лапки.

Поле заміни (Replace):

Plaintext
say_English = "$1"
Як це працює:
Тут ми пишемо say_English = , потім ставимо одну лапку ", викликаємо нашу групу через $1 і закриваємо однією лапкою ".
 */