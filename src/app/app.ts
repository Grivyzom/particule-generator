import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ParticleGenerator } from './particle-generator/particle-generator';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ParticleGenerator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('particule-generator');
}
