import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { map } from 'rxjs';

interface UrlAnalysis {
  url: string;
  valid: boolean;
  warnings: string[];
}

const SUSPICIOUS_KEYWORDS = [
  'login',
  'secure',
  'account',
  'verify',
  'update',
  'confirm',
];
const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const LONG_URL = 200;
const MANY_ENCODED = 5;

function analyzeUrl(url: string): UrlAnalysis {
  const warnings: string[] = [];
  try {
    const parsed = new URL(url);
    const valid = ['http:', 'https:'].includes(parsed.protocol);
    const hostname = parsed.hostname.toLowerCase();

    if (parsed.protocol === 'http:') {
      warnings.push('This site uses HTTP, which is not secure.');
    }
    if (IP_PATTERN.test(hostname)) {
      warnings.push('This link uses an IP address instead of a domain name.');
    }
    if (
      !hostname.includes('pokemon') &&
      SUSPICIOUS_KEYWORDS.some((keyword) => hostname.includes(keyword))
    ) {
      warnings.push('The address contains words often used in phishing.');
    }
    if (url.length > LONG_URL) {
      warnings.push('This is an unusually long link.');
    }
    if ((url.match(/%/g) ?? []).length > MANY_ENCODED) {
      warnings.push('The link contains many encoded characters.');
    }
    return { url, valid, warnings };
  } catch {
    return {
      url,
      valid: false,
      warnings: ['This does not look like a valid link.'],
    };
  }
}

@Component({
  selector: 'pdz-external-link',
  imports: [ButtonComponent, CardComponent, IconComponent, PageComponent],
  templateUrl: './external-link.component.html',
  styleUrl: './external-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalLinkComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  private readonly rawUrl = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('url'))),
  );

  readonly analysis = computed(() => {
    const url = this.rawUrl();
    return url ? analyzeUrl(decodeURIComponent(url)) : null;
  });

  readonly tips = [
    'Check that the domain matches the site you expect.',
    'Look for HTTPS in the address.',
    "Never enter sensitive information on a site you don't recognize.",
    'When in doubt, search for the site directly.',
    'Repels have no use once in battle!',
  ];

  goBack(): void {
    if (window.history.length > 1) this.location.back();
    else window.close();
  }
}
