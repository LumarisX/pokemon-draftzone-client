import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'pdz-external-link',
  imports: [MatIconModule],
  templateUrl: './external-link.component.html',
  styleUrl: './external-link.component.scss',
})
export class ExternalLinkComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  externalUrl: string | null = null;
  displayUrl: string | null = null;
  isValidUrl = false;
  urlWarnings: string[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const url = params['url'];
      if (url) {
        this.externalUrl = decodeURIComponent(url);
        this.analyzeUrl(this.externalUrl);
      }
    });
  }

  private analyzeUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      this.displayUrl = parsedUrl.hostname + parsedUrl.pathname;
      this.isValidUrl = ['http:', 'https:'].includes(parsedUrl.protocol);

      this.urlWarnings = [];

      if (parsedUrl.protocol === 'http:') {
        this.urlWarnings.push('This site uses HTTP (not secure)');
      }

      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipPattern.test(parsedUrl.hostname)) {
        this.urlWarnings.push(
          'This URL uses an IP address instead of a domain name',
        );
      }

      const suspiciousPatterns = [
        'login',
        'secure',
        'account',
        'verify',
        'update',
        'confirm',
      ];
      const hostnameLower = parsedUrl.hostname.toLowerCase();
      for (const pattern of suspiciousPatterns) {
        if (
          hostnameLower.includes(pattern) &&
          !hostnameLower.includes('pokemon')
        ) {
          this.urlWarnings.push('URL contains potentially suspicious keywords');
          break;
        }
      }

      if (url.length > 200) {
        this.urlWarnings.push('This is an unusually long URL');
      }
      if (url.includes('%') && (url.match(/%/g) || []).length > 5) {
        this.urlWarnings.push('URL contains many encoded characters');
      }
    } catch {
      this.isValidUrl = false;
      this.displayUrl = url;
      this.urlWarnings.push('This does not appear to be a valid URL');
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      window.close();
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
