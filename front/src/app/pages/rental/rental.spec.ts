import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rental } from './rental';

describe('Rental', () => {
  let component: Rental;
  let fixture: ComponentFixture<Rental>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rental]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rental);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
