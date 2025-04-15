import { TestBed } from '@angular/core/testing';

import { OwnershipService } from './ownership.service';

describe('OwnershipService', () => {
  let service: OwnershipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnershipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
