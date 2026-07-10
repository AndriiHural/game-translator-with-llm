/**
 * Запис глосарію: маппінг вихідних форм терміна на канонічний переклад + тип.
 * `description`/`_status` — службові поля генератора; наявний споживач
 * (dialogueGlossaryOnlyPrompt) читає лише source_forms/target/type і їх ігнорує.
 */
export interface GlossaryEntry {
    source_forms: string[];
    target: string;
    type: string;
    /** Короткий опис персонажа — лише коли є достатньо контексту */
    description?: string;
    /** Маркер генератора: 'new' — новий запис, 'recurring' — головний герой, повернутий повторно */
    _status?: 'new' | 'recurring';
}
