import { AsyncPipe } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@pdz/core/services/auth0.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'pdz-login-button',
  imports: [
    AsyncPipe,
    OverlayModule,
    IconComponent,
    SettingsDialogComponent,
  ],
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
})
export class LoginButtonComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settingsService = inject(SettingsService);

  @ViewChild('settingsDialog') settingsDialog!: SettingsDialogComponent;

  authenticated: boolean = false;
  menuOpen = false;

  /** Right-aligned so the user menu stays within the viewport edge. */
  readonly menuPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];

  ngOnInit(): void {
    this.initAuthSubscription();
  }

  private initAuthSubscription(): void {
    this.auth.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authenticated) => {
        this.authenticated = authenticated;
        if (authenticated) {
          this.loadSettings();
        }
      });
  }

  private loadSettings(): void {
    this.settingsService
      .getSettings()
      .pipe(
        take(1),
        switchMap((serverSettings) => {
          if (serverSettings) {
            this.settingsService.setSettings(serverSettings, {
              source: 'server',
            });
            return of(null);
          }
          // Fallback to user settings if no server settings
          return this.auth.user$.pipe(take(1));
        }),
      )
      .subscribe((userData) => {
        if (userData?.settings) {
          this.settingsService.setSettings(userData.settings, {
            source: 'server',
          });
        }
      });
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.menuOpen = false;
    }
  }
}
