import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColReplacement } from './csv-merger';

describe('ColReplacement', () => {
  let component: ColReplacement;
  let fixture: ComponentFixture<ColReplacement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColReplacement],
    }).compileComponents();

    fixture = TestBed.createComponent(ColReplacement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
