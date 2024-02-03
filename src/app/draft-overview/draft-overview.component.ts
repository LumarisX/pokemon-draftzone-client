import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { DraftFormComponent } from './draft-form/draft-form.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    DraftPreviewComponent,
    DraftFormComponent,
    SpriteComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-overview.component.html',
})
export class DraftOverviewComponent {
  constructor() {}
}
