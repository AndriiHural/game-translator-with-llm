import { Component, effect, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-translate-table',
  imports: [NgClass],
  templateUrl: './translate-table.html',
  styleUrl: './translate-table.scss',
})
export class TranslateTable {
  readonly data = input.required<string[][]>();
  readonly headerCells = input.required<string[]>();
  readonly original = input.required<string[][]>();
  readonly sourceColIndex = input.required<number>();
  readonly targetColIndex = input.required<number>();

  readonly dataChange = output<string[][]>();
  readonly retryRow = output<number>();

  onCellChange(row: number, col: number, value: string) {
    const current = [...this.data()];
    current[row][col] = value;
    this.dataChange.emit(current);
  }

  retryTranslate(rowIndex: number) {
    this.retryRow.emit(rowIndex);
  }
}
