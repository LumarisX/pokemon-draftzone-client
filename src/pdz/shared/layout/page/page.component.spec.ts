import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  PageSection,
  PageSectionsComponent,
} from '@pdz/shared/layout/page-sections/page-sections.component';
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

  describe('with page sections', () => {
    @Component({
      imports: [PageComponent, PageSectionsComponent],
      template: `
        <pdz-page type="detail">
          @if (wrapped()) {
            <pdz-page-sections [sections]="sections()" />
          }
        </pdz-page>
      `,
    })
    class HostComponent {
      readonly wrapped = signal(true);
      readonly sections = signal<PageSection[]>([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ]);
    }

    function page(
      setup: (host: HostComponent) => void = () => undefined,
    ): HTMLElement {
      const fixture = TestBed.createComponent(HostComponent);
      setup(fixture.componentInstance);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('pdz-page');
    }

    it('widens for a nested section nav', () => {
      expect(page().hasAttribute('data-section-nav')).toBe(true);
    });

    it('keeps its width when the sections have no links', () => {
      expect(
        page((host) => host.sections.set([])).hasAttribute('data-section-nav'),
      ).toBe(false);
    });

    it('keeps its width for a single section', () => {
      expect(
        page((host) =>
          host.sections.set([{ id: 'a', label: 'A' }]),
        ).hasAttribute('data-section-nav'),
      ).toBe(false);
    });

    it('keeps its width without page sections', () => {
      expect(
        page((host) => host.wrapped.set(false)).hasAttribute(
          'data-section-nav',
        ),
      ).toBe(false);
    });
  });
});
