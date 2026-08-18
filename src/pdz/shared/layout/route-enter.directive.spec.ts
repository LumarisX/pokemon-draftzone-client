import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouteEnterDirective } from './route-enter.directive';

@Component({ selector: 'pdz-first', template: 'first' })
class FirstComponent {}

@Component({ selector: 'pdz-second', template: 'second' })
class SecondComponent {}

@Component({
  template: '<router-outlet pdzRouteEnter></router-outlet>',
  imports: [RouterOutlet, RouteEnterDirective],
})
class ShellComponent {}

describe('RouteEnterDirective', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ShellComponent>>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([
          { path: 'a', component: FirstComponent },
          { path: 'b', component: SecondComponent },
        ]),
      ],
    });
    fixture = TestBed.createComponent(ShellComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  async function goTo(path: string): Promise<HTMLElement> {
    await TestBed.inject(Router).navigate([path]);
    await fixture.whenStable();
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    return outlet.nextElementSibling as HTMLElement;
  }

  it('marks the activated component for the enter animation', async () => {
    const host = await goTo('/a');

    expect(host.tagName.toLowerCase()).toBe('pdz-first');
    expect(host.classList.contains('pdz-route-enter')).toBe(true);
  });

  it('marks the incoming component, not the outgoing one, when swapping routes', async () => {
    await goTo('/a');
    const host = await goTo('/b');

    expect(host.tagName.toLowerCase()).toBe('pdz-second');
    expect(host.classList.contains('pdz-route-enter')).toBe(true);
  });

  it('tags the host only after the render, not while the outlet is activating', async () => {
    const outlet = fixture.debugElement
      .query(By.directive(RouterOutlet))
      .injector.get(RouterOutlet);

    const taggedDuringActivate: boolean[] = [];
    outlet.activateEvents.subscribe(() => {
      const el = fixture.nativeElement.querySelector('router-outlet')
        .nextElementSibling as HTMLElement | null;
      taggedDuringActivate.push(!!el?.classList.contains('pdz-route-enter'));
    });

    const host = await goTo('/a');

    expect(taggedDuringActivate).toEqual([false]);
    expect(host.classList.contains('pdz-route-enter')).toBe(true);
  });

  it('drops the class once the animation ends', async () => {
    const host = await goTo('/a');
    host.dispatchEvent(new Event('animationend'));

    expect(host.classList.contains('pdz-route-enter')).toBe(false);
  });
});
