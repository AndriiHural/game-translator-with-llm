import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Naninovel } from './naninovel';

describe('Naninovel', () => {
  let component: Naninovel;
  let fixture: ComponentFixture<Naninovel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Naninovel],
    }).compileComponents();

    fixture = TestBed.createComponent(Naninovel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
