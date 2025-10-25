import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zoom-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zoom-bar.html',
  styleUrl: './zoom-bar.css'
})
export class ZoomBar {
  // Nivel de zoom actual (porcentaje: 50% a 200%)
  protected currentZoom = 100;

  // Límites de zoom
  protected readonly MIN_ZOOM = 50;
  protected readonly MAX_ZOOM = 200;
  protected readonly ZOOM_STEP = 10;

  // Estado del componente
  protected isExpanded = false;

  // Output para comunicar cambios de zoom al componente padre
  zoomChange = output<number>();

  /**
   * Aumenta el nivel de zoom
   */
  protected zoomIn(): void {
    if (this.currentZoom < this.MAX_ZOOM) {
      this.currentZoom = Math.min(this.currentZoom + this.ZOOM_STEP, this.MAX_ZOOM);
      this.emitZoomChange();
    }
  }

  /**
   * Disminuye el nivel de zoom
   */
  protected zoomOut(): void {
    if (this.currentZoom > this.MIN_ZOOM) {
      this.currentZoom = Math.max(this.currentZoom - this.ZOOM_STEP, this.MIN_ZOOM);
      this.emitZoomChange();
    }
  }

  /**
   * Resetea el zoom al 100%
   */
  protected resetZoom(): void {
    this.currentZoom = 100;
    this.emitZoomChange();
  }

  /**
   * Alterna la expansión de la barra de zoom
   */
  protected toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  /**
   * Emite el cambio de zoom al componente padre
   */
  private emitZoomChange(): void {
    this.zoomChange.emit(this.currentZoom / 100);
  }

  /**
   * Verifica si se puede hacer zoom in
   */
  protected canZoomIn(): boolean {
    return this.currentZoom < this.MAX_ZOOM;
  }

  /**
   * Verifica si se puede hacer zoom out
   */
  protected canZoomOut(): boolean {
    return this.currentZoom > this.MIN_ZOOM;
  }

  /**
   * Formatea el porcentaje de zoom para mostrar
   */
  protected getZoomPercentage(): string {
    return `${this.currentZoom}%`;
  }
}
