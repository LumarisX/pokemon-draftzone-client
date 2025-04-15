import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService],
    });
    dataService = TestBed.inject(DataService);
  });

  it('creates a service', () => {
    expect(dataService).toBeTruthy();
  });
});
