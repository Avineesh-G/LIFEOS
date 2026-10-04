/**
 * LifeOS High-Performance Particle Confetti & Celebration Burst Engine
 * Lightweight, hardware-accelerated 2D canvas particles with zero external dependencies.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'star';
}

const DEFAULT_PALETTE = [
  '#b51a55', // LifeOS Burgundy
  '#ff7a00', // Amber flame
  '#00bfa5', // Teal emerald
  '#3b82f6', // Sapphire blue
  '#e879f9', // Orchid violet
  '#ffd166', // Gold sparkle
];

/**
 * Fires celebratory physics confetti from a specific screen coordinate (or viewport center).
 */
export function triggerConfettiBurst(options?: {
  x?: number;
  y?: number;
  count?: number;
  palette?: string[];
  spread?: number;
}) {
  if (typeof window === 'undefined') return;

  const originX = options?.x ?? window.innerWidth / 2;
  const originY = options?.y ?? window.innerHeight * 0.45;
  const count = options?.count ?? 48;
  const palette = options?.palette ?? DEFAULT_PALETTE;
  const spread = options?.spread ?? 75;

  let canvas = document.getElementById('lifeos-confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'lifeos-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const particles: Particle[] = [];
  const shapes: ('circle' | 'rect' | 'star')[] = ['rect', 'circle', 'rect'];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 8 + 4;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    particles.push({
      x: originX + (Math.random() - 0.5) * spread,
      y: originY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 4 - 2,
      color,
      size: Math.random() * 6 + 4,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.012,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape,
    });
  }

  let animationFrameId: number;

  function render() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;

      activeCount++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gentle gravity
      p.vx *= 0.98; // Air drag
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  render();
}
