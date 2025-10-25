import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticleService, ParticleShape } from '../services/particle';
import { ZoomBar } from '../zoom-bar/zoom-bar';
import { SettingsParticle } from '../settings-particle/settings-particle';

@Component({
  selector: 'app-particle-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, ZoomBar, SettingsParticle],
  templateUrl: './particle-generator.html',
  styleUrl: './particle-generator.css'
})
export class ParticleGenerator implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  protected particleService = new ParticleService();
  protected particleCount = 0;
  protected showInstructions = true;
  protected showSettingsMenu = false;
  protected showPreferencesMenu = false;
  protected showMobileMenu = false;
  protected isMobile = false;
  protected zoomLevel = 1;

  // Control de pausa por hover en menús
  private isHoveringMenu = false;

  // Preferencias
  protected darkMode = true;
  protected showGrid = false;
  
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

  // Drag and drop de atractores
  private isDraggingSingularity = false;
  private draggedSingularityId: number | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;

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

    // Aplicar modo oscuro por defecto
    this.applyTheme();
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

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!this.isMobile && this.particleService.attractorEnabled) {
      const coords = this.getAdjustedCoordinates(event.clientX, event.clientY);
      const singularity = this.particleService.getSingularityAtPosition(coords.x, coords.y);

      if (singularity) {
        // Iniciar drag del atractor
        this.isDraggingSingularity = true;
        this.draggedSingularityId = singularity.id;
        this.lastMouseX = coords.x;
        this.lastMouseY = coords.y;
        // Detener el momento del atractor cuando se empieza a arrastrar
        this.particleService.setSingularityVelocity(singularity.id, 0, 0);
        event.preventDefault();
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isMobile) {
      const coords = this.getAdjustedCoordinates(event.clientX, event.clientY);

      // Si está arrastrando un atractor, moverlo
      if (this.isDraggingSingularity && this.draggedSingularityId !== null) {
        this.particleService.moveSingularity(this.draggedSingularityId, coords.x, coords.y);
        this.lastMouseX = coords.x;
        this.lastMouseY = coords.y;
      } else {
        // Crear partículas de rastro solo si no está arrastrando
        this.particleService.createTrailParticles(coords.x, coords.y);
      }

      this.hideInstructionsOnInteraction();
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.isDraggingSingularity) {
      this.isDraggingSingularity = false;
      this.draggedSingularityId = null;
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const coords = this.getAdjustedCoordinates(event.clientX, event.clientY);

    // Si está en modo de creación de atractores, crear un atractor
    if (this.particleService.attractorCreationMode) {
      this.particleService.createSingularity(coords.x, coords.y);
      this.hideInstructionsOnInteraction();
      return;
    }

    // Verificar si el click fue sobre un atractor (evitar crear partículas)
    if (this.particleService.attractorEnabled) {
      const singularity = this.particleService.getSingularityAtPosition(coords.x, coords.y);
      if (singularity) {
        // Click sobre un atractor, no hacer nada
        return;
      }
    }

    // Crear partículas normalmente
    this.particleService.createLeftClickParticles(coords.x, coords.y);
    this.hideInstructionsOnInteraction();
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): boolean {
    event.preventDefault();
    const coords = this.getAdjustedCoordinates(event.clientX, event.clientY);
    this.particleService.createRightClickParticles(coords.x, coords.y);
    this.hideInstructionsOnInteraction();
    return false;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const coords = this.getAdjustedCoordinates(touch.clientX, touch.clientY);
      this.particleService.createTrailParticles(coords.x, coords.y);
      this.hideInstructionsOnInteraction();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const coords = this.getAdjustedCoordinates(touch.clientX, touch.clientY);
      this.particleService.createLeftClickParticles(coords.x, coords.y);
      this.hideInstructionsOnInteraction();
    } else if (event.touches.length === 2) {
      const touch = event.touches[0];
      const coords = this.getAdjustedCoordinates(touch.clientX, touch.clientY);
      this.particleService.createRightClickParticles(coords.x, coords.y);
      this.hideInstructionsOnInteraction();
    }
  }

  /**
   * Ajusta las coordenadas del mouse según el nivel de zoom
   * El canvas tiene un tamaño interno que varía con el zoom y un tamaño visual aplicado con transform
   */
  private getAdjustedCoordinates(clientX: number, clientY: number): { x: number, y: number } {
    if (!this.canvasRef || !this.canvasRef.nativeElement) {
      return { x: clientX, y: clientY };
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calcular la posición relativa al canvas visible (con zoom aplicado)
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Convertir a coordenadas del canvas interno
    // rect.width/height son las dimensiones visuales después del transform scale
    // canvas.width/height son las dimensiones internas reales
    const x = (relativeX / rect.width) * canvas.width;
    const y = (relativeY / rect.height) * canvas.height;

    return { x, y };
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
    if (this.showSettingsMenu) {
      this.showPreferencesMenu = false;
      this.showMobileMenu = false;
    }
    this.updatePauseState();
  }

  togglePreferencesMenu(): void {
    this.showPreferencesMenu = !this.showPreferencesMenu;
    if (this.showPreferencesMenu) {
      this.showSettingsMenu = false;
      this.showMobileMenu = false;
    }
    this.updatePauseState();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.updatePauseState();
  }

  closeAllMenus(): void {
    this.showSettingsMenu = false;
    this.showPreferencesMenu = false;
    this.showMobileMenu = false;
    this.updatePauseState();
  }

  onMenuMouseEnter(): void {
    this.isHoveringMenu = true;
    this.updatePauseState();
  }

  onMenuMouseLeave(): void {
    this.isHoveringMenu = false;
    this.updatePauseState();
  }

  private updatePauseState(): void {
    const shouldPause = this.showSettingsMenu || this.showPreferencesMenu || this.showMobileMenu || this.isHoveringMenu;

    if (shouldPause) {
      this.particleService.pause();
    } else {
      this.particleService.resume();
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    this.applyTheme();
  }

  private applyTheme(): void {
    // Aplicar clase al elemento raíz del documento
    const root = document.documentElement;
    if (this.darkMode) {
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
    }

    // Cambiar el color de fondo del canvas según el modo
    this.particleService.backgroundColor = this.darkMode ? '#0a0a14' : '#f8fafc';
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
    this.particleService.showGrid = this.showGrid;
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

  // Método para manejar cambios de zoom
  onZoomChange(zoomLevel: number): void {
    this.zoomLevel = zoomLevel;

    // Actualizar el nivel de zoom en el servicio (ajusta el tamaño del canvas)
    this.particleService.setZoomLevel(zoomLevel);

    // Aplicar el zoom visual al canvas
    if (this.canvasRef && this.canvasRef.nativeElement) {
      this.canvasRef.nativeElement.style.transform = `scale(${zoomLevel})`;
    }
  }
}
