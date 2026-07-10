import { Line, LineType } from "./line";

export class Dialog {
    lines: Line[];

    constructor(page: { list: Line[] }) {
        this.lines = page.list;
    }

    getLines(): Array<Line> {
        return this.lines.filter(line => line.type === LineType.Message || line.type === LineType.Name);
    }

    getText(): string {
        return this.getLines().map(line => line.originalLine).join(' ');
    }
}