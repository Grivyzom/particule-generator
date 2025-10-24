# ✨ Generador de Partículas Interactivo

Una experiencia web interactiva e inolvidable que genera partículas mágicas con el movimiento del cursor y diferentes tipos de clicks. Construido con Angular 20 y Canvas API para un rendimiento óptimo.

## 🎨 Características

### Interacciones
- **Movimiento del cursor**: Crea un rastro mágico de partículas coloridas que siguen tu cursor
- **Click izquierdo**: Genera explosiones espectaculares de estrellas con colores azules y morados
- **Click derecho**: Produce ondas expansivas de diamantes dorados y naranjas
- **Soporte táctil completo**: Totalmente optimizado para dispositivos móviles y tablets
  - Desliza el dedo para crear trails
  - Toca con un dedo para explosiones de estrellas
  - Toca con dos dedos para ondas de diamantes

### Efectos Visuales
- 🌟 Partículas con formas diferentes (círculos, estrellas, diamantes)
- 💫 Efectos de glow y blur para mayor realismo
- 🎭 Colores vibrantes y gradientes animados
- 🌊 Animaciones fluidas con física realista (gravedad, fricción)
- ✨ Fade out suave y natural
- 🎯 Contador en tiempo real de partículas activas

### UX Memorable
- 📱 **100% Responsive**: Se adapta perfectamente a cualquier tamaño de pantalla
- ⚡ **Alto rendimiento**: Optimizado para manejar más de 1000 partículas simultáneas
- 🎨 **Diseño moderno**: Interfaz minimalista con animaciones sofisticadas
- 💡 **Instrucciones interactivas**: Guía visual que se oculta automáticamente
- ♿ **Accesibilidad**: Soporte para preferencias de movimiento reducido
- 🎮 **Intuitivo**: No requiere instrucciones, la experiencia es natural

## 🚀 Inicio Rápido

### Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm start
```

Abre tu navegador en `http://localhost:4200/` y comienza a crear arte con partículas.

### Construcción

Para construir el proyecto para producción:

```bash
npm run build
```

Los archivos optimizados se generarán en el directorio `dist/`.

## 🛠️ Tecnologías

- **Angular 20**: Framework moderno con signals y standalone components
- **TypeScript**: Tipado estático para código más robusto
- **Canvas API**: Renderizado de alto rendimiento
- **CSS3**: Animaciones y efectos visuales avanzados
- **RxJS**: Manejo reactivo de eventos

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── particle-generator/          # Componente principal
│   │   ├── particle-generator.ts    # Lógica del componente
│   │   ├── particle-generator.html  # Template con instrucciones
│   │   └── particle-generator.css   # Estilos responsive
│   ├── services/
│   │   └── particle.ts              # Servicio de partículas y física
│   ├── app.ts                       # Componente raíz
│   └── app.html                     # Template principal
└── styles.css                       # Estilos globales
```

## 🎯 Características Técnicas

### Sistema de Partículas
- **Tipos de partículas**: Trail, LeftClick, RightClick
- **Propiedades físicas**: Velocidad, rotación, tamaño, color, transparencia
- **Gestión de vida útil**: Cada partícula tiene un ciclo de vida definido
- **Optimización**: Límite de 1000 partículas para mantener 60 FPS

### Efectos Visuales
- **Blur dinámico**: Cada tipo de partícula tiene su nivel de desenfoque
- **Glow effect**: Sombras de color para efecto luminoso
- **Formas geométricas**: Círculos, estrellas de 5 puntas, diamantes
- **Colores temáticos**: Paletas específicas para cada interacción

### Performance
- **RequestAnimationFrame**: Animaciones sincronizadas con el refresh rate
- **Canvas optimization**: Fade trail para mejor rendimiento
- **Memory management**: Limpieza automática de partículas muertas
- **Event throttling**: Control de frecuencia de generación de partículas

## 🎨 Personalización

Puedes personalizar los colores, tamaños y comportamientos editando el archivo `particle.ts`:

```typescript
// Colores de las partículas de trail
private readonly trailColors = [
  '#FF6B9D', '#C44569', '#FFA07A', '#FFB6C1',
  // Agrega tus colores aquí
];

// Cantidad de partículas por explosión
createLeftClickParticles(x: number, y: number): void {
  const count = 40 + Math.floor(Math.random() * 20); // Modifica aquí
  // ...
}
```

## 📱 Soporte de Navegadores

- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ Navegadores móviles (iOS Safari, Chrome Mobile)

## 🤝 Contribuciones

Este es un proyecto personal, pero las sugerencias y mejoras son bienvenidas.

## 📄 Licencia

Este proyecto fue creado con fines educativos y de demostración.

## 🎉 Créditos

Desarrollado con ❤️ usando Angular CLI version 20.3.3

---

**¡Disfruta creando tu propia obra de arte con partículas!** ✨🎨
