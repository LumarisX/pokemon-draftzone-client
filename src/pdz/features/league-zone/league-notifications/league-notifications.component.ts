import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { LeagueNotificationService } from '../league-notification.service';
import { Notification } from './notification.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pdz-league-notifications',
  templateUrl: './league-notifications.component.html',
  styleUrls: ['./league-notifications.component.scss'],
})
export class LeagueNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();
  private notificationService = inject(LeagueNotificationService);

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }
}
