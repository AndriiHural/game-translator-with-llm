import { WritableSignal } from '@angular/core';

export type FlowStepStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Один крок флоу — єдине джерело правди і для виконання, і для прогрес-бару.
 * Додав крок сюди → він і виконується в onFlow1, і зʼявляється в статус-барі з живим статусом.
 */
export interface FlowStep {
    /** Стабільний ключ для track у шаблоні */
    key: string;
    /** Підпис у барі. Порожній рядок → бар покаже плейсхолдер */
    label: string;
    /** Поточний статус кроку */
    status: WritableSignal<FlowStepStatus>;
    /** Дія, яку виконує крок */
    run: () => Promise<void>;
}
