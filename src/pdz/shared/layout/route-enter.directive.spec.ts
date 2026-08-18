import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouteEnterDirective } from './route-enter.directive';

@Component({ template: 'routed' })
class RoutedComponent {}

@Component({
  template: '<router-outlet pdzRouteEnter></router-outlet>',
  imports: [RouterOutlet, RouteEnterDirective],
})
class ShellComponent {}

describe('RouteEnterDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([{ path: 'a', component: RoutedComponent }])],
    });
  });

  it('marks the activated component for the enter animation', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    await TestBed.inject(Router).navigate(['/a']);
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector('router-outlet');
    const host = outlet.nextElementSibling as HTMLElement;

    expect(host).toBeTruthy();
    expect(host.classList.contains('pdz-route-enter')).toBe(true);
  });

  it('drops the class once the animation ends', async () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    await TestBed.inject(Router).navigate(['/a']);
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector('router-outlet');
    const host = outlet.nextElementSibling as HTMLElement;
    host.dispatchEvent(new Event('animationend'));

    expect(host.classList.contains('pdz-route-enter')).toBe(false);
  });
});
