import { EventCommandCode } from "../enums/event-comand-code.enum";


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


export class Line {
    code: EventCommandCode;
    indent: number;
    parameters: Array<string | number | boolean>;

    // aditionasl
    id: number;
    type: LineType;
    originalLine: string | number | boolean;
    status: LineStatus;
    variants: Record<string, string> = {};

    constructor({ code, indent, parameters }: { code: number, indent: number, parameters: Array<string | number | boolean> }, id: number, type: LineType) {
        this.code = code;
        this.indent = indent;
        this.parameters = parameters;

        this.id = id;
        this.type = type;
        this.originalLine = parameters[0];
        this.status = LineStatus.New;
    }

    toJSON() {
        return {
            code: this.code,
            indent: this.indent,
            parameters: this.parameters
        };
    }
}