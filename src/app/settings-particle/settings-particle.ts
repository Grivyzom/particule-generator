import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParticleService } from '../services/particle';

export interface ParticleTypeConfig {
  name: string;
  label: string;
  icon: string;
  enabled: boolean;
  lifetime: number;
  minLifetime: number;
  maxLifetime: number;
  particleCount: number;
  minParticleCount: number;
  maxParticleCount: number;
  particleCountUnit: string;  // "por frame" o "por click"
}

@Component({
  selector: 'app-settings-particle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-particle.html',
  styleUrl: './settings-particle.css'
})
export class SettingsParticle {
  // Input para recibir el servicio de partículas
  particleService = input.required<ParticleService>();

  /**
   * Obtiene la configuración de un tipo de partícula
   */
  getParticleConfig(type: 'trail' | 'leftClick' | 'rightClick'): ParticleTypeConfig {
    const service = this.particleService();

    switch (type) {
      case 'trail':
        return {
          name: 'trail',
          label: 'Rastro del Cursor',
          icon: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
          enabled: service.trailEnabled,
          lifetime: service.trailLifetime,
          minLifetime: 20,
          maxLifetime: 360,
          particleCount: service.trailParticleCount,
          minParticleCount: 1,
          maxParticleCount: 10,
          particleCountUnit: 'por frame'
        };
      case 'leftClick':
        return {
          name: 'leftClick',
          label: 'Click Izquierdo',
          icon: 'M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5m0-4.5h4.5m-4.5 0l5.25 5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25',
          enabled: service.leftClickEnabled,
          lifetime: service.leftClickLifetime,
          minLifetime: 30,
          maxLifetime: 360,
          particleCount: service.leftClickParticleCount,
          minParticleCount: 10,
          maxParticleCount: 100,
          particleCountUnit: 'por click'
        };
      case 'rightClick':
        return {
          name: 'rightClick',
          label: 'Click Derecho',
          icon: 'M12 2L12 22M12 2L8 6M12 2L16 6M4 12L20 12M4 12L8 8M4 12L8 16M20 12L16 8M20 12L16 16',
          enabled: service.rightClickEnabled,
          lifetime: service.rightClickLifetime,
          minLifetime: 40,
          maxLifetime: 360,
          particleCount: service.rightClickParticleCount,
          minParticleCount: 10,
          maxParticleCount: 80,
          particleCountUnit: 'por click'
        };
    }
  }

  /**
   * Alterna el estado habilitado/deshabilitado de un tipo de partícula
   */
  toggleEnabled(type: 'trail' | 'leftClick' | 'rightClick'): void {
    const service = this.particleService();

    switch (type) {
      case 'trail':
        service.trailEnabled = !service.trailEnabled;
        break;
      case 'leftClick':
        service.leftClickEnabled = !service.leftClickEnabled;
        break;
      case 'rightClick':
        service.rightClickEnabled = !service.rightClickEnabled;
        break;
    }
  }

  /**
   * Actualiza el tiempo de vida de un tipo de partícula
   */
  updateLifetime(type: 'trail' | 'leftClick' | 'rightClick', value: number): void {
    const service = this.particleService();

    switch (type) {
      case 'trail':
        service.trailLifetime = value;
        break;
      case 'leftClick':
        service.leftClickLifetime = value;
        break;
      case 'rightClick':
        service.rightClickLifetime = value;
        break;
    }
  }

  /**
   * Actualiza la cantidad de partículas de un tipo de partícula
   */
  updateParticleCount(type: 'trail' | 'leftClick' | 'rightClick', value: number): void {
    const service = this.particleService();

    switch (type) {
      case 'trail':
        service.trailParticleCount = value;
        break;
      case 'leftClick':
        service.leftClickParticleCount = value;
        break;
      case 'rightClick':
        service.rightClickParticleCount = value;
        break;
    }
  }

  /**
   * Formatea el valor del tiempo de vida para mostrar
   */
  formatLifetime(lifetime: number): string {
    // Convertir frames a segundos aproximados (asumiendo 60 FPS)
    const seconds = (lifetime / 60).toFixed(1);
    return `${seconds}s (${lifetime} frames)`;
  }

  /**
   * Lista de tipos de partículas para iterar en el template
   */
  protected readonly particleTypes: Array<'trail' | 'leftClick' | 'rightClick'> = [
    'trail',
    'leftClick',
    'rightClick'
  ];

  /**
   * Alterna el estado de mecánicas avanzadas
   */
  toggleAdvancedMechanics(): void {
    const service = this.particleService();
    service.advancedMechanicsEnabled = !service.advancedMechanicsEnabled;
  }

  /**
   * Actualiza el valor de gravedad
   */
  updateGravity(value: number): void {
    this.particleService().gravity = value;
  }

  /**
   * Actualiza el valor de fricción
   */
  updateFriction(value: number): void {
    this.particleService().friction = value;
  }

  /**
   * Actualiza el multiplicador de velocidad
   */
  updateSpeedMultiplier(value: number): void {
    this.particleService().speedMultiplier = value;
  }

  /**
   * Formatea valores avanzados para mostrar
   */
  formatAdvancedValue(value: number): string {
    return value.toFixed(2);
  }

  // ========== MÉTODOS DEL ATRACTOR GRAVITATORIO ==========

  /**
   * Alterna el estado del atractor gravitatorio
   */
  toggleAttractor(): void {
    this.particleService().toggleAttractor();
  }

  /**
   * Actualiza la constante gravitacional G_sim
   */
  updateGSim(value: number): void {
    this.particleService().G_sim = value;
  }

  /**
   * Actualiza la constante de crecimiento k_crecimiento
   */
  updateKCrecimiento(value: number): void {
    this.particleService().k_crecimiento = value;

    // Recalcular R_C si existe la singularidad
    const singularity = this.particleService().getSingularityInfo();
    if (singularity) {
      singularity.R_C = value * singularity.M_S;
    }
  }

  /**
   * Actualiza la masa de partícula m_p
   */
  updateMp(value: number): void {
    this.particleService().m_p = value;
  }

  /**
   * Resetea todas las singularidades a sus valores iniciales
   */
  resetAllSingularities(): void {
    this.particleService().resetAllSingularities();
  }

  /**
   * Destruye todas las singularidades
   */
  destroyAllSingularities(): void {
    this.particleService().destroyAllSingularities();
  }

  /**
   * Actualiza la masa crítica
   */
  updateMCrit(value: number): void {
    this.particleService().M_crit = value;
  }

  /**
   * Actualiza el número de partículas de la Nova
   */
  updateNovaParticleCount(value: number): void {
    this.particleService().novaParticleCount = value;
  }

  /**
   * Actualiza la velocidad de la Nova
   */
  updateNovaSpeed(value: number): void {
    this.particleService().novaSpeed = value;
  }

  /**
   * Obtiene el número de atractores activos
   */
  getSingularityCount(): number {
    return this.particleService().getSingularityCount();
  }

  // ========================================================

  /**
   * Alterna el estado de congelación de partículas
   */
  toggleFreezeParticles(): void {
    this.particleService().toggleFreezeParticles();
  }
}
