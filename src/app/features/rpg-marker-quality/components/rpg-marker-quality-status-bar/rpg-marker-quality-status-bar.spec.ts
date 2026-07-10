import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgMarkerQualityStatusBar } from './rpg-marker-quality-status-bar';

describe('RpgMarkerQualityStatusBar', () => {
  let component: RpgMarkerQualityStatusBar;
  let fixture: ComponentFixture<RpgMarkerQualityStatusBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgMarkerQualityStatusBar],
    }).compileComponents();

    fixture = TestBed.createComponent(RpgMarkerQualityStatusBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
