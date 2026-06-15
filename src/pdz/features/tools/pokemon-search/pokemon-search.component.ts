import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SaveSearchesServices, SavedSearch } from './save-searches.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PokemonSearchCoreComponent } from './pokemon-search-core/pokemon-search-core.component';
import {
  FIELD_DEFINITIONS,
  OPERATOR_MAP,
  SearchFilter,
} from './pokemon-search.types';

@Component({
  selector: 'pdz-pokemon-search',
  templateUrl: './pokemon-search.component.html',
  styleUrl: './pokemon-search.component.scss',
  imports: [CommonModule, PokemonSearchCoreComponent, IconComponent],
})
export class PokemonSearchComponent {
  private router = inject(Router);
  private bookmarkService = inject(SaveSearchesServices);

  private readonly fields = FIELD_DEFINITIONS;

  bookmarksPanelOpen = false;
  savedSearches: SavedSearch[] = [];

  openBookmarksPanel(): void {
    this.savedSearches = this.bookmarkService
      .getSavedSearches()
      .slice()
      .reverse();
    this.bookmarksPanelOpen = true;
  }

  closeBookmarksPanel(): void {
    this.bookmarksPanelOpen = false;
  }

  loadSavedSearch(search: SavedSearch): void {
    this.closeBookmarksPanel();
    const url = new URL(search.href);
    this.router.navigateByUrl(url.pathname + url.search);
  }

  deleteSavedSearch(search: SavedSearch): void {
    this.bookmarkService.remove(search.params);
    this.savedSearches = this.bookmarkService
      .getSavedSearches()
      .slice()
      .reverse();
  }

  getSearchLabel(search: SavedSearch): { chips: string[]; remainder: number } {
    const params = new URLSearchParams(search.params);
    const q = params.get('q');
    if (q) {
      return { chips: [q], remainder: 0 };
    }
    const query = params.get('query');
    if (query) {
      try {
        const parsed = JSON.parse(query) as {
          mode?: string;
          searches?: SearchFilter[];
        };
        const filters = parsed.searches ?? [];
        const chips = filters.slice(0, 3).map((f) => {
          const fieldDef = this.getFieldDefinition(f.field);
          const op = OPERATOR_MAP[f.operator]?.symbol ?? f.operator;
          return `${fieldDef.label} ${op} ${f.value ?? ''}`.trim();
        });
        return { chips, remainder: Math.max(0, filters.length - 3) };
      } catch {}
    }
    return { chips: [], remainder: 0 };
  }

  getSearchMeta(search: SavedSearch): string {
    const params = new URLSearchParams(search.params);
    const ruleset = params.get('ruleset') ?? '';
    const searchMode = params.get('searchMode') ?? 'quick';
    const parts = [searchMode === 'quick' ? 'Quick' : 'Advanced'];
    if (ruleset) parts.push(ruleset);
    return parts.join(' · ');
  }

  formatSavedDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private getFieldDefinition(field: string) {
    return this.fields.find((entry) => entry.key === field) ?? this.fields[0];
  }
}
