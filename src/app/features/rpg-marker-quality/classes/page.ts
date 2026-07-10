import { signal } from "@angular/core";
import { Line, LineType } from "./line";

export enum EventStatus {
    New = 0,
    Edited = 1,
    InProgress = 2,
    NeedReview = 3,
    Done = 4
}

export class Page {
    list: Array<Line>;


    // aditionasl
    id!: string;
    original!: Record<string, any>;

    constructor(page: Record<string, any>, id: string) {
        const { list, ...data } = page;

        this.id = id;
        this.list = this.mapLines(list)

        console.log('page', page);
        this.original = page;
        Object.assign(this, data);
    }

    toJSON() {
        const dynamicData = this.original;

        const result = {
            ...dynamicData,
            list: this.list,
        };
        console.log('result', result);
        return result;
    }

    addLine(message: string, addAfter: number) {
        console.log('addAfter', message, addAfter);
        const firstLine = this.list.find(l => l.id === addAfter)!;
        console.log('firstLine', firstLine);
        const id = this.list.length; // Або інша логіка генерації ID

        const newLine = new Line(
            { code: firstLine.code, parameters: [message], indent: firstLine.indent },
            id,
            firstLine.type(),
            this.id
        );

        this.list.splice(addAfter + 1, 0, newLine);
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