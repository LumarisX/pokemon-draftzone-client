import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Archive } from '../archive-stats/archive.model';
import { ArchiveService } from './archive.service';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pdz-draft-archives',
  templateUrl: './draft-archives.component.html',
  styleUrl: './draft-archives.component.scss',

  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    MatIconModule,
  ],
})
export class DraftArchiveComponent {
  private archiveService = inject(ArchiveService);

  archives!: (Archive & { menu?: 'main' | 'delete' })[];
  backPath: string = DRAFT_OVERVIEW_PATH;

  menuState: {
    [key: string]: '' | 'confirm-delete';
  } = {};

  openDropdown: string | null = null;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.archiveService.getDraftsList().subscribe((data) => {
      this.archives = data;
      for (let archive of this.archives) {
        archive.menu = 'main';
      }
      console.log(this.archives);
    });
  }

  delete(id: string) {
    this.archiveService.deleteDraft(id).subscribe((data) => {
      this.reload();
    });
  }

  setMenuState(tournamentId: string, state: '' | 'confirm-delete') {
    this.menuState[tournamentId] = state;
  }

  toggleMenu(tournamentId: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.openDropdown !== tournamentId) {
      this.openDropdown = tournamentId;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.closeDropdown();
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  scoreString(archive: Archive) {
    if (archive.score) return `${archive.score.wins} - ${archive.score.losses}`;
    return `Unscored`;
  }

  scoreClass(archive: Archive) {
    if (!archive.score) return 'pdz-background-neut';
    if (archive.score.wins > archive.score.losses) return 'pdz-background-pos';
    if (archive.score.wins < archive.score.losses) return 'pdz-background-neg';
    return 'pdz-background-neut';
  }
}
