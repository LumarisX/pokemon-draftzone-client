import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../interfaces/notification.interface';

@Injectable({
  providedIn: 'root'
})
export class LeagueNotificationService {
  private notificationsSubject: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private notificationIdCounter = 0;
  private readonly FADE_OUT_DURATION = 500; // Milliseconds, matches SCSS animation duration

  constructor() { }

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', timeout: number = 10000): void {
    const id = `notification-${this.notificationIdCounter++}`;
    const newNotification: Notification = { id, message, type, timeout, fadingOut: false };
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([newNotification, ...currentNotifications]); // Newest on top

    if (timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }
  }

  dismiss(id: string): void {
    let currentNotifications = this.notificationsSubject.getValue();
    const notificationToFade = currentNotifications.find(n => n.id === id);

    if (notificationToFade) {
      notificationToFade.fadingOut = true;
      this.notificationsSubject.next([...currentNotifications]); // Trigger change detection to apply fade-out class

      setTimeout(() => {
        currentNotifications = this.notificationsSubject.getValue();
        this.notificationsSubject.next(currentNotifications.filter(n => n.id !== id));
      }, this.FADE_OUT_DURATION);
    }
  }
}
