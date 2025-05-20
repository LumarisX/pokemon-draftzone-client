import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormatSelectComponent } from '../../../util/format-select/format.component';
import { RulesetSelectComponent } from '../../../util/ruleset-select/ruleset.component';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export type QDSettings = {
  rerolls: number;
  tiers: [string, number][];
  format: string;
  ruleset: string;
};

type Template = {
  rerolls: number;
  tiers: [string, number][];
};

@Component({
  selector: 'pdz-quick-draft-setting',
  imports: [
    CommonModule,
    FormsModule,
    FormatSelectComponent,
    RulesetSelectComponent,
    MatButtonModule,
  ],
  templateUrl: './quick-draft-setting.component.html',
  styleUrls: [
    './quick-draft-setting.component.scss',
    '../quick-draft.component.scss',
  ],
})
export class QuickDraftSettingComponent {
  ruleset = 'Gen9 NatDex';
  format = 'Singles';
  selectedTemplate = 1;
  templates: Template[] = [
    {
      rerolls: 0,
      tiers: [
        ['OU', 1],
        ['UU', 1],
        ['RU', 1],
        ['NU', 1],
        ['PU', 1],
        ['ZU', 1],
      ],
    },
    {
      rerolls: 1,
      tiers: [
        ['OU', 1],
        ['UU', 2],
        ['RU', 2],
        ['NU', 1],
        ['PU', 1],
        ['ZU', 1],
      ],
    },
    {
      rerolls: 2,
      tiers: [
        ['Uber', 1],
        ['OU', 2],
        ['UU', 2],
        ['RU', 2],
        ['NU', 2],
        ['PU', 1],
      ],
    },
  ];

  doublesTemplates: Template[] = [
    {
      rerolls: 1,
      tiers: [
        ['DOU', 2],
        ['DUU', 4],
      ],
    },
    {
      rerolls: 1,
      tiers: [
        ['DUber', 1],
        ['DOU', 3],
        ['DUU', 4],
      ],
    },
  ];

  get formatTemplates() {
    if (this.format === 'VGC' || this.format === 'Doubles')
      return this.doublesTemplates;
    return this.templates;
  }

  @Output()
  settingsUpdated = new EventEmitter<QDSettings | undefined>();

  continue() {
    this.settingsUpdated.emit({
      ...this.formatTemplates[this.selectedTemplate],
      format: this.format,
      ruleset: this.ruleset,
    });
  }

  getTotalPicks(template: Template) {
    return template.tiers.reduce((count, tier) => {
      return count + tier[1];
    }, 0);
  }
}
