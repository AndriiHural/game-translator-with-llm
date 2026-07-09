import { Line, LineType } from "../classes/line";

export abstract class PageHelper {
    static trassformToPromptBody(lines: Array<Line>, target?: number): string {
        let promptBody = '';
        let currentMessages: Array<Line> = [];

        const flushMessages = () => {
            if (currentMessages.length > 0) {
                const ids = currentMessages.map(m => m.id).join(',');
                const combinedText = currentMessages.map(m => m.originalLine).join('[br]');

                if (currentMessages.find(item => item.id === target)) {
                    promptBody += `**TARGET ROW**\n`;
                }

                promptBody += `${ids}|Message: ${combinedText}\n`;
                currentMessages = []; // очищуємо буфер
            }
        };

        lines.forEach(line => {
            if (line.type === LineType.Name) {
                // Перед тим як додати ім'я, зливаємо накопичені повідомлення (якщо вони є)
                flushMessages();
                if (line.id === target) {
                    promptBody += `**TARGET ROW**\n`;
                }
                promptBody += `${line.id}|Name: ${line.originalLine}\n`;
            } else if (line.type === LineType.Message) {
                // Накопичуємо повідомлення, що йдуть підряд
                currentMessages.push(line);
            }
        });

        // Не забуваємо злити залишок повідомлень, якщо масив закінчився на Message
        flushMessages();

        return promptBody;
    }

    static trassformOlamaResult(promptResult: string, lines: Array<Line>, model: string): Array<Line> {
        const splitted = promptResult.split('\n');

        splitted.forEach(row => {
            if (!row.trim()) return; // ігноруємо порожні рядки

            const splittedRow = row.split('|');
            const idsString = splittedRow[0];
            let lineText = splittedRow[1] || '';

            // Видаляємо префікси "Name: " або "Message: ", щоб залишився чисто текст від моделі
            lineText = lineText.replace(/^(Name:|Message:)\s*/, '');

            // Розбиваємо ID (на випадок, якщо там кілька ID через кому)
            const lineIds = idsString.split(',').map(id => +id);

            if (lineIds.length > 1) {
                // Якщо це об'єднане повідомлення, розбиваємо його назад по [br]
                const textVariants = lineText.split('[br]');

                lineIds.forEach((id, index) => {
                    const line = lines.find(l => l.id === id);
                    if (line) {
                        // Якщо модель чомусь повернула менше реплік, ніж було, 
                        // беремо порожній рядок як фолбек
                        line.variants[model] = textVariants[index] !== undefined ? textVariants[index] : '';
                    }
                });
            } else {
                // Якщо це поодинокий рядок (наприклад, Name або одиночний Message)
                const line = lines.find(l => l.id === lineIds[0]);
                if (line) {
                    line.variants[model] = lineText;
                }
            }
        });

        return lines;
    }
}