import { Injectable, inject } from '@angular/core';
import {
  ToastService,
  ToastTone,
} from '@pdz/shared/feedback/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueNotificationService {
  private readonly toast = inject(ToastService);
  private readonly toastIds = new Map<string, number>();
  private notificationIdCounter = 0;

  show(message: string, type: ToastTone = 'info', timeout?: number): string {
    const id = `notification-${this.notificationIdCounter++}`;
    const toastId = this.toast.show({
      message,
      tone: type,
      ...(timeout === undefined ? {} : { duration: timeout }),
    });
    this.toastIds.set(id, toastId);
    return id;
  }

  dismiss(id: string): void {
    const toastId = this.toastIds.get(id);
    if (toastId === undefined) return;
    this.toastIds.delete(id);
    this.toast.dismiss(toastId);
  }
}
