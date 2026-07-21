import { Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DraftService } from '../../draft.service';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { DraftPokemon } from '../../../draft.model';
import {
  DraftFormCoreComponent,
  DraftFormData,
} from '../draft-form-core/draft-form-core.component';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';

@Component({
  selector: 'pdz-draft-form-new',
  imports: [DraftFormCoreComponent],
  templateUrl: './draft-form-new.component.html',
  styleUrl: '../draft-form.component.scss',
})
export class DraftFormNewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private draftService = inject(DraftService);
  private location = inject(Location);

  params: { team?: DraftPokemon[] } = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('team' in params) {
        this.params.team = (params['team'] as string[]).map((id) => ({
          id: id,
          name: getNameByPid(id),
        }));
      }
      this.location.replaceState(this.location.path().split('?')[0]);
    });
  }

  newDraft(formData: DraftFormData) {
    this.draftService.newDraft(formData).subscribe({
      next: () => {
        this.router.navigate(['/', DRAFT_OVERVIEW_PATH]);
      },
      error: (error) => console.error('Error!', error),
    });
  }
}
