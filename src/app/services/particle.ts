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
  rotation?: number;
  rotationSpeed?: number;
  blur?: number;
  glow?: boolean;
  electricPoints?: Array<{x: number, y: number}>; // Para rayos
  pokerSuit?: 'spade' | 'heart' | 'diamond' | 'club'; // Para cartas de poker
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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
    // Solo crear partículas si el mouse se ha movido lo suficiente
    const dx = x - this.lastMouseX;
    const dy = y - this.lastMouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return;

    this.lastMouseX = x;
    this.lastMouseY = y;
    this.trailCounter++;

    // Crear 2-3 partículas de trail por frame
    const count = Math.random() > 0.5 ? 2 : 3;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.currentTrailShape === 'lightning' 
        ? Math.random() * 3 + 2  // Rayos más rápidos
        : Math.random() * 0.5 + 0.2;
      
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
        maxLife: this.currentTrailShape === 'lightning' ? 120 + Math.random() * 60 : 60 + Math.random() * 40,
        type: 'trail',
        shape: this.currentTrailShape,
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
    const count = 40 + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = this.currentLeftClickShape === 'lightning' 
        ? Math.random() * 6 + 3  // Rayos más rápidos
        : Math.random() * 4 + 2;
      
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
        maxLife: this.currentLeftClickShape === 'lightning' ? 150 + Math.random() * 70 : 80 + Math.random() * 40,
        type: 'leftClick',
        shape: this.currentLeftClickShape,
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
    const count = 30 + Math.floor(Math.random() * 15);
    
    // Crear un efecto de ondas expansivas
    for (let wave = 0; wave < 3; wave++) {
      const waveParticles = Math.floor(count / 3);
      setTimeout(() => {
        for (let i = 0; i < waveParticles; i++) {
          const angle = (Math.PI * 2 * i) / waveParticles;
          const speed = this.currentRightClickShape === 'lightning' 
            ? 4 + wave * 2 + Math.random() * 3  // Rayos más rápidos
            : 3 + wave * 1.5 + Math.random() * 2;
          
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
            maxLife: this.currentRightClickShape === 'lightning' ? 180 + Math.random() * 80 : 100 + Math.random() * 50,
            type: 'rightClick',
            shape: this.currentRightClickShape,
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Actualizar posición
      p.x += p.vx;
      p.y += p.vy;
      
      // Aplicar gravedad suave (excepto para rayos)
      if (p.shape !== 'lightning' && (p.type === 'leftClick' || p.type === 'rightClick')) {
        p.vy += 0.08;
      }
      
      // Fricción (los rayos mantienen más velocidad)
      if (p.shape === 'lightning') {
        p.vx *= 0.99;
        p.vy *= 0.99;
        
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
        p.vx *= 0.98;
        p.vy *= 0.98;
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

  private render(): void {
    // Limpiar con un fade suave para crear efecto de trail
    this.ctx.fillStyle = 'rgba(10, 10, 20, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
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

  getParticleCount(): number {
    return this.particles.length;
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.particles = [];
  }
}
