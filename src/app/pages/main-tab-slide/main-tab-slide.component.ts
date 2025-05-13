import {
  Component,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable, of, Subject } from 'rxjs';
import { filter, startWith, takeUntil } from 'rxjs/operators';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';

interface TabInfo {
  title: string;
  route: string;
  badge?: Observable<string | number | null | undefined>;
}

@Component({
  selector: 'pdz-main-tab-slide',
  standalone: true,
  imports: [CommonModule, RouterModule, MatBadgeModule],
  templateUrl: './main-tab-slide.component.html',
  styleUrls: ['./main-tab-slide.component.scss'],
})
export class YourTabsComponent implements OnInit, AfterViewInit, OnDestroy {
  TABS: TabInfo[] = [
    {
      title: 'Home',
      route: '/',
      badge: of(''),
    },
    {
      title: 'My Drafts',
      route: '/' + DraftOverviewPath,
      badge: of(''),
    },
    {
      title: 'My Leagues',
      route: '/leagues',
      badge: of(''),
    },
    {
      title: 'Tools',
      route: '/tools',
      badge: of(''),
    },
  ];

  @ViewChildren('tabButton') tabRefs!: QueryList<ElementRef<HTMLButtonElement>>;
  selectedTabIndex: number | null = null;
  sliderStyle: { [key: string]: string } = { visibility: 'hidden' };
  private destroy$ = new Subject<void>();
  private initialCheckDone = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        startWith(null),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateSelectedTabBasedOnRoute();
        if (this.tabRefs?.length) {
          setTimeout(() => this.updateSliderPosition(), 0);
        } else {
          this.initialCheckDone = false;
        }
      });
  }

  ngAfterViewInit(): void {
    this.updateSelectedTabBasedOnRoute();
    setTimeout(() => this.updateSliderPosition(), 0);

    this.tabRefs.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateSelectedTabBasedOnRoute();
      setTimeout(() => this.updateSliderPosition(), 0);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateSelectedTabBasedOnRoute(): void {
    const currentRoute = this.router.url;
    console.log('Current Route:', currentRoute);
    console.log('DraftOverviewPath value:', DraftOverviewPath);

    let bestMatchIndex = -1;
    let longestMatchLength = 0;

    this.TABS.forEach((tab, index) => {
      if (tab.route === '/' && currentRoute === '/') {
        if (1 > longestMatchLength) {
          longestMatchLength = 1;
          bestMatchIndex = index;
        }
      } else if (tab.route !== '/' && currentRoute.startsWith(tab.route)) {
        if (tab.route.length > longestMatchLength) {
          longestMatchLength = tab.route.length;
          bestMatchIndex = index;
        }
      }
    });

    if (bestMatchIndex !== -1) {
      this.selectedTabIndex = bestMatchIndex;
    } else {
      this.selectedTabIndex = null;
    }
    this.initialCheckDone = true;
  }

  selectTab(index: number): void {}

  updateSliderPosition(): void {
    if (
      this.selectedTabIndex === null ||
      !this.tabRefs ||
      this.tabRefs.length <= this.selectedTabIndex
    ) {
      this.sliderStyle = { visibility: 'hidden' };
      this.cdr.detectChanges();
      return;
    }

    const selectedTabElement =
      this.tabRefs.toArray()[this.selectedTabIndex].nativeElement;

    if (selectedTabElement && selectedTabElement.offsetWidth > 0) {
      const parentOffsetLeft =
        (selectedTabElement.offsetParent as HTMLElement)?.offsetLeft ?? 0;
      const tabOffsetLeft = selectedTabElement.offsetLeft;

      const sliderLeft = tabOffsetLeft;
      const sliderWidth = selectedTabElement.offsetWidth;

      this.sliderStyle = {
        visibility: 'visible',
        width: `${sliderWidth}px`,
        left: `${sliderLeft}px`,
      };
    } else {
      this.sliderStyle = { visibility: 'hidden' };
    }

    this.cdr.detectChanges();
  }

  isSelected(index: number): boolean {
    return this.selectedTabIndex === index;
  }
}
