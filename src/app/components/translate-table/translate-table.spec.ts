import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateTable } from './translate-table';

describe('TranslateTable', () => {
  let component: TranslateTable;
  let fixture: ComponentFixture<TranslateTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateTable],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslateTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
