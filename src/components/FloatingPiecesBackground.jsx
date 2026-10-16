import React, { useEffect, useRef } from 'react';

/**
 * Atelier Floating Background - Grandmaster Studio Aesthetic
 * Human-crafted artistic background featuring:
 * - Geometric chess coordinate vectors & constellation guidelines
 * - Architectural Staunton vector silhouettes (Pawn, Knight, Bishop, Rook, Queen, King)
 *   rendered with delicate hairline geometry and soft focal depth
 * - Gentle atmospheric particle motes in Silk Ivory, Master Emerald, and Crimson Ruby
 * - Responsive 3D parallax easing on mouse interaction
 * - STRICT COLOR DISCIPLINE: Silk Ivory, Master Emerald, Crimson Ruby, Obsidian Noir (ZERO BLUE).
 */

// Architectural vector path definitions for chess pieces (normalized 0..1 scale)
const PIECE_GEOMETRIES = {
  pawn: (ctx, s) => {
    // Elegant pawn contour
    ctx.beginPath();
    ctx.arc(0, -s * 0.35, s * 0.16, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.12, -s * 0.15);
    ctx.quadraticCurveTo(-s * 0.08, 0, -s * 0.22, s * 0.35);
    ctx.lineTo(s * 0.22, s * 0.35);
    ctx.quadraticCurveTo(s * 0.08, 0, s * 0.12, -s * 0.15);
    ctx.closePath();
    ctx.moveTo(-s * 0.28, s * 0.38);
    ctx.lineTo(s * 0.28, s * 0.38);
    ctx.lineTo(s * 0.32, s * 0.46);
    ctx.lineTo(-s * 0.32, s * 0.46);
    ctx.closePath();
  },
  knight: (ctx, s) => {
    // Stylized Staunton knight head
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, s * 0.44);
    ctx.lineTo(s * 0.25, s * 0.44);
    ctx.quadraticCurveTo(s * 0.22, s * 0.15, s * 0.28, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.32, -s * 0.32, s * 0.12, -s * 0.45);
    ctx.quadraticCurveTo(s * 0.02, -s * 0.42, -s * 0.08, -s * 0.3);
    ctx.quadraticCurveTo(-s * 0.26, -s * 0.22, -s * 0.32, -s * 0.08);
    ctx.quadraticCurveTo(-s * 0.18, -s * 0.02, -s * 0.14, s * 0.1);
    ctx.quadraticCurveTo(-s * 0.28, s * 0.25, -s * 0.25, s * 0.44);
    ctx.closePath();
    // Mane detail
    ctx.moveTo(s * 0.12, -s * 0.35);
    ctx.lineTo(s * 0.2, -s * 0.18);
  },
  bishop: (ctx, s) => {
    // Slit miter bishop
    ctx.beginPath();
    ctx.arc(0, -s * 0.44, s * 0.06, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.18, -s * 0.1);
    ctx.bezierCurveTo(-s * 0.26, -s * 0.35, s * 0.26, -s * 0.35, s * 0.18, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.1, s * 0.15, s * 0.22, s * 0.38);
    ctx.lineTo(-s * 0.22, s * 0.38);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.15, -s * 0.18, -s * 0.1);
    ctx.closePath();
    // Diagonal slit cut
    ctx.moveTo(-s * 0.08, -s * 0.26);
    ctx.lineTo(s * 0.08, -s * 0.18);
  },
  rook: (ctx, s) => {
    // Castle parapet rook
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, -s * 0.4);
    ctx.lineTo(-s * 0.14, -s * 0.4);
    ctx.lineTo(-s * 0.14, -s * 0.3);
    ctx.lineTo(-s * 0.05, -s * 0.3);
    ctx.lineTo(-s * 0.05, -s * 0.4);
    ctx.lineTo(s * 0.05, -s * 0.4);
    ctx.lineTo(s * 0.05, -s * 0.3);
    ctx.lineTo(s * 0.14, -s * 0.3);
    ctx.lineTo(s * 0.14, -s * 0.4);
    ctx.lineTo(s * 0.24, -s * 0.4);
    ctx.lineTo(s * 0.18, -s * 0.18);
    ctx.lineTo(s * 0.14, s * 0.32);
    ctx.lineTo(s * 0.26, s * 0.42);
    ctx.lineTo(-s * 0.26, s * 0.42);
    ctx.lineTo(-s * 0.14, s * 0.32);
    ctx.lineTo(-s * 0.18, -s * 0.18);
    ctx.closePath();
  },
  queen: (ctx, s) => {
    // Coronet queen
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.28);
    ctx.lineTo(-s * 0.14, -s * 0.14);
    ctx.lineTo(0, -s * 0.34);
    ctx.lineTo(s * 0.14, -s * 0.14);
    ctx.lineTo(s * 0.28, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.16, s * 0.1, s * 0.22, s * 0.4);
    ctx.lineTo(-s * 0.22, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.16, s * 0.1, -s * 0.28, -s * 0.28);
    ctx.closePath();
  },
  king: (ctx, s) => {
    // Imperial cross king
    ctx.beginPath();
    // Cross
    ctx.moveTo(0, -s * 0.48);
    ctx.lineTo(0, -s * 0.34);
    ctx.moveTo(-s * 0.07, -s * 0.42);
    ctx.lineTo(s * 0.07, -s * 0.42);
    // Body
    ctx.moveTo(-s * 0.22, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.3, -s * 0.32, s * 0.3, -s * 0.32, s * 0.22, -s * 0.15);
    ctx.quadraticCurveTo(s * 0.12, s * 0.15, s * 0.25, s * 0.42);
    ctx.lineTo(-s * 0.25, s * 0.42);
    ctx.quadraticCurveTo(-s * 0.12, s * 0.15, -s * 0.22, -s * 0.15);
    ctx.closePath();
  }
};

