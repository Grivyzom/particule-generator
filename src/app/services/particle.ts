export type ParticleShape = 'circle' | 'star' | 'diamond' | 'lightning' | 'heart' | 'poker';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'trail' | 'leftClick' | 'rightClick';
  shape: ParticleShape;
  mass: number;  // m_p - Masa de la partícula (para física gravitatoria)
  rotation?: number;
  rotationSpeed?: number;
  blur?: number;
  glow?: boolean;
  electricPoints?: Array<{x: number, y: number}>; // Para rayos
  pokerSuit?: 'spade' | 'heart' | 'diamond' | 'club'; // Para cartas de poker
}

/**
 * Singularidad - Atractor Gravitatorio
 * Implementa un pozo gravitatorio que crece mediante acreción de partículas
 * Ahora con capacidad de movimiento e interacción N-cuerpos
 */
export interface Singularity {
  id: number;             // ID único
  x: number;              // Posición X
  y: number;              // Posición Y
  vx: number;             // Velocidad X
  vy: number;             // Velocidad Y
  M_S: number;            // Masa acumulada (crece con cada partícula absorbida)
  R_C: number;            // Radio de captura (horizonte de eventos)
  particlesAbsorbed: number; // Contador de partículas absorbidas
}

export class ParticleService {
  private particles: Particle[] = [];
  private nextId = 0;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private trailCounter = 0;

  // Formas actuales seleccionadas
  public currentTrailShape: ParticleShape = 'circle';
  public currentLeftClickShape: ParticleShape = 'star';
  public currentRightClickShape: ParticleShape = 'diamond';

  // Control de habilitación de partículas por tipo
  public trailEnabled = true;
  public leftClickEnabled = true;
  public rightClickEnabled = true;

  // Control de cuadrícula
  public showGrid = false;

  // Control de pausa
  public isPaused = false;

  // Control de congelación de partículas
  public isParticlesFrozen = false;

  // Color de fondo
  public backgroundColor = '#0a0a14';

  // Mecánicas avanzadas
  public advancedMechanicsEnabled = false;
  public gravity = 0.08;              // Fuerza de gravedad (0 = sin gravedad, 0.5 = fuerte)
  public friction = 0.98;              // Fricción del aire (1 = sin fricción, 0 = fricción máxima)
  public speedMultiplier = 1.0;        // Multiplicador de velocidad inicial (0.5 = lento, 2.0 = rápido)
  public particleInteraction = false;  // Interacción entre partículas

  // Tiempo de vida base para cada tipo (en frames)
  public trailLifetime = 60;
  public leftClickLifetime = 80;
  public rightClickLifetime = 90;

  // Cantidad de partículas por acción
  public trailParticleCount = 3;        // Partículas por frame de rastro
  public leftClickParticleCount = 50;   // Partículas por click izquierdo
  public rightClickParticleCount = 35;  // Partículas por click derecho (base para las 3 ondas)

  // Nivel de zoom actual
  private currentZoomLevel = 1;

  // ========== SISTEMA DE ATRACTOR GRAVITATORIO (SINGULARIDAD) ==========

  // Array de Singularidades (Sistema N-cuerpos)
  private singularities: Singularity[] = [];
  private nextSingularityId = 0;

  // Constantes físicas de la simulación
  public G_sim = 50.0;              // Constante gravitacional simulada
  public k_crecimiento = 0.01;      // Constante de crecimiento del radio (R_C = k · M_S)
  public m_p = 0.01;                // Masa base de cada partícula
  public M_S_inicial = 1000;        // Masa inicial de la singularidad
  public M_crit = 10000;            // Masa crítica - límite de estabilidad (evento Nova)

  // Parámetros del evento Nova (explosión)
  public novaParticleCount = 200;   // Número de partículas expulsadas en Nova
  public novaSpeed = 10;            // Velocidad inicial de partículas expulsadas

  // Control del atractor
  public attractorEnabled = false;  // Activar/desactivar el atractor
  public showAttractorVisuals = true; // Mostrar visualización del horizonte
  public attractorCreationMode = false; // Modo de creación de atractores con clicks

  // ======================================================================

  // Colores personalizables para diferentes tipos de partículas
  public trailColors = [
    '#FF6B9D', '#C44569', '#FFA07A', '#FFB6C1',
    '#DDA0DD', '#BA55D3', '#9370DB', '#8A2BE2'
  ];

