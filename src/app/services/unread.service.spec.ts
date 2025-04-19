import { TestBed } from '@angular/core/testing';

import { UnreadService } from './unread.service';

describe('UnreadService', () => {
  let service: UnreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
