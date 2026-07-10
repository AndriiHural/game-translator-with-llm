import { signal, WritableSignal } from "@angular/core";
import { Line, LineType } from "./line";

export enum EventStatus {
    New = 0,
    Edited = 1,
    InProgress = 2,
    NeedReview = 3,
    Done = 4
}

export class Page {
    list: WritableSignal<Array<Line>>;


    // aditionasl
    id!: string;
    original!: Record<string, any>;

    constructor(page: Record<string, any>, id: string) {
        const { list, ...data } = page;

        this.id = id;
        this.list = signal(this.mapLines(list));

        console.log('page', page);
        this.original = page;
        Object.assign(this, data);
    }

    toJSON() {
        const dynamicData = this.original;

        const result = {
            ...dynamicData,
            list: this.list(),
        };
        console.log('result', result);
        return result;
    }

    addLine(message: string, addAfter: number): number {
        console.log('addAfter', message, addAfter);

        const list = this.list();

        // addAfter — це id рядка-якоря, а не його позиція в масиві.
        // Шукаємо реальний індекс, бо після попередніх вставок id та індекси розходяться.
        const anchorIndex = list.findIndex(l => l.id === addAfter);
        const anchor = anchorIndex !== -1 ? list[anchorIndex] : list[list.length - 1];
        const insertAt = anchorIndex !== -1 ? anchorIndex + 1 : list.length;
        console.log('anchor', anchor);

        // Унікальний id (max + 1), щоб не залежати від позиції в масиві
        const id = list.reduce((max, l) => Math.max(max, l.id), -1) + 1;

        const newLine = new Line(
            { code: anchor.code, parameters: [message], indent: anchor.indent },
            id,
            anchor.type(),
            this.id
        );

        // Незмінне оновлення масиву, щоб спрацював сигнал і оновився UI
        const next = [...list];
        next.splice(insertAt, 0, newLine);
        this.list.set(next);

        return id;
    }

    private mapLines(list: Array<any>): Array<Line> {
        let nextType = LineType.Other;
        let messageCount = 0;

        return list.map((line, index) => {
            if (line.code === 101) {
                messageCount = 0;
                nextType = line.parameters.at(0) === '' ? LineType.Other : LineType.Name;
                return new Line(line, index, LineType.System, this.id);
            }

            if (line.code === 401) {
                const type = nextType;
                messageCount++;

                if (messageCount === 4) {
                    nextType = LineType.Other;
                    messageCount = 0;
                } else {
                    nextType = LineType.Message;
                }

                return new Line(line, index, type, this.id);
            }

            messageCount = 0;

            return new Line(line, index, LineType.System, this.id);
        })
    }
}