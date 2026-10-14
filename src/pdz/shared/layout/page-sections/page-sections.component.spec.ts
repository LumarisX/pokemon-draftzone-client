import { TestBed } from '@angular/core/testing';
import { PageSection, PageSectionsComponent } from './page-sections.component';

describe('PageSectionsComponent', () => {
  const sections: PageSection[] = [
    { id: 'pool-a', label: 'Pool A', count: 12 },
    { id: 'pool-b', label: 'Pool B' },
  ];

  function render(list = sections): HTMLElement {
    const fixture = TestBed.createComponent(PageSectionsComponent);
    fixture.componentRef.setInput('sections', list);
    fixture.componentRef.setInput('heading', 'Pools');
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('links to every section', () => {
    const links = Array.from(
      render().querySelectorAll<HTMLAnchorElement>('.pdz-page-sections__link'),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#pool-a',
      '#pool-b',
    ]);
  });

  it('shows a count only when one is given', () => {
    const counts = render().querySelectorAll('.pdz-page-sections__count');
    expect(counts).toHaveLength(1);
    expect(counts[0].textContent).toBe('12');
  });

  it.each([
    ['no sections', []],
    ['a single section', [sections[0]]],
  ])('hides the nav and its column with %s', (_, list) => {
    const host = render(list);
    expect(host.querySelector('nav')?.hidden).toBe(true);
    expect(
      host.querySelector('.pdz-page-sections')?.hasAttribute('data-nav'),
    ).toBe(false);
  });

  it('labels the nav with its heading', () => {
    expect(render().querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Pools',
    );
  });
});