export const FloatingPiecesBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

    // 16 architectural pieces positioned at varying depths
    // Strictly Ivory White, Master Emerald, and Crimson Ruby
    const colorStyles = [
      { stroke: 'rgba(255, 255, 255, 0.18)', fill: 'rgba(255, 255, 255, 0.025)', glow: 'rgba(255, 255, 255, 0.25)' },
      { stroke: 'rgba(16, 185, 129, 0.28)', fill: 'rgba(16, 185, 129, 0.035)', glow: 'rgba(16, 185, 129, 0.4)' },
      { stroke: 'rgba(239, 68, 68, 0.24)', fill: 'rgba(239, 68, 68, 0.03)', glow: 'rgba(239, 68, 68, 0.35)' }
    ];

    const pieces = Array.from({ length: 14 }, (_, idx) => {
      const type = pieceTypes[idx % pieceTypes.length];
      const style = colorStyles[idx % colorStyles.length];
      const depth = 0.2 + (idx / 14) * 0.8; // 0.2 to 1.0 depth
      return {
        type,
        x: Math.random() * width,
        y: Math.random() * height,
        size: (45 + Math.random() * 65) * (depth > 0.6 ? 1.2 : 0.8),
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: -0.15 - Math.random() * 0.3,
        rotation: (Math.random() - 0.5) * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.002,
        depth,
        style
      };
    });

    // Constellation lines & particles (Silk Ivory, Emerald, Ruby)
    const particleColors = [
      'rgba(255, 255, 255,',
      'rgba(16, 185, 129,',
      'rgba(239, 68, 68,'
    ];

    const particles = Array.from({ length: 38 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.8 + Math.random() * 1.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -0.1 - Math.random() * 0.25,
      baseAlpha: 0.12 + Math.random() * 0.35,
      pulse: Math.random() * Math.PI * 2,
      color: particleColors[i % particleColors.length]
    }));

    let isVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const parallaxOffsetX = (mouse.x - width / 2) * 0.035;
      const parallaxOffsetY = (mouse.y - height / 2) * 0.035;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle Grandmaster architectural coordinate grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const step = 120;
      for (let gx = 0; gx < width; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw atmospheric motes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulse) * 0.15);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentAlpha})`;
        ctx.fill();
      });

      // 3. Draw architectural Staunton wireframe sculptures
      pieces.forEach((piece) => {
        piece.x += piece.speedX;
        piece.y += piece.speedY;
        piece.rotation += piece.rotSpeed;

        if (piece.y < -120) piece.y = height + 100;
        if (piece.y > height + 120) piece.y = -100;
        if (piece.x < -120) piece.x = width + 100;
        if (piece.x > width + 120) piece.x = -100;

        const drawX = piece.x + parallaxOffsetX * piece.depth;
        const drawY = piece.y + parallaxOffsetY * piece.depth;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(piece.rotation);

        // Render geometric piece outline
        const drawFn = PIECE_GEOMETRIES[piece.type];
        if (drawFn) {
          ctx.strokeStyle = piece.style.stroke;
          ctx.fillStyle = piece.style.fill;
          ctx.lineWidth = 1.2 * piece.depth;
          ctx.shadowColor = piece.style.glow;
          ctx.shadowBlur = 8 * piece.depth;
          drawFn(ctx, piece.size);
          ctx.fill();
          ctx.stroke();

          // Subtle concentric focal ring around piece base
          ctx.beginPath();
          ctx.ellipse(0, piece.size * 0.44, piece.size * 0.35, piece.size * 0.08, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.stroke();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070708]">
      {/* Dynamic Canvas with Architectural Geometry */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Velvety Caustic Ambient Glows in Master Emerald, Crimson Ruby & Warm White - ZERO BLUE */}
      <div className="absolute -top-32 -left-32 w-[680px] h-[680px] bg-emerald-600/[0.09] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[680px] h-[680px] bg-red-600/[0.08] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-white/[0.025] rounded-full blur-[180px] pointer-events-none" />

      {/* Subtle fine vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070708]/60 via-transparent to-[#070708]/90 pointer-events-none" />
    </div>
  );
};
