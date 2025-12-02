import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Announcement } from '../announcement-page/announcement-page';

describe('Announcement', () => {
  let component: Announcement;
  let fixture: ComponentFixture<Announcement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Announcement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Announcement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
