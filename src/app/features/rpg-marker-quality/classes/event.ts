import { Line, LineType } from "./line";
import { Page } from "./page";

export enum EventStatus {
    New = 0,
    Edited = 1,
    InProgress = 2,
    NeedReview = 3,
    Done = 4
}

export class SceneEvent {
    id: number;
    name: string;
    note: string;
    pages: Array<Page>;
    x: number;
    y: number;

    // aditionasl
    status: EventStatus;
    originalEvent: SceneEvent | null;

    constructor(event: any | null, status: EventStatus = EventStatus.New) {
        this.originalEvent = event;

        if (event === null) {
            this.id = 0;
            this.name = '';
            this.note = '';
            this.pages = [];
            this.x = 0;
            this.y = 0;
            this.status = status;
            return;
        }
        this.id = event.id;
        this.name = event.name;
        this.note = event.note;
        this.pages = this.mapLines(event.pages);
        this.x = event.x;
        this.y = event.y;

        this.status = status;
    }

    toJSON() {
        if (!this.originalEvent) {
            return null;
        }
        return {
            id: this.id,
            name: this.name,
            note: this.note,
            pages: this.pages,
            x: this.x,
            y: this.y
        };
    }

    getLinesForPage(pageNumber: number): Array<Line> {
        return this.pages[pageNumber].list.filter(line => line.type() === LineType.Message || line.type() === LineType.Name);
    }

    private mapLines(pages: Array<{ list: Array<any> }>,): Array<Page> {
        if (!pages) {
            return [];
        }

        return pages.map((page, index) => new Page(page, this.id + '_' + index));
    }
}