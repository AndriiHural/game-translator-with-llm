import { Injectable, inject } from '@angular/core';
import { OllamaService } from '../../../services/olama.service';
import { Gemma } from '../../../constants/models';
import { PageHelper } from '../helpers/page.helper';
import { LineType } from '../classes/line';
import { SceneEvent } from '../classes/event';
import { GlossaryEntry } from '../classes/glossary-entry';
import { generateGlossaryPrompt } from '../constants/prompt';

@Injectable({ providedIn: 'root' })
export class GlossaryGeneratorService {
    private ollama = inject(OllamaService);

    /**
     * Обходить усі сторінки всіх подій, збирає кандидатів у глосарій постранично
     * (щоб не впертися в контекст моделі) і зливає їх із наявним глосарієм.
     * @param onProgress викликається з кількістю оброблених сторінок і загальною кількістю.
     */
    async generate(
        events: SceneEvent[],
        existingGlossary: GlossaryEntry[],
        onProgress?: (done: number, total: number) => void,
    ): Promise<GlossaryEntry[]> {
        const existing = existingGlossary ?? [];
        const existingJson = JSON.stringify(existing);
        const candidates: GlossaryEntry[] = [];

        // Спершу збираємо сторінки з релевантними рядками — щоб знати загальну кількість для прогресу
        const pages = events
            .flatMap(event => event.pages)
            .map(page => ({
                page,
                lines: page.list().filter(line =>
                    [LineType.Name, LineType.Message, LineType.Other].includes(line.type())),
            }))
            .filter(entry => entry.lines.length > 0);

        const total = pages.length;
        onProgress?.(0, total);

        for (let i = 0; i < pages.length; i++) {
            const { page, lines } = pages[i];

            const body = PageHelper.trassformToPromptBody(lines);
            const prompt = generateGlossaryPrompt(existingJson, body);

            const result = await this.ollama.translate(prompt, Gemma);
            console.log('[Generate Glossary] page', page.id, `${i + 1}/${total}`, result);

            const parsed = PageHelper.parseJsonArray<GlossaryEntry>(result);
            if (parsed) {
                candidates.push(...parsed.filter(entry => this.isValid(entry)).map(entry => this.normalize(entry)));
            }

            onProgress?.(i + 1, total);
        }

        return this.merge(existing, candidates);
    }

    private isValid(entry: any): entry is GlossaryEntry {
        return !!entry && typeof entry.target === 'string' && entry.target.trim().length > 0;
    }

    /** Модель інколи повертає source_forms рядком/недомасивом — приводимо до string[] */
    private normalizeForms(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            return [value];
        }
        return [];
    }

    private normalize(entry: GlossaryEntry): GlossaryEntry {
        return { ...entry, source_forms: this.normalizeForms(entry.source_forms) };
    }

    private keyOf(entry: GlossaryEntry): string {
        return `${(entry.target ?? '').trim().toLowerCase()}::${(entry.type ?? '').trim().toLowerCase()}`;
    }

    /**
     * Чисте злиття/дедуплікація: наявні записи лишаються базою, кандидати або доливаються
     * до наявного запису (union source_forms), або додаються як нові з маркером _status.
     */
    private merge(existing: GlossaryEntry[], candidates: GlossaryEntry[]): GlossaryEntry[] {
        const result: GlossaryEntry[] = existing.map(entry => ({
            ...entry,
            source_forms: this.normalizeForms(entry.source_forms),
        }));

        const byKey = new Map<string, GlossaryEntry>();
        result.forEach(entry => byKey.set(this.keyOf(entry), entry));

        const findBySourceForm = (cand: GlossaryEntry): GlossaryEntry | undefined => {
            const forms = (cand.source_forms ?? []).map(f => f.trim().toLowerCase());
            return result.find(entry =>
                (entry.source_forms ?? []).some(f => forms.includes(f.trim().toLowerCase())));
        };

        const unionSourceForms = (target: GlossaryEntry, incoming: string[] = []) => {
            const seen = new Set(target.source_forms.map(f => f.trim().toLowerCase()));
            for (const form of incoming) {
                const norm = form.trim().toLowerCase();
                if (!seen.has(norm)) {
                    target.source_forms.push(form);
                    seen.add(norm);
                }
            }
        };

        for (const cand of candidates) {
            const match = byKey.get(this.keyOf(cand)) ?? findBySourceForm(cand);

            if (match) {
                unionSourceForms(match, cand.source_forms);
                if (!match.description && cand.description) {
                    match.description = cand.description;
                }
                // Головних героїв, повернутих повторно, позначаємо, щоб їх легко знайти
                if (cand._status === 'recurring') {
                    match._status = 'recurring';
                }
            } else {
                const entry: GlossaryEntry = {
                    source_forms: [...(cand.source_forms ?? [])],
                    target: cand.target,
                    type: cand.type ?? '',
                    ...(cand.description ? { description: cand.description } : {}),
                    _status: 'new',
                };
                result.push(entry);
                byKey.set(this.keyOf(entry), entry);
            }
        }

        return result;
    }
}
