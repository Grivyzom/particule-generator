import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticleGenerator } from './particle-generator';

describe('ParticleGenerator', () => {
  let component: ParticleGenerator;
  let fixture: ComponentFixture<ParticleGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticleGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticleGenerator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
