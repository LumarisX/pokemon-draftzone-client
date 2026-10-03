import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiService } from '@pdz/core/services/api.service';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { UploadService } from '@pdz/core/services/upload.service';
import { LeagueZoneService } from './league-zone.service';

const seen: Array<[string | null, string | null]> = [];

@Component({ template: '' })
class ReadsSlugsOnCreate {
  constructor() {
    const service = inject(LeagueZoneService);
    seen.push([service.leagueSlug(), service.tournamentSlug()]);
  }
}

describe('LeagueZoneService route slugs', () => {
  beforeEach(() => {
    seen.length = 0;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: 'leagues/:leagueSlug/tournaments/:tournamentSlug',
              children: [
                { path: 'matchups/:matchupSlug', component: ReadsSlugsOnCreate },
                { path: 'a', component: ReadsSlugsOnCreate },
                { path: 'b', component: ReadsSlugsOnCreate },
              ],
            },
          ],
          withRouterConfig({ paramsInheritanceStrategy: 'always' }),
        ),
        { provide: ApiService, useValue: {} },
        { provide: UploadService, useValue: {} },
        { provide: EventStreamService, useValue: { open: jest.fn(), close: jest.fn() } },
      ],
    });
  });

  it('has the slugs when a routed component is constructed on first load', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/leagues/tbpl/tournaments/s12/matchups/abc');
    expect(seen).toEqual([['tbpl', 's12']]);
  });

  it('has the new slugs, not the previous ones, after an in-app navigation', async () => {
    const harness = await RouterTestingHarness.create();
    TestBed.inject(LeagueZoneService);
    await harness.navigateByUrl('/leagues/tbpl/tournaments/s12/a');
    await harness.navigateByUrl('/leagues/other/tournaments/s1/b');
    expect(seen.at(-1)).toEqual(['other', 's1']);
  });
});
