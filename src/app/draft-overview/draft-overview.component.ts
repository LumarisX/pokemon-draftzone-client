import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../images/sprite.component';
import { DraftFormCoreComponent } from './draft-form/draft-form-core/draft-form-core.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DraftPreviewComponent,
    DraftFormCoreComponent,
    SpriteComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-overview.component.html',
})
export class DraftOverviewComponent {
  constructor() {}
}
