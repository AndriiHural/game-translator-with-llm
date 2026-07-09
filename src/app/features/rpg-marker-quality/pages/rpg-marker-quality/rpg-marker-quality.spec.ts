import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpgMarkerQuality } from './rpg-marker-quality';

describe('RpgMarkerQuality', () => {
  let component: RpgMarkerQuality;
  let fixture: ComponentFixture<RpgMarkerQuality>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpgMarkerQuality],
    }).compileComponents();

    fixture = TestBed.createComponent(RpgMarkerQuality);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
