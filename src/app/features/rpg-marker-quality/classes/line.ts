

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
    code: number;
    indent: number;
    parameters: Array<string | number | boolean>;
    variants: Record<string, string> = {};

    // aditionasl
    id: number;
    type: LineType;
    originalLine: string | number | boolean;
    status: LineStatus;

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