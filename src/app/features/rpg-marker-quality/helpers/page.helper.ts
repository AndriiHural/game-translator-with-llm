import { Gemma, UncensoredModel } from "../../../constants/models";
import { Line, LineType } from "../classes/line";
import { Page } from "../classes/page";

export abstract class PageHelper {
    static trassformToPromptBody(lines: Array<Line>, target?: number, fromVariantes?: boolean): string {
        let promptBody = '';
        let currentMessages: Array<Line> = [];
        const flushMessages = () => {
            if (currentMessages.length > 0) {
                const ids = currentMessages.map(m => m.id).join(',');
                const combinedText = currentMessages.map(m => m.parameters()[0]).join('[br]');
                const valiant2 = currentMessages.map(m => m.variants()[Gemma] || '').join('[br]');
                const valiant3 = currentMessages.map(m => m.variants()[UncensoredModel] || '').join('[br]');
                const isCurrentTarget = currentMessages.find(item => item.id === target);

                if (fromVariantes && isCurrentTarget) {
                    promptBody += `**TARGET ROWS**\n`;
                    promptBody += `${ids}|Variant: ${combinedText}\n`;
                    promptBody += `${ids}|Variant: ${valiant2}\n`;
                    promptBody += `${ids}|Variant: ${valiant3}\n`;
                } else {
                    if (isCurrentTarget) {
                        promptBody += `**TARGET ROW**\n`;
                    }
                    promptBody += `${ids}|Message: ${combinedText}\n`;
                }

                currentMessages = []; // очищуємо буфер
            }
        };

        lines.forEach(line => {
            if (line.type() === LineType.Name) {
                // Перед тим як додати ім'я, зливаємо накопичені повідомлення (якщо вони є)
                flushMessages();
                if (line.id === target) {
                    promptBody += `**TARGET ROW**\n`;
                }
                promptBody += `${line.id}|Name: ${line.parameters()[0]}\n`;
            } else if ([LineType.Message, LineType.Other].includes(line.type())) {
                // Накопичуємо повідомлення, що йдуть підряд
                currentMessages.push(line);
            }
        });

        // Не забуваємо злити залишок повідомлень, якщо масив закінчився на Message
        flushMessages();

        return promptBody;
    }

    static saveAsVariants(promptResult: string, lines: Array<Line>, model: string): Array<Line> {
        const splitted = promptResult.split('\n');

        splitted.forEach(row => {
            if (!row.trim()) return; // ігноруємо порожні рядки

            const splittedRow = row.split('|');
            const idsString = splittedRow[0];
            // slice(1).join('|') — щоб не втратити текст, якщо репліка містить "|"
            let lineText = splittedRow.slice(1).join('|') || '';

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
                        line.variants.update(prev => ({ ...prev, [model]: textVariants[index] !== undefined ? textVariants[index] : '' }));
                    }
                });
            } else {
                // Якщо це поодинокий рядок (наприклад, Name або одиночний Message)
                const line = lines.find(l => l.id === lineIds[0]);
                if (line) {
                    line.variants.update(prev => ({ ...prev, [model]: lineText }));
                }
            }
        });

        return lines;
    }

    static saveAsResult(result: string, lines: Line[], page?: Page) {
        const splitted = result.split('\n');

        splitted.forEach(row => {
            if (!row.trim()) return; // ігноруємо порожні рядки

            const splittedRow = row.split('|');
            const idsString = splittedRow[0];
            // slice(1).join('|') — щоб не втратити текст, якщо репліка містить "|"
            let lineText = splittedRow.slice(1).join('|') || '';

            // Видаляємо префікси "Name: " або "Message: ", щоб залишився чисто текст від моделі
            lineText = lineText.replace(/^(Name:|Message:|Variant:)\s*/, '');

            // Розбиваємо ID (на випадок, якщо там кілька ID через кому)
            const lineIds = idsString.split(',').map(id => +id);

            // Ігноруємо рядки, де ліва частина — не id (заголовки/пояснення моделі)
            if (lineIds.some(id => Number.isNaN(id))) return;

            // [br] — це роздільник між окремими рядками репліки, а не частина тексту.
            // Завжди розбиваємо по [br] і розкидаємо блоки по рядках — навіть для одиночного id,
            // бо fitTextToLimits може додати [br] і одну репліку треба розбити на кілька рядків.
            const textVariants = lineText.split('[br]');

            lineIds.forEach((id) => {
                // Споживаємо блоки послідовно, щоб зберегти вирівнювання навіть якщо рядок не знайдено
                const text = textVariants.shift();
                const line = lines.find(l => l.id === id);
                if (line) {
                    // Якщо модель повернула менше блоків, ніж було рядків — фолбек порожній рядок
                    line.parameters.set([text !== undefined ? text : '']);
                }
            });

            // Зайві блоки (модель розбила репліку на більше рядків) → додаємо нові рядки
            if (textVariants.length > 0) {
                if (!page) {
                    throw new Error("Error while mapping lines. Page is null or undefined");
                }
                // Переставляємо якір на щойно доданий рядок, щоб зберегти порядок реплік
                let anchorId = lineIds[lineIds.length - 1];
                textVariants.forEach(text => {
                    anchorId = page.addLine(text, anchorId);
                });
            }
        });

        return lines;
    }

    static changeLinesType(data: Array<{ id: number, type: string, line: string, isChanged: boolean }>, lines: Array<Line>): Array<Line> {
        const changed = data.filter(item => item.isChanged);

        changed.forEach(item => {
            const line = lines.find(l => l.id === item.id);
            if (line) {
                line.type.set(item.type as LineType);
            }
        });

        return lines;
    }

    /**
     * Толерантно парсить JSON-масив із відповіді моделі:
     * пробує сирий текст, а якщо не вийшло — витягує підрядок від першого "[" до останнього "]"
     * (на випадок ```-огортки чи зайвого тексту довкола). Повертає null, якщо валідного масиву немає.
     */
    static parseJsonArray<T = any>(raw: string): T[] | null {
        const candidates = [raw];
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        if (start !== -1 && end > start) {
            candidates.push(raw.slice(start, end + 1));
        }

        for (const candidate of candidates) {
            try {
                const parsed = JSON.parse(candidate);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch {
                // пробуємо наступний варіант
            }
        }

        return null;
    }

    static getLinesForTypeCheck(lines: Array<Line>) {
        const formatted = lines.map(line => {
            const newLine: { id: number, type: string, line: string } = {
                id: line.id,
                type: line.type(),
                line: line.parameters()[0] as string
            };
            return newLine;
        });


        return JSON.stringify(formatted);
    }
}