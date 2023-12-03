import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpriteComponent } from './sprite.component';

describe('SpriteComponent', () => {
  let component: SpriteComponent;
  let fixture: ComponentFixture<SpriteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpriteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SpriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
