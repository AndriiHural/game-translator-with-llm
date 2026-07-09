import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgMarkerQualityEditor } from './rpg-marker-quality-editor';

describe('RpgMarkerQualityEditor', () => {
  let component: RpgMarkerQualityEditor;
  let fixture: ComponentFixture<RpgMarkerQualityEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgMarkerQualityEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(RpgMarkerQualityEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
