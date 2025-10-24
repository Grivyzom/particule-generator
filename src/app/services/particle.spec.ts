import { TestBed } from '@angular/core/testing';

import { Particle } from './particle';

describe('Particle', () => {
  let service: Particle;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Particle);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
