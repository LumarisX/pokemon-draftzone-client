import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormatSelectComponent } from '../../../util/format-select/format.component';
import { RulesetSelectComponent } from '../../../util/ruleset-select/ruleset.component';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import {
  trigger,
  state,
  query,
  animate,
  group,
  style,
  transition,
} from '@angular/animations';
import { ChatComponent } from '../../../components/chat/chat.component';

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
    MatSliderModule,
    ChatComponent,
  ],
  templateUrl: './quick-draft-setting.component.html',
  styleUrls: [
    './quick-draft-setting.component.scss',
    '../quick-draft.component.scss',
  ],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0',
          overflow: 'hidden',
          paddingTop: '0',
          paddingBottom: '0',
          opacity: '0',
        }),
      ),
      state(
        'expanded',
        style({
          height: '*',
          overflow: 'hidden',
          opacity: '1',
        }),
      ),
      transition('collapsed <=> expanded', [
        group([
          query(
            '.custom-options-container',
            [
              style({ opacity: 0 }),
              animate('300ms ease-in-out', style({ opacity: 1 })),
            ],
            { optional: true },
          ),
          animate('300ms ease-in-out'),
        ]),
      ]),
    ]),
  ],
})
export class QuickDraftSettingComponent {
  ruleset = 'Gen9 NatDex';
  format = 'Singles';
  selectedTemplate: number | null = 1;
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

  customTemplateForm: {
    rerolls: number;
    tiers: [string, number][];
    doubleTiers: [string, number][];
  } = {
    rerolls: 0,
    tiers: [
      ['Uber', 0],
      ['OU', 0],
      ['UU', 0],
      ['RU', 0],
      ['NU', 0],
      ['PU', 0],
    ],
    doubleTiers: [
      ['DUber', 0],
      ['DOU', 0],
      ['DUU', 0],
    ],
  };

  get formatTemplates() {
    if (this.format === 'VGC' || this.format === 'Doubles')
      return this.doublesTemplates;
    return this.templates;
  }

  get customTemplateTiers() {
    if (this.format === 'VGC' || this.format === 'Doubles')
      return this.customTemplateForm.doubleTiers;
    return this.customTemplateForm.tiers;
  }

  @Output()
  settingsUpdated = new EventEmitter<QDSettings | undefined>();

  continue() {
    if (this.selectedTemplate !== null) {
      this.settingsUpdated.emit({
        ...this.formatTemplates[this.selectedTemplate],
        format: this.format,
        ruleset: this.ruleset,
      });
    } else {
      const customTemplate: Template = {
        rerolls: this.customTemplateForm.rerolls,
        tiers: this.customTemplateTiers,
      };
      this.settingsUpdated.emit({
        ...customTemplate,
        format: this.format,
        ruleset: this.ruleset,
      });
    }
  }

  getTotalPicks(template: Template) {
    return template.tiers.reduce((count, tier) => {
      return count + tier[1];
    }, 0);
  }

  validTemplate() {
    const template: Template =
      this.selectedTemplate === null
        ? {
            rerolls: this.customTemplateForm.rerolls,
            tiers: this.customTemplateTiers,
          }
        : this.formatTemplates[this.selectedTemplate];
    const teamSize = template.tiers.reduce((total, tier) => {
      return total + tier[1];
    }, 0);
    return teamSize <= 0;
  }
}
