import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import {
  PageSection,
  PageSectionsComponent,
} from '@pdz/shared/layout/page-sections/page-sections.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  LEGAL_CONTACT_EMAIL,
  LegalDocument,
  LegalDocumentKey,
} from './legal-document';
import { PRIVACY_POLICY } from './privacy.content';
import { TERMS_OF_SERVICE } from './terms.content';

const DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
};

@Component({
  selector: 'pdz-legal-page',
  imports: [PageComponent, PageHeaderComponent, PageSectionsComponent],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly contactEmail = LEGAL_CONTACT_EMAIL;
  protected readonly document: LegalDocument =
    DOCUMENTS[(this.route.snapshot.data['document'] as LegalDocumentKey) ?? 'privacy'];
  protected readonly sections: PageSection[] = this.document.sections.map(
    ({ id, label }) => ({ id, label }),
  );
}
