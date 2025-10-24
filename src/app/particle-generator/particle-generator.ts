import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticleService, ParticleShape } from '../services/particle';

@Component({
  selector: 'app-particle-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './particle-generator.html',
  styleUrl: './particle-generator.css'
})
export class ParticleGenerator implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  protected particleService = new ParticleService();
  protected particleCount = 0;
  protected showInstructions = true;
  protected showSettingsMenu = false;
  protected isMobile = false;
  
  // Configuración de formas
  protected availableShapes: Array<{value: ParticleShape, label: string, icon: string}> = [
    { value: 'circle', label: 'Círculos', icon: '⚪' },
    { value: 'star', label: 'Estrellas', icon: '⭐' },
    { value: 'diamond', label: 'Diamantes', icon: '💎' },
    { value: 'lightning', label: 'Rayos', icon: '⚡' },
    { value: 'heart', label: 'Corazones', icon: '❤️' },
    { value: 'poker', label: 'Poker', icon: '🃏' }
  ];
  
  // Configuración de colores
  protected activeColorTab: 'trail' | 'leftClick' | 'rightClick' = 'trail';
  protected newColor = '#FF6B9D';
  
  private updateCounterInterval?: number;
  private instructionsTimeout?: number;

  ngAfterViewInit(): void {
    this.checkIfMobile();
    this.particleService.initialize(this.canvasRef.nativeElement);
    
    // Actualizar contador de partículas
    this.updateCounterInterval = window.setInterval(() => {
      this.particleCount = this.particleService.getParticleCount();
    }, 100);
    
    // Ocultar instrucciones después de 5 segundos
    this.instructionsTimeout = window.setTimeout(() => {
      this.showInstructions = false;
    }, 5000);
  }

  ngOnDestroy(): void {
    this.particleService.destroy();
    if (this.updateCounterInterval) {
      clearInterval(this.updateCounterInterval);
    }
    if (this.instructionsTimeout) {
      clearTimeout(this.instructionsTimeout);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.particleService.resizeCanvas();
    this.checkIfMobile();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isMobile) {
      this.particleService.createTrailParticles(event.clientX, event.clientY);
      this.hideInstructionsOnInteraction();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    this.particleService.createLeftClickParticles(event.clientX, event.clientY);
    this.hideInstructionsOnInteraction();
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): boolean {
    event.preventDefault();
    this.particleService.createRightClickParticles(event.clientX, event.clientY);
    this.hideInstructionsOnInteraction();
    return false;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.particleService.createTrailParticles(touch.clientX, touch.clientY);
      this.hideInstructionsOnInteraction();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.particleService.createLeftClickParticles(touch.clientX, touch.clientY);
      this.hideInstructionsOnInteraction();
    } else if (event.touches.length === 2) {
      const touch = event.touches[0];
      this.particleService.createRightClickParticles(touch.clientX, touch.clientY);
      this.hideInstructionsOnInteraction();
    }
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  private hideInstructionsOnInteraction(): void {
    if (this.showInstructions) {
      this.showInstructions = false;
      if (this.instructionsTimeout) {
        clearTimeout(this.instructionsTimeout);
      }
    }
  }

  toggleInstructions(): void {
    this.showInstructions = !this.showInstructions;
  }

  toggleSettingsMenu(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  // Métodos para cambiar formas
  setTrailShape(shape: ParticleShape): void {
    this.particleService.currentTrailShape = shape;
  }

  setLeftClickShape(shape: ParticleShape): void {
    this.particleService.currentLeftClickShape = shape;
  }

  setRightClickShape(shape: ParticleShape): void {
    this.particleService.currentRightClickShape = shape;
  }

  // Métodos para gestionar colores
  getActiveColors(): string[] {
    switch (this.activeColorTab) {
      case 'trail':
        return this.particleService.trailColors;
      case 'leftClick':
        return this.particleService.leftClickColors;
      case 'rightClick':
        return this.particleService.rightClickColors;
    }
  }

  addColor(): void {
    const colors = this.getActiveColors();
    if (!colors.includes(this.newColor)) {
      colors.push(this.newColor);
    }
  }

  removeColor(color: string): void {
    const colors = this.getActiveColors();
    const index = colors.indexOf(color);
    if (index > -1 && colors.length > 1) {
      colors.splice(index, 1);
    }
  }

  setColorTab(tab: 'trail' | 'leftClick' | 'rightClick'): void {
    this.activeColorTab = tab;
  }

  getCurrentShape(type: 'trail' | 'leftClick' | 'rightClick'): ParticleShape {
    switch (type) {
      case 'trail':
        return this.particleService.currentTrailShape;
      case 'leftClick':
        return this.particleService.currentLeftClickShape;
      case 'rightClick':
        return this.particleService.currentRightClickShape;
    }
  }
}