  public leftClickColors = [
    '#00F5FF', '#1E90FF', '#4169E1', '#0000FF',
    '#8A2BE2', '#9400D3', '#FF00FF', '#FF1493'
  ];

  public rightClickColors = [
    '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    '#FF4500', '#DC143C', '#FF69B4', '#FF1493'
  ];

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.startAnimation();
  }

  resizeCanvas(): void {
    // Ajustar el tamaño del canvas según el nivel de zoom
    // Cuando zoom < 1 (alejado), el canvas debe ser más grande
    // Cuando zoom > 1 (acercado), el canvas debe ser más pequeño
    this.canvas.width = window.innerWidth / this.currentZoomLevel;
    this.canvas.height = window.innerHeight / this.currentZoomLevel;
  }

  setZoomLevel(zoomLevel: number): void {
    this.currentZoomLevel = zoomLevel;
    this.resizeCanvas();
  }

  private startAnimation(): void {
    const animate = () => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  createTrailParticles(x: number, y: number): void {
    // No crear partículas si están deshabilitadas o pausadas
    if (!this.trailEnabled || this.isPaused) return;

    // Solo crear partículas si el mouse se ha movido lo suficiente
    const dx = x - this.lastMouseX;
    const dy = y - this.lastMouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return;

    this.lastMouseX = x;
    this.lastMouseY = y;
    this.trailCounter++;

    // Usar la cantidad configurable de partículas de trail
    const count = this.trailParticleCount;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      let speed = this.currentTrailShape === 'lightning'
        ? Math.random() * 3 + 2  // Rayos más rápidos
        : Math.random() * 0.5 + 0.2;

      // Aplicar multiplicador de velocidad si mecánicas avanzadas están activas
      if (this.advancedMechanicsEnabled) {
        speed *= this.speedMultiplier;
      }

      let particleColor = this.trailColors[Math.floor(Math.random() * this.trailColors.length)];

      // Corazones siempre rojos
      if (this.currentTrailShape === 'heart') {
        const redShades = ['#FF0000', '#DC143C', '#FF1493', '#C71585', '#FF69B4'];
        particleColor = redShades[Math.floor(Math.random() * redShades.length)];
      }

      const particle: Particle = {
        id: this.nextId++,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: this.currentTrailShape === 'lightning' ? Math.random() * 6 + 4 : Math.random() * 4 + 2,
        color: particleColor,
        alpha: 1,
        life: 0,
        maxLife: this.currentTrailShape === 'lightning' ? this.trailLifetime * 2 + Math.random() * 60 : this.trailLifetime + Math.random() * 40,
        type: 'trail',
        shape: this.currentTrailShape,
        mass: this.m_p,  // Masa de la partícula
        blur: this.currentTrailShape === 'lightning' ? 8 : 3,
        glow: true
      };
      
      if (particle.shape === 'lightning') {
        particle.electricPoints = this.generateLightningPoints(8); // Más segmentos para rayos más largos
      } else if (particle.shape === 'poker') {
        particle.pokerSuit = ['spade', 'heart', 'diamond', 'club'][Math.floor(Math.random() * 4)] as any;
      }
      
      this.particles.push(particle);
    }
  }

  createLeftClickParticles(x: number, y: number): void {
    // No crear partículas si están deshabilitadas o pausadas
    if (!this.leftClickEnabled || this.isPaused) return;

    const count = this.leftClickParticleCount;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      let speed = this.currentLeftClickShape === 'lightning'
        ? Math.random() * 6 + 3  // Rayos más rápidos
        : Math.random() * 4 + 2;

      // Aplicar multiplicador de velocidad si mecánicas avanzadas están activas
      if (this.advancedMechanicsEnabled) {
        speed *= this.speedMultiplier;
      }

      let particleColor = this.leftClickColors[Math.floor(Math.random() * this.leftClickColors.length)];

      // Corazones siempre rojos
      if (this.currentLeftClickShape === 'heart') {
        const redShades = ['#FF0000', '#DC143C', '#FF1493', '#C71585', '#FF69B4'];
        particleColor = redShades[Math.floor(Math.random() * redShades.length)];
      }

      const particle: Particle = {
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: this.currentLeftClickShape === 'lightning' ? Math.random() * 8 + 4 : Math.random() * 6 + 3,
        color: particleColor,
        alpha: 1,
        life: 0,
        maxLife: this.currentLeftClickShape === 'lightning' ? this.leftClickLifetime * 2 + Math.random() * 70 : this.leftClickLifetime + Math.random() * 40,
        type: 'leftClick',
        shape: this.currentLeftClickShape,
        mass: this.m_p,  // Masa de la partícula
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        blur: this.currentLeftClickShape === 'lightning' ? 10 : 4,
        glow: true
      };
      
      if (particle.shape === 'lightning') {
        particle.electricPoints = this.generateLightningPoints(10); // Más segmentos
      } else if (particle.shape === 'poker') {
        particle.pokerSuit = ['spade', 'heart', 'diamond', 'club'][Math.floor(Math.random() * 4)] as any;
      }
      
      this.particles.push(particle);
    }
  }

  createRightClickParticles(x: number, y: number): void {
    // No crear partículas si están deshabilitadas o pausadas
    if (!this.rightClickEnabled || this.isPaused) return;

    const count = this.rightClickParticleCount;

    // Crear un efecto de ondas expansivas
    for (let wave = 0; wave < 3; wave++) {
      const waveParticles = Math.floor(count / 3);
      setTimeout(() => {
        for (let i = 0; i < waveParticles; i++) {
          const angle = (Math.PI * 2 * i) / waveParticles;
          let speed = this.currentRightClickShape === 'lightning'
            ? 4 + wave * 2 + Math.random() * 3  // Rayos más rápidos
            : 3 + wave * 1.5 + Math.random() * 2;

          // Aplicar multiplicador de velocidad si mecánicas avanzadas están activas
          if (this.advancedMechanicsEnabled) {
            speed *= this.speedMultiplier;
          }

          let particleColor = this.rightClickColors[Math.floor(Math.random() * this.rightClickColors.length)];

          // Corazones siempre rojos
          if (this.currentRightClickShape === 'heart') {
            const redShades = ['#FF0000', '#DC143C', '#FF1493', '#C71585', '#FF69B4'];
            particleColor = redShades[Math.floor(Math.random() * redShades.length)];
          }

          const particle: Particle = {
            id: this.nextId++,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: this.currentRightClickShape === 'lightning' ? Math.random() * 10 + 5 : Math.random() * 8 + 4,
            color: particleColor,
            alpha: 1,
            life: 0,
            maxLife: this.currentRightClickShape === 'lightning' ? this.rightClickLifetime * 2 + Math.random() * 80 : this.rightClickLifetime + Math.random() * 50,
            type: 'rightClick',
            shape: this.currentRightClickShape,
            mass: this.m_p,  // Masa de la partícula
            rotation: angle,
            rotationSpeed: (Math.random() - 0.5) * 0.15,
            blur: this.currentRightClickShape === 'lightning' ? 12 : 5,
            glow: true
          };
          
          if (particle.shape === 'lightning') {
            particle.electricPoints = this.generateLightningPoints(12); // Aún más segmentos para efecto más largo
          } else if (particle.shape === 'poker') {
            particle.pokerSuit = ['spade', 'heart', 'diamond', 'club'][Math.floor(Math.random() * 4)] as any;
          }
          
          this.particles.push(particle);
        }
      }, wave * 50);
    }
  }

  private update(): void {
    // Si las partículas están congeladas, no actualizar
    if (this.isParticlesFrozen) {
      return;
    }

    // ========== FÍSICA DEL SISTEMA N-CUERPOS (ATRACTORES) ==========
    if (this.attractorEnabled && this.singularities.length > 0) {

      // 1. INTERACCIÓN ATRACTOR-ATRACTOR (S_i → S_j)
      for (let i = 0; i < this.singularities.length; i++) {
        const S_A = this.singularities[i];

        for (let j = i + 1; j < this.singularities.length; j++) {
          const S_B = this.singularities[j];

          // Calcular distancia entre atractores
          const dx = S_B.x - S_A.x;
          const dy = S_B.y - S_A.y;
          const r_AB = Math.sqrt(dx * dx + dy * dy);

          if (r_AB > 0) {
            // Fuerza gravitatoria mutua: F_AB = G_sim · (M_SA · M_SB) / r²
            const F_AB = this.G_sim * (S_A.M_S * S_B.M_S) / (r_AB * r_AB);

            // Aceleraciones (a = F / M)
            const a_A = F_AB / S_A.M_S;
            const a_B = F_AB / S_B.M_S;

            // Componentes direccionales
            const dirX = dx / r_AB;
            const dirY = dy / r_AB;

            // Aplicar aceleraciones mutuamente
            S_A.vx += dirX * a_A;
            S_A.vy += dirY * a_A;
            S_B.vx -= dirX * a_B;
            S_B.vy -= dirY * a_B;
          }
        }
      }

      // 2. ACTUALIZAR POSICIONES DE ATRACTORES
      for (const S of this.singularities) {
        S.x += S.vx;
        S.y += S.vy;
      }

      // 3. VERIFICAR FUSIONES (r_AB ≤ R_CA + R_CB)
      for (let i = this.singularities.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
          const S_A = this.singularities[i];
          const S_B = this.singularities[j];

          const dx = S_B.x - S_A.x;
          const dy = S_B.y - S_A.y;
          const r_AB = Math.sqrt(dx * dx + dy * dy);

          // Condición de fusión
          if (r_AB <= (S_A.R_C + S_B.R_C)) {
            // Conservación de Masa
            const M_nuevo = S_A.M_S + S_B.M_S;

            // Conservación de Momento (promedio ponderado)
            const vx_nuevo = (S_A.M_S * S_A.vx + S_B.M_S * S_B.vx) / M_nuevo;
            const vy_nuevo = (S_A.M_S * S_A.vy + S_B.M_S * S_B.vy) / M_nuevo;

            // Centro de masa
            const x_nuevo = (S_A.M_S * S_A.x + S_B.M_S * S_B.x) / M_nuevo;
            const y_nuevo = (S_A.M_S * S_A.y + S_B.M_S * S_B.y) / M_nuevo;

            // Nuevo Radio de Captura
            const R_C_nuevo = this.k_crecimiento * M_nuevo;

            // Crear nuevo atractor fusionado
            const S_nuevo: Singularity = {
              id: this.nextSingularityId++,
              x: x_nuevo,
              y: y_nuevo,
              vx: vx_nuevo,
              vy: vy_nuevo,
              M_S: M_nuevo,
              R_C: R_C_nuevo,
              particlesAbsorbed: S_A.particlesAbsorbed + S_B.particlesAbsorbed
            };

            // Eliminar atractores viejos
            this.singularities.splice(i, 1);
            this.singularities.splice(j, 1);

            // Añadir nuevo atractor
            this.singularities.push(S_nuevo);

            break; // Salir del bucle interno
          }
        }
      }

      // 4. FUERZA NETA SOBRE PARTÍCULAS (Suma vectorial de todos los atractores)
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        let F_net_x = 0;
        let F_net_y = 0;
        let wasAbsorbed = false;

        for (const S of this.singularities) {
          // Calcular distancia a este atractor
          const dx = S.x - p.x;
          const dy = S.y - p.y;
          const r = Math.sqrt(dx * dx + dy * dy);

          // Mecánica de Acreción
          if (r <= S.R_C) {
            // Absorción
            S.M_S += p.mass;
            S.particlesAbsorbed++;
            S.R_C = this.k_crecimiento * S.M_S;

            this.particles.splice(i, 1);
            wasAbsorbed = true;
            break;
          }

          // Fuerza gravitatoria de este atractor
          if (r > 0) {
            const F_g = this.G_sim * (S.M_S * p.mass) / (r * r);
            const dirX = dx / r;
            const dirY = dy / r;

            F_net_x += dirX * F_g;
            F_net_y += dirY * F_g;
          }
        }

        // Aplicar fuerza neta
        if (!wasAbsorbed) {
          const a_x = F_net_x / p.mass;
          const a_y = F_net_y / p.mass;
          p.vx += a_x;
          p.vy += a_y;
        }
      }

      // 5. VERIFICAR MASA CRÍTICA Y EVENTO NOVA
      for (let i = this.singularities.length - 1; i >= 0; i--) {
        const S = this.singularities[i];

        if (S.M_S >= this.M_crit) {
          // EVENTO NOVA - Explosión
          this.triggerNova(S);

          // Eliminar el atractor
          this.singularities.splice(i, 1);
        }
      }
    }
    // ================================================================

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Actualizar posición
      p.x += p.vx;
      p.y += p.vy;

      // Aplicar gravedad (usar valores configurables si mecánicas avanzadas están activas)
      const gravityValue = this.advancedMechanicsEnabled ? this.gravity : 0.08;
      if (p.shape !== 'lightning' && (p.type === 'leftClick' || p.type === 'rightClick')) {
        p.vy += gravityValue;
      }

      // Fricción (usar valores configurables si mecánicas avanzadas están activas)
      const frictionValue = this.advancedMechanicsEnabled ? this.friction : 0.98;
      const lightningFriction = this.advancedMechanicsEnabled ? this.friction : 0.99;

      if (p.shape === 'lightning') {
        p.vx *= lightningFriction;
        p.vy *= lightningFriction;

        // Regenerar puntos del rayo para efecto dinámico
        if (p.life % 3 === 0) {
          p.electricPoints = this.generateLightningPoints(5);
        }

        // Cambiar color del rayo según su vida (transición de colores)
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.3) {
          // Inicio: azul eléctrico brillante
          p.color = `hsl(${200 + lifeRatio * 100}, 100%, ${70 + Math.random() * 10}%)`;
        } else if (lifeRatio < 0.6) {
          // Medio: púrpura/violeta
          p.color = `hsl(${260 + lifeRatio * 80}, 100%, ${60 + Math.random() * 10}%)`;
        } else {
          // Final: rojo/naranja
          p.color = `hsl(${10 + lifeRatio * 40}, 100%, ${50 + Math.random() * 10}%)`;
        }
      } else {
        p.vx *= frictionValue;
        p.vy *= frictionValue;
      }
      
      // Actualizar rotación
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed;
      }
      
      // Actualizar vida y alpha
      p.life++;
      const lifeRatio = p.life / p.maxLife;
      p.alpha = 1 - lifeRatio;
      
      // Efecto de fade out suave
      if (lifeRatio > 0.7) {
        p.alpha *= (1 - lifeRatio) / 0.3;
      }
      
      // Eliminar partículas muertas
      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Limitar el número de partículas para performance
    if (this.particles.length > 1000) {
      this.particles.splice(0, this.particles.length - 1000);
    }
  }

  private drawGrid(): void {
    const gridSize = 50; // Tamaño de cada celda de la cuadrícula
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    // Dibujar líneas verticales
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Dibujar líneas horizontales
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private render(): void {
    // Limpiar el canvas completamente sin marcas
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar cuadrícula si está activada
    if (this.showGrid) {
      this.drawGrid();
    }

    // Dibujar partículas
    for (const p of this.particles) {
      this.ctx.save();

      // Aplicar blur y glow
      if (p.glow) {
        this.ctx.shadowBlur = p.blur || 0;
        this.ctx.shadowColor = p.color;
      }

      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      // Dibujar según el tipo
      this.ctx.translate(p.x, p.y);

      if (p.rotation !== undefined) {
        this.ctx.rotate(p.rotation);
      }

      // Dibujar según la forma
      this.drawShape(p);

      this.ctx.restore();
    }

    // ========== VISUALIZACIÓN DE ATRACTORES (SISTEMA N-CUERPOS) ==========
    if (this.attractorEnabled && this.showAttractorVisuals) {
      for (const S of this.singularities) {
        this.drawSingularity(S);
      }
    }
    // ====================================================================
  }

  private drawShape(p: Particle): void {
    switch (p.shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case 'star':
        this.drawStar(0, 0, 5, p.size, p.size / 2);
        break;
      case 'diamond':
        this.drawDiamond(0, 0, p.size);
        break;
      case 'lightning':
        this.drawLightning(p);
        break;
      case 'heart':
        this.drawHeart(0, 0, p.size);
        break;
      case 'poker':
        this.drawPokerCard(p);
        break;
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      this.ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      this.ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawDiamond(cx: number, cy: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - size);
    this.ctx.lineTo(cx + size, cy);
    this.ctx.lineTo(cx, cy + size);
    this.ctx.lineTo(cx - size, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawHeart(cx: number, cy: number, size: number): void {
    const topCurveHeight = size * 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + topCurveHeight);
    
    // Curva izquierda
    this.ctx.bezierCurveTo(
      cx, cy - topCurveHeight,
      cx - size, cy - topCurveHeight,
      cx - size, cy + topCurveHeight
    );
    this.ctx.bezierCurveTo(
      cx - size, cy + (size + topCurveHeight) / 2,
      cx, cy + (size + topCurveHeight) / 2,
      cx, cy + size
    );
    
    // Curva derecha
    this.ctx.bezierCurveTo(
      cx, cy + (size + topCurveHeight) / 2,
      cx + size, cy + (size + topCurveHeight) / 2,
      cx + size, cy + topCurveHeight
    );
    this.ctx.bezierCurveTo(
      cx + size, cy - topCurveHeight,
      cx, cy - topCurveHeight,
      cx, cy + topCurveHeight
    );
    
    this.ctx.closePath();
    this.ctx.fill();
  }

  private generateLightningPoints(segments: number): Array<{x: number, y: number}> {
    const points: Array<{x: number, y: number}> = [];
    let currentX = 0;
    let currentY = 0;
    
    points.push({x: currentX, y: currentY});
    
    // Dirección aleatoria inicial
    const initialAngle = Math.random() * Math.PI * 2;
    
    for (let i = 0; i < segments; i++) {
      // Movimiento más expansivo con cambios de dirección más naturales
      const angleVariation = (Math.random() - 0.5) * Math.PI / 3; // Variación de hasta 60 grados
      const angle = initialAngle + angleVariation + (Math.random() - 0.5) * Math.PI / 4;
      const distance = Math.random() * 25 + 15; // Mayor distancia para efecto más expansivo
      
      currentX += Math.cos(angle) * distance;
      currentY += Math.sin(angle) * distance;
      points.push({x: currentX, y: currentY});
    }
    
    return points;
  }

  private drawLightning(p: Particle): void {
    if (!p.electricPoints || p.electricPoints.length < 2) return;
    
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = Math.max(2, p.size / 2);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Dibujar línea principal con efecto de brillo
    this.ctx.beginPath();
    this.ctx.moveTo(p.electricPoints[0].x, p.electricPoints[0].y);
    
    for (let i = 1; i < p.electricPoints.length; i++) {
      this.ctx.lineTo(p.electricPoints[i].x, p.electricPoints[i].y);
    }
    
    this.ctx.stroke();
    
    // Dibujar un halo más brillante en el centro
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.6})`;
    this.ctx.lineWidth = Math.max(1, p.size / 4);
    this.ctx.beginPath();
    this.ctx.moveTo(p.electricPoints[0].x, p.electricPoints[0].y);
    
    for (let i = 1; i < p.electricPoints.length; i++) {
      this.ctx.lineTo(p.electricPoints[i].x, p.electricPoints[i].y);
    }
    
    this.ctx.stroke();
    
    // Dibujar ramas secundarias más abundantes
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = Math.max(1, p.size / 3);
    
    for (let i = 1; i < p.electricPoints.length - 1; i++) {
      if (Math.random() > 0.4) { // Más probabilidad de ramas
        const branchLength = Math.random() * 20 + 10; // Ramas más largas
        const branchAngle = (Math.random() - 0.5) * Math.PI / 1.5;
        
        this.ctx.beginPath();
        this.ctx.moveTo(p.electricPoints[i].x, p.electricPoints[i].y);
        
        // Rama con varios segmentos
        const branchSegments = Math.floor(Math.random() * 3) + 2;
        let branchX = p.electricPoints[i].x;
        let branchY = p.electricPoints[i].y;
        
        for (let j = 0; j < branchSegments; j++) {
          const segmentAngle = branchAngle + (Math.random() - 0.5) * Math.PI / 4;
          const segmentLength = branchLength / branchSegments;
          branchX += Math.cos(segmentAngle) * segmentLength;
          branchY += Math.sin(segmentAngle) * segmentLength;
          this.ctx.lineTo(branchX, branchY);
        }
        
        this.ctx.stroke();
      }
    }
  }

  private drawPokerCard(p: Particle): void {
    const cardWidth = p.size * 1.5;
    const cardHeight = p.size * 2;
    
    // Fondo de la carta
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
    
    // Borde
    this.ctx.strokeStyle = p.color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
    
    // Dibujar el símbolo según el palo
    this.ctx.fillStyle = (p.pokerSuit === 'heart' || p.pokerSuit === 'diamond') ? '#DC143C' : '#000000';
    
    const symbolSize = p.size * 0.6;
    
    switch (p.pokerSuit) {
      case 'heart':
        this.drawHeart(0, 0, symbolSize);
        break;
      case 'diamond':
        this.drawDiamond(0, 0, symbolSize);
        break;
      case 'spade':
        this.drawSpade(0, 0, symbolSize);
        break;
      case 'club':
        this.drawClub(0, 0, symbolSize);
        break;
    }
  }

  private drawSpade(cx: number, cy: number, size: number): void {
    // Dibujar un corazón invertido
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(Math.PI);
    this.drawHeart(0, 0, size);
    this.ctx.restore();
    
    // Agregar el tallo
    this.ctx.fillRect(cx - size * 0.15, cy + size * 0.5, size * 0.3, size * 0.5);
  }

  private drawClub(cx: number, cy: number, size: number): void {
    const circleSize = size * 0.4;
    
    // Tres círculos
    this.ctx.beginPath();
    this.ctx.arc(cx - circleSize * 0.7, cy - circleSize * 0.3, circleSize, 0, Math.PI * 2);
    this.ctx.arc(cx + circleSize * 0.7, cy - circleSize * 0.3, circleSize, 0, Math.PI * 2);
    this.ctx.arc(cx, cy + circleSize * 0.5, circleSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Tallo
    this.ctx.fillRect(cx - size * 0.15, cy + size * 0.5, size * 0.3, size * 0.5);
  }

  /**
   * Dibuja la Singularidad (Atractor Gravitatorio) con su horizonte de eventos
   */
  private drawSingularity(s: Singularity): void {
    this.ctx.save();

    // 1. Dibujar el horizonte de eventos (Radio de Captura R_C)
    // Círculo exterior con gradiente radial
    const gradient = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.R_C);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');      // Centro muy oscuro
    gradient.addColorStop(0.7, 'rgba(30, 10, 50, 0.6)'); // Púrpura oscuro
    gradient.addColorStop(0.9, 'rgba(100, 50, 200, 0.3)'); // Púrpura brillante en el borde
    gradient.addColorStop(1, 'rgba(150, 100, 255, 0)');  // Transparente

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, s.R_C, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Anillo del horizonte de eventos (borde brillante)
    this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(150, 100, 255, 1)';
    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, s.R_C, 0, Math.PI * 2);
    this.ctx.stroke();

    // 3. Núcleo central (singularidad)
    const coreGradient = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.3, 'rgba(200, 150, 255, 1)');
    coreGradient.addColorStop(1, 'rgba(100, 50, 200, 0)');

    this.ctx.fillStyle = coreGradient;
    this.ctx.shadowBlur = 30;
    this.ctx.shadowColor = 'rgba(200, 150, 255, 1)';
    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Efecto de distorsión (anillos concéntricos)
    this.ctx.shadowBlur = 0;
    for (let i = 1; i <= 3; i++) {
      const ringRadius = s.R_C * (0.3 + i * 0.2);
      this.ctx.strokeStyle = `rgba(150, 100, 255, ${0.3 - i * 0.08})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();

    // 5. Información de debug (opcional, puede comentarse)
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`M_S: ${s.M_S.toFixed(2)}`, s.x + s.R_C + 10, s.y - 20);
    this.ctx.fillText(`R_C: ${s.R_C.toFixed(2)}`, s.x + s.R_C + 10, s.y);
    this.ctx.fillText(`Absorbed: ${s.particlesAbsorbed}`, s.x + s.R_C + 10, s.y + 20);
    this.ctx.restore();
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  toggleFreezeParticles(): void {
    this.isParticlesFrozen = !this.isParticlesFrozen;

    // Si se desactiva la congelación, limpiar todas las partículas
    if (!this.isParticlesFrozen) {
      this.clearAllParticles();
    }
  }

  clearAllParticles(): void {
    this.particles = [];
  }

  /**
   * Evento Nova - Explosión cuando un atractor alcanza masa crítica
   * Conserva la masa convirtiendo el atractor en partículas expulsadas radialmente
   */
  private triggerNova(S: Singularity): void {
    const N = this.novaParticleCount;
    const totalMass = S.M_S;
    const massPerParticle = totalMass / N;

    // Generar explosión esférica de partículas
    for (let i = 0; i < N; i++) {
      // Ángulo aleatorio para distribución uniforme
      const angle = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.1;

      // Velocidad radial hacia afuera + velocidad residual del atractor
      const speed = this.novaSpeed * (0.8 + Math.random() * 0.4);
      const vx = Math.cos(angle) * speed + S.vx;
      const vy = Math.sin(angle) * speed + S.vy;

      // Color brillante para efecto visual dramático
      const novaColors = ['#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00', '#FF1493'];
      const color = novaColors[Math.floor(Math.random() * novaColors.length)];

      // Crear partícula de explosión
      const particle: Particle = {
        id: this.nextId++,
        x: S.x + (Math.random() - 0.5) * S.R_C * 0.5,
        y: S.y + (Math.random() - 0.5) * S.R_C * 0.5,
        vx,
        vy,
        size: Math.random() * 6 + 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 120 + Math.random() * 60, // Vida más larga para efecto dramático
        type: 'leftClick', // Tipo genérico
        shape: 'star', // Estrellas para el efecto Nova
        mass: massPerParticle, // Conservación de masa
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        blur: 8,
        glow: true
      };

      this.particles.push(particle);
    }

    console.log(`🌟 NOVA EVENT! Singularity ${S.id} exploded with M_S=${S.M_S.toFixed(2)} creating ${N} particles`);
  }

  // ========== MÉTODOS DE CONTROL DEL ATRACTOR GRAVITATORIO (SISTEMA N-CUERPOS) ==========

  /**
   * Crea y añade una nueva Singularidad en una posición específica
   */
  createSingularity(x: number, y: number, vx: number = 0, vy: number = 0): void {
    // Calcular R_C inicial: R_C = k_crecimiento · M_S_inicial
    const initialR_C = this.k_crecimiento * this.M_S_inicial;

    const newSingularity: Singularity = {
      id: this.nextSingularityId++,
      x,
      y,
      vx,
      vy,
      M_S: this.M_S_inicial,
      R_C: initialR_C,
      particlesAbsorbed: 0
    };

    this.singularities.push(newSingularity);
    this.attractorEnabled = true;

    console.log(`✨ Created Singularity #${newSingularity.id} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }

  /**
   * Mueve una Singularidad específica a una nueva posición
   */
  moveSingularity(id: number, x: number, y: number): void {
    const S = this.singularities.find(s => s.id === id);
    if (S) {
      S.x = x;
      S.y = y;
    }
  }

  /**
   * Activa/desactiva el sistema de atractores
   */
  toggleAttractor(): void {
    this.attractorEnabled = !this.attractorEnabled;

    // Si se activa y no hay singularidades, crear una en el centro
    if (this.attractorEnabled && this.singularities.length === 0) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      this.createSingularity(centerX, centerY);
    }
  }

  /**
   * Reinicia todas las Singularidades a sus valores iniciales
   */
  resetAllSingularities(): void {
    for (const S of this.singularities) {
      S.M_S = this.M_S_inicial;
      S.R_C = this.k_crecimiento * this.M_S_inicial;
      S.particlesAbsorbed = 0;
      S.vx = 0;
      S.vy = 0;
    }
  }

  /**
   * Destruye todas las Singularidades
   */
  destroyAllSingularities(): void {
    this.singularities = [];
    this.attractorEnabled = false;
  }

  /**
   * Destruye una singularidad específica por ID
   */
  destroySingularity(id: number): void {
    const index = this.singularities.findIndex(s => s.id === id);
    if (index !== -1) {
      this.singularities.splice(index, 1);
      console.log(`💥 Destroyed Singularity #${id}`);
    }
  }

  /**
   * Obtiene información de todas las Singularidades
   */
  getAllSingularities(): Singularity[] {
    return this.singularities;
  }

  /**
   * Obtiene la primera singularidad (compatibilidad con UI anterior)
   */
  getSingularityInfo(): Singularity | null {
    return this.singularities.length > 0 ? this.singularities[0] : null;
  }

  /**
   * Cuenta el número total de atractores activos
   */
  getSingularityCount(): number {
    return this.singularities.length;
  }

  /**
   * Detecta si un punto (x, y) está dentro del área de un atractor
   * Retorna el atractor si está dentro, null si no
   */
  getSingularityAtPosition(x: number, y: number): Singularity | null {
    // Buscar en orden inverso para priorizar los más recientes (dibujados encima)
    for (let i = this.singularities.length - 1; i >= 0; i--) {
      const S = this.singularities[i];
      const dx = x - S.x;
      const dy = y - S.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Usar R_C como área de detección
      if (distance <= S.R_C) {
        return S;
      }
    }
    return null;
  }

  /**
   * Actualiza la velocidad de un atractor (útil para drag and drop)
   */
  setSingularityVelocity(singularityId: number, vx: number, vy: number): void {
    const singularity = this.singularities.find(s => s.id === singularityId);
    if (singularity) {
      singularity.vx = vx;
      singularity.vy = vy;
    }
  }

  // ==================================================================

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.particles = [];
  }
}
