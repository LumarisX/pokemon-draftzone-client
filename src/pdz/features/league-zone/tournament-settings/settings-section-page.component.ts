import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { RiskBannerComponent } from './risk-banner.component';
import { SaveBarComponent } from './save-bar.component';
import { SettingsNodeComponent } from './settings-node.component';
import {
  AnyNode,
  SettingsNode,
  SettingsSectionId,
  TIER_LIST_GATE_REASON,
  nodeVisible,
  nodesForSection,
  sectionById,
  sectionRisk,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-settings-section-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
    RiskBannerComponent,
    SaveBarComponent,
    SettingsNodeComponent,
  ],
  templateUrl: './settings-section-page.component.html',
  styleUrl: './settings-section-page.component.scss',
})
export class SettingsSectionPageComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly dialog = inject(DialogService);
  private readonly routeData = toSignal(inject(ActivatedRoute).data);

  protected readonly section = computed(() =>
    sectionById(this.routeData()?.['section'] as SettingsSectionId),
  );

  protected readonly risk = computed(() =>
    sectionRisk(this.section(), this.store.phase()),
  );

  private readonly tierListAttached = computed(
    () => this.store.artifacts().tierList.name !== null,
  );

  protected readonly nodes = computed(() => {
    const value = this.store.draft();
    const attached = this.tierListAttached();
    return nodesForSection(this.section().id)
      .filter((node) => nodeVisible(node as AnyNode, value))
      .map((node) => ({
        node,
        locked: this.isGated(node, attached),
      }));
  });

  private isGated(node: SettingsNode, tierListAttached: boolean): boolean {
    return node.requiresTierList === true && !tierListAttached;
  }

  protected readonly gateReason = TIER_LIST_GATE_REASON;

  protected readonly dirty = computed(() =>
    this.store.sectionDirtyCount(this.section().id),
  );

  protected readonly blocked = computed(() =>
    this.store.sectionHasErrors(this.section().id),
  );

  protected async save(): Promise<void> {
    const risk = this.risk();
    if (risk?.effect === 'block') {
      const confirmed = await this.dialog.confirm(
        `Save ${this.section().label}?`,
        {
          message: risk.because,
          confirmLabel: 'Save anyway',
          confirmColor: 'danger',
        },
      );
      if (!confirmed) return;
    }
    this.store.saveSection(this.section().id).subscribe();
  }

  protected revert(): void {
    this.store.revertSection(this.section().id);
  }
}
