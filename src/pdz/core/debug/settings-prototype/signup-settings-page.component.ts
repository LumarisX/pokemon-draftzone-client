import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ApplicantsPanelComponent } from './applicants-panel.component';
import { RiskBannerComponent } from './risk-banner.component';
import { SaveBarComponent } from './save-bar.component';
import { SettingsNodeComponent } from './settings-node.component';
import {
  AnyNode,
  nodeVisible,
  nodesForSection,
  sectionById,
  sectionRisk,
} from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

@Component({
  selector: 'pdz-signup-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ApplicantsPanelComponent,
    CardComponent,
    PageComponent,
    PageHeaderComponent,
    RiskBannerComponent,
    SaveBarComponent,
    SettingsNodeComponent,
  ],
  templateUrl: './signup-settings-page.component.html',
  styleUrl: './signup-settings-page.component.scss',
})
export class SignupSettingsPageComponent {
  protected readonly store = inject(SettingsWorkbenchStore);
  private readonly dialog = inject(DialogService);

  protected readonly section = sectionById('signup');

  protected readonly risk = computed(() =>
    sectionRisk(this.section, this.store.phase()),
  );

  protected readonly rules = computed(() => {
    const value = this.store.draft();
    return nodesForSection('signup').filter((node) =>
      nodeVisible(node as AnyNode, value),
    );
  });

  protected readonly dirty = computed(() =>
    this.store.sectionDirtyCount('signup'),
  );

  protected readonly blocked = computed(() =>
    this.store.sectionHasErrors('signup'),
  );

  protected readonly counts = computed(() => this.store.statusCounts());

  protected async save(): Promise<void> {
    const risk = this.risk();
    if (risk?.effect === 'block') {
      const confirmed = await this.dialog.confirm('Save sign-up settings?', {
        message: risk.because,
        confirmLabel: 'Save anyway',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
    }
    this.store.saveSection('signup');
  }

  protected revert(): void {
    this.store.revertSection('signup');
  }
}
