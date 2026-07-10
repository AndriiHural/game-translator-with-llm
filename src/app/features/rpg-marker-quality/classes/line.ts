import { signal, WritableSignal } from "@angular/core";
import { EventCommandCode } from "../enums/event-comand-code.enum";
import { S } from "@angular/cdk/keycodes";


export enum LineType {
    Name = 'Name',
    Message = 'Message',
    Other = 'Other',
    System = 'System'
}

export enum LineStatus {
    New,
    Translated,
    InProgress,
    NeedReview,
    Done
}

export interface ILine { code: number, line: string, type: LineType }


export class Line {
    code: EventCommandCode;
    indent: number;
    parameters: WritableSignal<Array<string | number | boolean>>;

    // aditionasl
    id: number;
    parentId: string;
    type: WritableSignal<LineType>;
    original: ILine;
    status: LineStatus;
    variants: WritableSignal<Record<string, string>> = signal({});

    constructor({ code, indent, parameters }: { code: number, indent: number, parameters: Array<string | number | boolean> }, id: number, type: LineType, parentId: string) {
        this.code = code;
        this.indent = indent;
        this.parameters = signal(parameters);

        this.id = id;
        this.parentId = parentId;
        this.type = signal(type);
        this.original = { code, line: parameters[0] as string, type };
        this.status = LineStatus.New;
    }

    toJSON() {
        return {
            code: this.code,
            indent: this.indent,
            parameters: this.parameters()
        };
    }
}