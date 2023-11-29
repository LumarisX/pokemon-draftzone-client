import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypechartComponent } from './typechart.component';

describe('TypechartComponent', () => {
  let component: TypechartComponent;
  let fixture: ComponentFixture<TypechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypechartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TypechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
