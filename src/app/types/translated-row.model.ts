export interface TranslatedRow {
    globalIndex: number;     // Порядковий номер у всьому файлі (для збереження черговості)
    id: string;              // Наприклад, номер рядка MonoBehaviour або JsonPath з RPG Maker
    sourceText: string;      // Оригінал
    targetText: string;      // Переклад від Ollama
    isTranslated: boolean;   // Статус готовності рядка
    retryCount: number;      // Скільки разів цей рядок намагалися перекласти
    error?: string;          // Помилка, якщо остання спроба впала
}