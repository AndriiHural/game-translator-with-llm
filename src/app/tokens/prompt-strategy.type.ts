export interface IPromptStrategy {
    getSystemPrompt(): string;
    getRetryPrompt(): string;
    cleanSourceText(text: string): string; // Ось тут ми прибираємо ";" для Naninovel
}