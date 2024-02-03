import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreModule } from '../sprite/sprite.module';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { concatMap, map, tap } from 'rxjs';
import { AuthHttpInterceptor } from '@auth0/auth0-angular';

@Component({
  selector: 'test',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule],
  template: `
    <div class="p-2 m-2 border-2 bg-cyan-100 rounded-xl border-cyan-200">
      <ul *ngIf="auth.user$ | async as user">
        <li>{{ user.name }}</li>
        <li>{{ user.email }}</li>
        <li>
          <img src="{{ user.picture }}" class="rounded-full" />
        </li>
      </ul>
      <div *ngIf="metadata">
        <pre>{{ metadata | json }}</pre>
      </div>
    </div>
  `,
})
export class TestComponent implements OnInit {
  metadata = {};

  // Inject both AuthService and HttpClient
  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.auth.user$
      .pipe(
        concatMap((user) =>
          // Use HttpClient to make the call
          this.http.get(
            encodeURI(
              `https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/users/${user?.sub}`
            )
          )
        ),
        map((user: any) => user.user_metadata),
        tap((meta) => (this.metadata = meta))
      )
      .subscribe();
  }
}
