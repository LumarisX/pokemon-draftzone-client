import { TestBed } from '@angular/core/testing';
import { PageComponent, PageDensity, PageType } from './page.component';

describe('PageComponent', () => {
  function render(type: PageType, density?: PageDensity): HTMLElement {
    const fixture = TestBed.createComponent(PageComponent);
    fixture.componentRef.setInput('type', type);
    if (density) fixture.componentRef.setInput('density', density);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it.each<[PageType, PageDensity]>([
    ['hub', 'comfortable'],
    ['detail', 'comfortable'],
    ['form', 'comfortable'],
    ['index', 'compact'],
    ['workspace', 'compact'],
    ['tool', 'compact'],
    ['dashboard', 'compact'],
  ])('sets %s pages to %s', (type, density) => {
    expect(render(type).dataset['density']).toBe(density);
  });

  it('lets a page ask for the other density', () => {
    expect(render('detail', 'compact').dataset['density']).toBe('compact');
  });
});
