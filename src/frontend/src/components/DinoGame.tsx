import { Button } from "@/components/ui/button";
import { Copy, Gamepad2, Heart, RotateCcw, Trophy, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dino {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isOnGround: boolean;
  isDucking: boolean;
  jumpCount: number; // 0 = no jump, 1 = single, 2 = double
  legFrame: number;
  invincible: number; // frames of invincibility remaining
  flashTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "cactus" | "bird" | "double_cactus" | "fast_cactus";
  speedMultiplier: number;
  birdHeight?: "low" | "mid" | "high";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  opacity: number;
  speed: number;
}

interface GameState {
  dino: Dino;
  obstacles: Obstacle[];
  particles: Particle[];
  speedLines: SpeedLine[];
  score: number;
  speed: number;
  gameOver: boolean;
  started: boolean;
  frameCount: number;
  nextObstacleIn: number;
  groundY: number;
  lives: number;
  doubleJumpAvailable: boolean;
  comboTimer: number;
  comboMultiplier: number;
  screenShake: number;
  bgOffset: number;
  starOffset: number;
  clouds: { x: number; y: number; w: number; speed: number }[];
  showLifeLostText: number; // frames to show "1 UP LEFT!"
}

// ─── Reward logic ─────────────────────────────────────────────────────────────
function getReward(
  score: number,
): { text: string; coupon: string; isFree: boolean } | null {
  if (score >= 10000)
    return { text: "FREE PERFUME 🎉", coupon: "FREEALVRA", isFree: true };
  if (score >= 5000)
    return { text: "₹200 OFF", coupon: "DINO200", isFree: false };
  if (score >= 3000)
    return { text: "₹150 OFF", coupon: "DINO150", isFree: false };
  if (score >= 2000)
    return { text: "₹100 OFF", coupon: "DINO100", isFree: false };
  if (score >= 1000)
    return { text: "₹50 OFF", coupon: "DINO50", isFree: false };
  if (score >= 500) return { text: "₹20 OFF", coupon: "DINO20", isFree: false };
  return null;
}

function getSpeedTier(speed: number): { label: string; color: string } {
  if (speed < 9) return { label: "SLOW", color: "#00ff88" };
  if (speed < 14) return { label: "FAST", color: "#ffcc00" };
  if (speed < 20) return { label: "HYPER", color: "#ff6600" };
  return { label: "ULTRA", color: "#ff0066" };
}

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function getBgColor(score: number): { top: string; bottom: string } {
  if (score < 500) {
    return { top: "#0a0020", bottom: "#10003a" };
  }
  if (score < 1500) {
    return { top: "#1a0040", bottom: "#200050" };
  }
  if (score < 3000) {
    return { top: "#2a0035", bottom: "#3a0020" };
  }
  if (score < 5000) {
    return { top: "#3a0010", bottom: "#500010" };
  }
  return { top: "#4a0000", bottom: "#200020" };
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  score: number,
  starOffset: number,
  clouds: { x: number; y: number; w: number; speed: number }[],
) {
  const { top, bottom } = getBgColor(score);
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Stars layer 1 (slow)
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137 + starOffset * 0.3) % (canvasW + 20)) - 10;
    const sy = (i * 73) % (canvasH * 0.6);
    const size = i % 3 === 0 ? 1.5 : 1;
    ctx.fillRect(sx, sy, size, size);
  }

  // Stars layer 2 (fast)
  ctx.fillStyle = "rgba(200, 180, 255, 0.5)";
  for (let i = 0; i < 25; i++) {
    const sx = ((i * 211 + starOffset * 0.7) % (canvasW + 20)) - 10;
    const sy = (i * 53 + 15) % (canvasH * 0.55);
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Clouds / nebulas
  for (const cloud of clouds) {
    const alpha = 0.06 + (score / 20000) * 0.04;
    ctx.fillStyle = `rgba(150, 80, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.w, cloud.w * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  groundY: number,
  bgOffset: number,
  score: number,
) {
  // Neon ground line with glow
  const glowColor =
    score < 3000 ? "#00ff88" : score < 6000 ? "#ffcc00" : "#ff3366";

  ctx.shadowBlur = 8;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvasW, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ground detail dots
  ctx.fillStyle = `${glowColor}33`;
  for (let i = 0; i < 12; i++) {
    const rx = ((i * 160 - bgOffset * 0.5) % (canvasW + 40)) - 20;
    ctx.fillRect(rx, groundY + 4, 6, 2);
    ctx.fillRect(rx + 25, groundY + 2, 4, 1);
  }
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  dino: Dino,
  timestamp: number,
) {
  if (dino.flashTimer > 0 && Math.floor(dino.flashTimer / 4) % 2 === 0) return;

  const x = dino.x;
  const y = dino.y;
  const w = dino.width;
  const h = dino.height;
  const frame = Math.floor(timestamp / 80) % 4;

  // Dino glow aura
  if (dino.invincible > 0) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffff";
  } else {
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffaa00";
  }

  if (dino.isDucking) {
    // Ducked body - low and wide
    ctx.fillStyle = "#e8a820";
    ctx.beginPath();
    ctx.roundRect(x, y + h * 0.45, w * 0.9, h * 0.55, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = "#d4901a";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.4, y + h * 0.3, w * 0.6, h * 0.45, 3);
    ctx.fill();

    // Eye with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.arc(x + w * 0.78, y + h * 0.42, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + w * 0.76, y + h * 0.4, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffaa00";

    // Beak
    ctx.fillStyle = "#e8a820";
    ctx.fillRect(x + w * 0.96, y + h * 0.5, w * 0.2, h * 0.1);

    // Tail
    ctx.fillStyle = "#c87010";
    ctx.beginPath();
    ctx.roundRect(x - w * 0.25, y + h * 0.5, w * 0.3, h * 0.25, 3);
    ctx.fill();
  } else {
    // Standing body
    ctx.fillStyle = "#e8a820";
    ctx.beginPath();
    ctx.roundRect(x, y + h * 0.2, w * 0.72, h * 0.72, 4);
    ctx.fill();

    // Back bump / spine
    ctx.fillStyle = "#d4901a";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.05, y + h * 0.15, w * 0.55, h * 0.3, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = "#e8a820";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.3, y, w * 0.52, h * 0.48, 4);
    ctx.fill();

    // Head detail
    ctx.fillStyle = "#d4901a";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.32, y + h * 0.04, w * 0.46, h * 0.2, 3);
    ctx.fill();

    // Eye with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff6600";
    ctx.fillStyle = "#ff3300";
    ctx.beginPath();
    ctx.arc(x + w * 0.65, y + h * 0.14, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + w * 0.63, y + h * 0.12, w * 0.035, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffaa00";

    // Beak
    ctx.fillStyle = "#c87010";
    ctx.fillRect(x + w * 0.78, y + h * 0.26, w * 0.28, h * 0.1);

    // Tail
    ctx.fillStyle = "#c87010";
    ctx.beginPath();
    ctx.roundRect(x - w * 0.22, y + h * 0.3, w * 0.28, h * 0.28, 3);
    ctx.fill();

    // Legs (4-frame animation)
    const legOffsets = [
      [0, h * 0.12],
      [h * 0.08, h * 0.04],
      [h * 0.12, 0],
      [h * 0.04, h * 0.08],
    ];
    const [l1, l2] = legOffsets[frame];

    ctx.fillStyle = "#b87010";
    // Leg 1
    ctx.beginPath();
    ctx.roundRect(x + w * 0.1, y + h * 0.85, w * 0.2, h * 0.15 + l1, 2);
    ctx.fill();
    // Leg 2
    ctx.beginPath();
    ctx.roundRect(x + w * 0.42, y + h * 0.85, w * 0.2, h * 0.15 + l2, 2);
    ctx.fill();

    // Foot details
    ctx.fillStyle = "#a06010";
    ctx.fillRect(x + w * 0.06, y + h + l1 - h * 0.02, w * 0.28, h * 0.06);
    ctx.fillRect(x + w * 0.38, y + h + l2 - h * 0.02, w * 0.28, h * 0.06);
  }

  ctx.shadowBlur = 0;
}

function drawCactus(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const { x, y, width: w, height: h, type } = obs;

  if (type === "bird") {
    // Neon bird
    const flap = Math.floor(Date.now() / 150) % 2 === 0;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff00ff";
    ctx.fillStyle = "#cc00ff";

    // Body
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.55, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = "#ff44ff";
    if (flap) {
      // Wings up
      ctx.beginPath();
      ctx.moveTo(x + w * 0.1, y + h * 0.55);
      ctx.lineTo(x - w * 0.1, y + h * 0.1);
      ctx.lineTo(x + w * 0.5, y + h * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.9, y + h * 0.55);
      ctx.lineTo(x + w * 1.1, y + h * 0.1);
      ctx.lineTo(x + w * 0.5, y + h * 0.4);
      ctx.fill();
    } else {
      // Wings level
      ctx.beginPath();
      ctx.moveTo(x + w * 0.1, y + h * 0.55);
      ctx.lineTo(x - w * 0.15, y + h * 0.7);
      ctx.lineTo(x + w * 0.5, y + h * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.9, y + h * 0.55);
      ctx.lineTo(x + w * 1.15, y + h * 0.7);
      ctx.lineTo(x + w * 0.5, y + h * 0.5);
      ctx.fill();
    }

    // Eye
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(x + w * 0.68, y + h * 0.45, w * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.8, y + h * 0.5);
    ctx.lineTo(x + w * 1.0, y + h * 0.6);
    ctx.lineTo(x + w * 0.8, y + h * 0.65);
    ctx.fill();

    ctx.shadowBlur = 0;
    return;
  }

  if (type === "fast_cactus") {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff3300";
    ctx.fillStyle = "#ff4400";
  } else {
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ff44";
    ctx.fillStyle = "#00cc33";
  }

  // Main stem
  ctx.beginPath();
  ctx.roundRect(x + w * 0.35, y, w * 0.3, h, 2);
  ctx.fill();

  // Left arm
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.25, w * 0.38, h * 0.18, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.08, w * 0.15, h * 0.22, 2);
  ctx.fill();

  // Right arm
  ctx.beginPath();
  ctx.roundRect(x + w * 0.62, y + h * 0.35, w * 0.38, h * 0.18, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w * 0.85, y + h * 0.18, w * 0.15, h * 0.22, 2);
  ctx.fill();

  // For double cactus, draw a second one
  if (type === "double_cactus") {
    const x2 = x + w + 10;
    const h2 = h * 0.8;
    ctx.beginPath();
    ctx.roundRect(x2 + w * 0.35, y + h - h2, w * 0.3, h2, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x2, y + h - h2 + h2 * 0.3, w * 0.38, h2 * 0.18, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(
      x2 + w * 0.62,
      y + h - h2 + h2 * 0.25,
      w * 0.38,
      h2 * 0.18,
      2,
    );
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  lines: SpeedLine[],
  speed: number,
) {
  if (speed < 12) return;
  const alpha = Math.min((speed - 12) / 8, 0.4);
  ctx.strokeStyle = `rgba(180, 120, 255, ${alpha})`;
  ctx.lineWidth = 1;
  for (const line of lines) {
    ctx.globalAlpha = line.opacity * alpha;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x + line.length, line.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Spawn particles helper ─────────────────────────────────────────────────
function spawnParticles(
  gs: GameState,
  x: number,
  y: number,
  count: number,
  type: "dust" | "hit",
) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI / count) * i + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 3;
    gs.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed - Math.random() * 2,
      life: 25 + Math.floor(Math.random() * 20),
      maxLife: 45,
      size: type === "hit" ? 4 + Math.random() * 4 : 2 + Math.random() * 2,
      color:
        type === "hit"
          ? Math.random() > 0.5
            ? "#ff3300"
            : "#ffcc00"
          : "#c8a060",
    });
  }
}

// Precomputed confetti particle data (stable IDs, no runtime Math.random in render)
const CONFETTI_PARTICLES = [
  {
    id: "c0",
    w: 7.8,
    h: 4.2,
    left: 27.5,
    top: 22.3,
    color: "#cc00ff",
    yDist: -161,
    duration: 3.28,
    delay: 0.17,
    repeatDelay: 1.27,
  },
  {
    id: "c1",
    w: 4.2,
    h: 5.3,
    left: 50.5,
    top: 2.7,
    color: "#ffcc00",
    yDist: -158,
    duration: 2.59,
    delay: 0.44,
    repeatDelay: 1.77,
  },
  {
    id: "c2",
    w: 8.9,
    h: 4.0,
    left: 80.6,
    top: 69.8,
    color: "#ff6600",
    yDist: -99,
    duration: 3.41,
    delay: 0.67,
    repeatDelay: 0.28,
  },
  {
    id: "c3",
    w: 4.6,
    h: 9.1,
    left: 60.4,
    top: 80.7,
    color: "#cc00ff",
    yDist: -144,
    duration: 3.45,
    delay: 0.76,
    repeatDelay: 1.66,
  },
  {
    id: "c4",
    w: 9.0,
    h: 7.7,
    left: 86.2,
    top: 57.7,
    color: "#cc00ff",
    yDist: -85,
    duration: 1.96,
    delay: 0.58,
    repeatDelay: 0.24,
  },
  {
    id: "c5",
    w: 5.4,
    h: 4.6,
    left: 27.8,
    top: 63.6,
    color: "#ff6600",
    yDist: -124,
    duration: 1.92,
    delay: 0.53,
    repeatDelay: 2.81,
  },
  {
    id: "c6",
    w: 7.9,
    h: 7.7,
    left: 17.1,
    top: 72.9,
    color: "#ffcc00",
    yDist: -126,
    duration: 3.48,
    delay: 1.28,
    repeatDelay: 1.67,
  },
  {
    id: "c7",
    w: 8.1,
    h: 9.1,
    left: 77.6,
    top: 22.9,
    color: "#ffcc00",
    yDist: -118,
    duration: 2.04,
    delay: 0.42,
    repeatDelay: 2.83,
  },
  {
    id: "c8",
    w: 9.3,
    h: 5.9,
    left: 65.5,
    top: 39.6,
    color: "#00ffff",
    yDist: -135,
    duration: 2.03,
    delay: 0.49,
    repeatDelay: 1.68,
  },
  {
    id: "c9",
    w: 5.6,
    h: 7.5,
    left: 89.8,
    top: 39.9,
    color: "#ffcc00",
    yDist: -200,
    duration: 2.52,
    delay: 0.18,
    repeatDelay: 0.14,
  },
  {
    id: "c10",
    w: 4.7,
    h: 7.8,
    left: 79.2,
    top: 42.2,
    color: "#ffcc00",
    yDist: -126,
    duration: 3.49,
    delay: 1.06,
    repeatDelay: 2.91,
  },
  {
    id: "c11",
    w: 9.2,
    h: 4.1,
    left: 72.1,
    top: 68.2,
    color: "#cc00ff",
    yDist: -112,
    duration: 2.78,
    delay: 0.22,
    repeatDelay: 1.3,
  },
  {
    id: "c12",
    w: 6.7,
    h: 9.7,
    left: 87.6,
    top: 26.3,
    color: "#cc00ff",
    yDist: -101,
    duration: 3.33,
    delay: 1.74,
    repeatDelay: 0.9,
  },
  {
    id: "c13",
    w: 7.8,
    h: 7.7,
    left: 15.3,
    top: 76.3,
    color: "#cc00ff",
    yDist: -173,
    duration: 2.56,
    delay: 0.0,
    repeatDelay: 0.97,
  },
  {
    id: "c14",
    w: 4.1,
    h: 9.6,
    left: 87.9,
    top: 83.2,
    color: "#ff6600",
    yDist: -87,
    duration: 3.26,
    delay: 1.89,
    repeatDelay: 0.26,
  },
  {
    id: "c15",
    w: 6.9,
    h: 4.4,
    left: 76.1,
    top: 76.6,
    color: "#ffcc00",
    yDist: -137,
    duration: 2.6,
    delay: 0.53,
    repeatDelay: 2.62,
  },
  {
    id: "c16",
    w: 6.5,
    h: 5.3,
    left: 53.9,
    top: 73.0,
    color: "#ffcc00",
    yDist: -117,
    duration: 3.49,
    delay: 1.3,
    repeatDelay: 1.31,
  },
  {
    id: "c17",
    w: 7.1,
    h: 4.7,
    left: 22.5,
    top: 33.8,
    color: "#cc00ff",
    yDist: -108,
    duration: 1.94,
    delay: 0.14,
    repeatDelay: 1.89,
  },
  {
    id: "c18",
    w: 5.4,
    h: 9.4,
    left: 86.0,
    top: 7.1,
    color: "#ffcc00",
    yDist: -160,
    duration: 1.93,
    delay: 0.26,
    repeatDelay: 2.81,
  },
  {
    id: "c19",
    w: 7.4,
    h: 6.8,
    left: 78.5,
    top: 80.7,
    color: "#ffcc00",
    yDist: -92,
    duration: 2.36,
    delay: 0.85,
    repeatDelay: 1.4,
  },
  {
    id: "c20",
    w: 8.4,
    h: 8.0,
    left: 98.4,
    top: 9.8,
    color: "#ff6600",
    yDist: -121,
    duration: 3.22,
    delay: 0.5,
    repeatDelay: 0.57,
  },
  {
    id: "c21",
    w: 6.7,
    h: 6.5,
    left: 27.9,
    top: 25.0,
    color: "#00ffff",
    yDist: -133,
    duration: 3.22,
    delay: 1.1,
    repeatDelay: 0.15,
  },
  {
    id: "c22",
    w: 10.0,
    h: 9.0,
    left: 96.9,
    top: 92.6,
    color: "#00ffff",
    yDist: -100,
    duration: 2.47,
    delay: 0.43,
    repeatDelay: 1.2,
  },
  {
    id: "c23",
    w: 4.4,
    h: 6.3,
    left: 98.5,
    top: 26.5,
    color: "#00ffff",
    yDist: -135,
    duration: 2.35,
    delay: 1.91,
    repeatDelay: 2.99,
  },
  {
    id: "c24",
    w: 7.3,
    h: 8.3,
    left: 15.5,
    top: 29.7,
    color: "#00ffff",
    yDist: -150,
    duration: 2.58,
    delay: 1.5,
    repeatDelay: 0.17,
  },
  {
    id: "c25",
    w: 7.5,
    h: 7.0,
    left: 85.3,
    top: 15.7,
    color: "#00ffff",
    yDist: -90,
    duration: 1.87,
    delay: 1.19,
    repeatDelay: 2.03,
  },
  {
    id: "c26",
    w: 5.4,
    h: 4.7,
    left: 89.0,
    top: 24.6,
    color: "#cc00ff",
    yDist: -154,
    duration: 2.34,
    delay: 1.17,
    repeatDelay: 1.57,
  },
  {
    id: "c27",
    w: 9.6,
    h: 5.2,
    left: 71.6,
    top: 23.9,
    color: "#ff6600",
    yDist: -161,
    duration: 2.1,
    delay: 0.63,
    repeatDelay: 2.26,
  },
  {
    id: "c28",
    w: 4.4,
    h: 6.7,
    left: 99.8,
    top: 99.6,
    color: "#ffcc00",
    yDist: -106,
    duration: 2.03,
    delay: 1.87,
    repeatDelay: 2.64,
  },
  {
    id: "c29",
    w: 9.3,
    h: 6.2,
    left: 15.8,
    top: 83.4,
    color: "#cc00ff",
    yDist: -153,
    duration: 3.47,
    delay: 1.31,
    repeatDelay: 0.02,
  },
] as const;

// ─── DinoGame Component ───────────────────────────────────────────────────────
export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isDuckingRef = useRef<boolean>(false);
  const touchStartRef = useRef<number>(0);

  const [showReward, setShowReward] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [_displayScore, setDisplayScore] = useState(0);
  const [lives, setLives] = useState(2);
  const [doubleJumpAvailable, setDoubleJumpAvailable] = useState(true);
  const [speedTier, setSpeedTier] = useState<{ label: string; color: string }>({
    label: "SLOW",
    color: "#00ff88",
  });
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number.parseInt(
        localStorage.getItem("alvra_dino_highscore") || "0",
      );
    } catch {
      return 0;
    }
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const CANVAS_W = 700;
  const CANVAS_H = 300;
  const GROUND_Y = CANVAS_H - 55;
  const DINO_W = 44;
  const DINO_H = 52;
  const DINO_DUCK_H = 32;
  const GRAVITY = 0.65;
  const JUMP_FORCE = -14;
  const DOUBLE_JUMP_FORCE = -12;

  const initGameState = useCallback((): GameState => {
    const clouds = Array.from({ length: 5 }, (_, i) => ({
      x: i * (CANVAS_W / 5) + Math.random() * 100,
      y: 20 + Math.random() * 80,
      w: 60 + Math.random() * 80,
      speed: 0.3 + Math.random() * 0.5,
    }));

    const speedLines = Array.from({ length: 15 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * GROUND_Y,
      length: 30 + Math.random() * 80,
      opacity: 0.3 + Math.random() * 0.5,
      speed: 8 + Math.random() * 6,
    }));

    return {
      dino: {
        x: 80,
        y: GROUND_Y - DINO_H,
        width: DINO_W,
        height: DINO_H,
        velocityY: 0,
        isOnGround: true,
        isDucking: false,
        jumpCount: 0,
        legFrame: 0,
        invincible: 0,
        flashTimer: 0,
      },
      obstacles: [],
      particles: [],
      score: 0,
      speed: 6,
      gameOver: false,
      started: false,
      frameCount: 0,
      nextObstacleIn: 80,
      groundY: GROUND_Y,
      lives: 2,
      doubleJumpAvailable: true,
      comboTimer: 0,
      comboMultiplier: 1,
      screenShake: 0,
      bgOffset: 0,
      starOffset: 0,
      clouds,
      speedLines,
      showLifeLostText: 0,
    };
  }, [GROUND_Y]);

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs) return;
    if (!gs.started) {
      gs.started = true;
      setGameStarted(true);
      return;
    }
    if (gs.gameOver) return;

    if (gs.dino.isDucking) {
      gs.dino.isDucking = false;
      gs.dino.height = DINO_H;
      return;
    }

    if (gs.dino.isOnGround) {
      gs.dino.velocityY = JUMP_FORCE;
      gs.dino.isOnGround = false;
      gs.dino.jumpCount = 1;
      gs.doubleJumpAvailable = true;
      setDoubleJumpAvailable(true);
    } else if (gs.dino.jumpCount === 1 && gs.doubleJumpAvailable) {
      // Double jump!
      gs.dino.velocityY = DOUBLE_JUMP_FORCE;
      gs.dino.jumpCount = 2;
      gs.doubleJumpAvailable = false;
      setDoubleJumpAvailable(false);
      // Spawn double jump particles
      spawnParticles(gs, gs.dino.x + DINO_W / 2, gs.dino.y + DINO_H, 8, "dust");
    }
  }, []);

  const duck = useCallback(
    (isDucking: boolean) => {
      const gs = gameStateRef.current;
      if (!gs || !gs.started || gs.gameOver) return;
      isDuckingRef.current = isDucking;

      if (isDucking && !gs.dino.isDucking && !gs.dino.isOnGround) {
        // Fast fall when ducking mid-air
        gs.dino.velocityY += 5;
      }
      if (isDucking && gs.dino.isOnGround) {
        gs.dino.isDucking = true;
        gs.dino.height = DINO_DUCK_H;
        gs.dino.y = GROUND_Y - DINO_DUCK_H;
      } else if (!isDucking && gs.dino.isDucking) {
        gs.dino.isDucking = false;
        gs.dino.height = DINO_H;
        gs.dino.y = GROUND_Y - DINO_H;
      }
    },
    [GROUND_Y],
  );

  const checkCollision = useCallback((dino: Dino, obs: Obstacle): boolean => {
    if (dino.invincible > 0) return false;
    const marginX = 8;
    const marginY = 6;
    const dinoRight = dino.x + dino.width - marginX;
    const dinoLeft = dino.x + marginX;
    const dinoTop = dino.y + marginY;
    const dinoBottom = dino.y + dino.height - marginY;

    // For double cactus, extend collision width
    const obsWidth =
      obs.type === "double_cactus" ? obs.width * 2 + 10 : obs.width;
    const obsRight = obs.x + obsWidth - marginX;
    const obsLeft = obs.x + marginX;
    const obsTop = obs.y + marginY;
    const obsBottom = obs.y + obs.height - marginY;

    return (
      dinoRight > obsLeft &&
      dinoLeft < obsRight &&
      dinoBottom > obsTop &&
      dinoTop < obsBottom
    );
  }, []);

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const gs = gameStateRef.current;
      if (!gs || gs.gameOver) return;

      const dt = Math.min((timestamp - lastTimeRef.current) / 16.67, 3);
      lastTimeRef.current = timestamp;

      if (!gs.started) {
        // Draw idle state
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawBackground(ctx, CANVAS_W, CANVAS_H, 0, 0, gs.clouds);
        drawGround(ctx, CANVAS_W, GROUND_Y, 0, 0);
        drawDino(ctx, gs.dino, timestamp);

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#cc88ff";
        ctx.fillStyle = "#cc88ff";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "PRESS SPACE or TAP to start",
          CANVAS_W / 2,
          CANVAS_H / 2 - 20,
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(200,160,255,0.5)";
        ctx.font = "13px monospace";
        ctx.fillText(
          "SPACE / UP = Jump • DOWN = Duck • Double-tap = Double Jump",
          CANVAS_W / 2,
          CANVAS_H / 2 + 5,
        );

        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // ── Update ─────────────────────────────────────────────────────────────

      // Handle duck from ref
      if (isDuckingRef.current && gs.dino.isOnGround && !gs.dino.isDucking) {
        gs.dino.isDucking = true;
        gs.dino.height = DINO_DUCK_H;
        gs.dino.y = GROUND_Y - DINO_DUCK_H;
      } else if (
        !isDuckingRef.current &&
        gs.dino.isDucking &&
        gs.dino.isOnGround
      ) {
        gs.dino.isDucking = false;
        gs.dino.height = DINO_H;
        gs.dino.y = GROUND_Y - DINO_H;
      }

      // Score
      const scoreGain = Math.ceil(gs.speed * dt * 0.25 * gs.comboMultiplier);
      gs.score += scoreGain;

      // Speed increase (harder)
      gs.speed = 6 + gs.score * 0.005;
      if (gs.speed > 25) gs.speed = 25;

      // Combo timer
      gs.comboTimer += dt;
      if (gs.comboTimer >= 60) {
        gs.comboTimer = 0;
        gs.comboMultiplier = Math.min(gs.comboMultiplier + 0.1, 3);
      }

      // Dino physics
      gs.dino.velocityY += GRAVITY * dt;
      gs.dino.y += gs.dino.velocityY * dt;

      if (gs.dino.y >= GROUND_Y - gs.dino.height) {
        const wasInAir = !gs.dino.isOnGround;
        gs.dino.y = GROUND_Y - gs.dino.height;
        gs.dino.velocityY = 0;
        gs.dino.isOnGround = true;
        gs.dino.jumpCount = 0;
        if (wasInAir) {
          // Landing particles
          spawnParticles(gs, gs.dino.x + DINO_W / 2, GROUND_Y, 6, "dust");
          gs.doubleJumpAvailable = true;
          setDoubleJumpAvailable(true);
        }
      }

      // Invincibility countdown
      if (gs.dino.invincible > 0) gs.dino.invincible -= dt;
      if (gs.dino.flashTimer > 0) gs.dino.flashTimer -= dt;
      if (gs.showLifeLostText > 0) gs.showLifeLostText -= dt;

      // Screen shake
      if (gs.screenShake > 0) gs.screenShake -= dt;

      // Background scroll
      gs.bgOffset += gs.speed * dt;
      gs.starOffset += gs.speed * dt;

      // Cloud scroll
      for (const cloud of gs.clouds) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x < -cloud.w * 2) {
          cloud.x = CANVAS_W + cloud.w;
          cloud.y = 20 + Math.random() * 80;
        }
      }

      // Speed lines
      for (const line of gs.speedLines) {
        line.x -= line.speed * dt * (gs.speed / 8);
        if (line.x + line.length < 0) {
          line.x = CANVAS_W + 10;
          line.y = Math.random() * GROUND_Y;
        }
      }

      // Spawn obstacles
      gs.frameCount += dt;
      gs.nextObstacleIn -= dt;
      if (gs.nextObstacleIn <= 0) {
        const minGap = Math.max(40, 80 - gs.score / 100);
        gs.nextObstacleIn = minGap + Math.random() * 50;

        const roll = Math.random();
        if (gs.score > 3000 && roll < 0.12) {
          // Fast small cactus
          const cH = 28 + Math.random() * 12;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 22,
            height: cH,
            type: "fast_cactus",
            speedMultiplier: 1.8,
          });
        } else if (gs.score > 2000 && roll < 0.25) {
          // Double cactus
          const cH = 40 + Math.random() * 20;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 28,
            height: cH,
            type: "double_cactus",
            speedMultiplier: 1,
          });
        } else if (gs.score > 1000 && roll < 0.4) {
          // Bird
          const birdRoll = Math.random();
          let birdY: number;
          let birdHeightType: "low" | "mid" | "high";
          if (birdRoll < 0.33) {
            birdY = GROUND_Y - 90;
            birdHeightType = "low"; // must jump over
          } else if (birdRoll < 0.66) {
            birdY = GROUND_Y - 140;
            birdHeightType = "mid"; // tricky - need to time
          } else {
            birdY = GROUND_Y - 200;
            birdHeightType = "high"; // can pass under by ducking
          }
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: birdY,
            width: 40,
            height: 30,
            type: "bird",
            speedMultiplier: 1.1,
            birdHeight: birdHeightType,
          });
        } else {
          // Normal cactus
          const cH = 40 + Math.random() * 35;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 28,
            height: cH,
            type: "cactus",
            speedMultiplier: 1,
          });
        }
      }

      // Update obstacles
      gs.obstacles = gs.obstacles
        .map((o) => ({ ...o, x: o.x - gs.speed * o.speedMultiplier * dt }))
        .filter((o) => o.x > -80);

      // Update particles
      gs.particles = gs.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 0.15 * dt,
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0);

      // Collision detection
      for (const obs of gs.obstacles) {
        if (checkCollision(gs.dino, obs)) {
          gs.comboMultiplier = 1;
          gs.comboTimer = 0;
          spawnParticles(
            gs,
            gs.dino.x + DINO_W / 2,
            gs.dino.y + DINO_H / 2,
            15,
            "hit",
          );
          gs.screenShake = 20;

          if (gs.lives > 1) {
            gs.lives -= 1;
            gs.dino.invincible = 120;
            gs.dino.flashTimer = 120;
            gs.showLifeLostText = 90;
            setLives(gs.lives);
            // Push obstacle away so we don't re-collide
            obs.x = -200;
          } else {
            gs.gameOver = true;
            setFinalScore(gs.score);
            // Save high score
            if (gs.score > highScore) {
              setHighScore(gs.score);
              setIsNewHighScore(true);
              try {
                localStorage.setItem(
                  "alvra_dino_highscore",
                  gs.score.toString(),
                );
              } catch {}
            }
            setShowReward(true);
            return;
          }
          break;
        }
      }

      // Update display
      if (gs.frameCount % 4 < dt) {
        setDisplayScore(gs.score);
        setSpeedTier(getSpeedTier(gs.speed));
      }

      // ── Draw ──────────────────────────────────────────────────────────────

      const shakeX =
        gs.screenShake > 0 ? (Math.random() - 0.5) * gs.screenShake * 0.4 : 0;
      const shakeY =
        gs.screenShake > 0 ? (Math.random() - 0.5) * gs.screenShake * 0.2 : 0;

      ctx.save();
      if (gs.screenShake > 0) {
        ctx.translate(shakeX, shakeY);
      }

      ctx.clearRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

      // Background
      drawBackground(
        ctx,
        CANVAS_W,
        CANVAS_H,
        gs.score,
        gs.starOffset,
        gs.clouds,
      );

      // Speed lines
      drawSpeedLines(ctx, gs.speedLines, gs.speed);

      // Ground
      drawGround(ctx, CANVAS_W, GROUND_Y, gs.bgOffset, gs.score);

      // Obstacles
      for (const o of gs.obstacles) {
        drawCactus(ctx, o);
      }

      // Particles
      drawParticles(ctx, gs.particles);

      // Dino
      drawDino(ctx, gs.dino, timestamp);

      // HUD - score
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffcc44";
      ctx.fillStyle = "#ffcc44";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "right";
      ctx.fillText(gs.score.toString(), CANVAS_W - 16, 32);
      ctx.shadowBlur = 0;

      // High score label
      if (highScore > 0) {
        ctx.fillStyle = "rgba(255,200,100,0.4)";
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`HI: ${highScore}`, CANVAS_W - 16, 50);
      }

      // Combo multiplier
      if (gs.comboMultiplier > 1.05) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ffff";
        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`×${gs.comboMultiplier.toFixed(1)} COMBO`, 12, 32);
        ctx.shadowBlur = 0;
      }

      // "1 UP LEFT!" message
      if (gs.showLifeLostText > 0) {
        const alpha = Math.min(gs.showLifeLostText / 30, 1);
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff4400";
        ctx.fillStyle = "#ff4400";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("1 UP LEFT!", CANVAS_W / 2, CANVAS_H / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [GROUND_Y, checkCollision, highScore],
  );

  const startGame = useCallback(() => {
    const gs = initGameState();
    gameStateRef.current = gs;
    setShowReward(false);
    setFinalScore(0);
    setDisplayScore(0);
    setGameStarted(false);
    setLives(2);
    setDoubleJumpAvailable(true);
    setIsNewHighScore(false);
    setSpeedTier({ label: "SLOW", color: "#00ff88" });
    isDuckingRef.current = false;
    lastTimeRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [initGameState, gameLoop]);

  useEffect(() => {
    startGame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, duck]);

  const reward = getReward(finalScore);

  const handleCopyCoupon = () => {
    if (reward) {
      navigator.clipboard.writeText(reward.coupon);
      toast.success("Coupon copied!", { description: reward.coupon });
    }
  };

  // Animate score count-up in reward screen
  useEffect(() => {
    if (!showReward || !finalScore) return;
    setAnimatedScore(0);
    let current = 0;
    const step = Math.ceil(finalScore / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, finalScore);
      setAnimatedScore(current);
      if (current >= finalScore) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [showReward, finalScore]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Lives + Stats HUD */}
      {gameStarted && !showReward && (
        <div className="flex items-center justify-between w-full max-w-[700px] px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-300">LIVES:</span>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <Heart
                  key={`life-${i}`}
                  className={`w-4 h-4 ${i < lives ? "text-red-500 fill-red-500" : "text-gray-600"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{
                color: speedTier.color,
                border: `1px solid ${speedTier.color}44`,
                background: `${speedTier.color}11`,
              }}
            >
              <Zap className="w-3 h-3" />
              {speedTier.label}
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
                doubleJumpAvailable
                  ? "text-cyan-400 border-cyan-400/40 bg-cyan-400/10"
                  : "text-gray-600 border-gray-700 bg-gray-800/30"
              }`}
            >
              ↑↑ DOUBLE JUMP {doubleJumpAvailable ? "READY" : "USED"}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!showReward && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full"
            style={{ maxWidth: CANVAS_W }}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                border: "1px solid rgba(150,80,255,0.4)",
                boxShadow:
                  "0 0 20px rgba(150,80,255,0.2), 0 0 40px rgba(150,80,255,0.1)",
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full h-auto cursor-pointer block"
                onClick={jump}
                onKeyDown={(e) => {
                  if (e.code === "Space" || e.code === "ArrowUp") {
                    e.preventDefault();
                    jump();
                  }
                  if (e.code === "ArrowDown") {
                    e.preventDefault();
                    duck(true);
                  }
                }}
                onKeyUp={(e) => {
                  if (e.code === "ArrowDown") {
                    e.preventDefault();
                    duck(false);
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  touchStartRef.current = Date.now();
                  jump();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  duck(false);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  // Hold touch = duck
                  if (Date.now() - touchStartRef.current > 200) {
                    duck(true);
                  }
                }}
                data-ocid="game.canvas_target"
                tabIndex={0}
                style={{ touchAction: "none" }}
              />
            </div>
          </motion.div>
        )}

        {/* Reward popup */}
        {showReward && (
          <motion.div
            key="reward"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,10,0.92)" }}
            data-ocid="game.reward.modal"
          >
            {/* Particle background effect for high scores */}
            {reward && finalScore >= 5000 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {CONFETTI_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      width: p.w,
                      height: p.h,
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      background: p.color,
                    }}
                    animate={{
                      y: [0, p.yDist],
                      opacity: [1, 0],
                      scale: [1, 0],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: p.repeatDelay,
                    }}
                  />
                ))}
              </div>
            )}

            <motion.div
              initial={{ scale: 0.7, y: 40, rotateX: -15 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #0a0025 0%, #150030 50%, #0a0020 100%)",
                border: "1px solid rgba(150,80,255,0.5)",
                boxShadow:
                  "0 0 40px rgba(150,80,255,0.3), 0 0 80px rgba(150,80,255,0.1)",
              }}
            >
              {/* Top glow bar */}
              <div
                className="h-1 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, #cc00ff, #ff6600, #cc00ff)",
                }}
              />

              <div className="p-8 text-center">
                {reward?.isFree ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.6, repeat: 3 }}
                    className="text-5xl mb-3"
                  >
                    🎉
                  </motion.div>
                ) : (
                  <Trophy
                    className="w-12 h-12 mx-auto mb-3"
                    style={{
                      color: "#ffcc44",
                      filter: "drop-shadow(0 0 8px #ffcc44)",
                    }}
                  />
                )}

                {isNewHighScore && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-2 text-xs font-mono font-bold tracking-widest"
                    style={{ color: "#00ffcc", textShadow: "0 0 10px #00ffcc" }}
                  >
                    ★ NEW HIGH SCORE! ★
                  </motion.div>
                )}

                <h3
                  className="text-3xl font-bold mb-1"
                  style={{
                    color: "#ffcc44",
                    textShadow: "0 0 15px #ffaa00",
                    fontFamily: "monospace",
                  }}
                >
                  {reward?.isFree ? "LEGENDARY!" : "GAME OVER"}
                </h3>

                <p
                  className="text-sm mb-4"
                  style={{ color: "rgba(200,160,255,0.7)" }}
                >
                  Your Score
                </p>

                {/* Animated score */}
                <motion.div
                  className="text-5xl font-bold mb-6 font-mono"
                  style={{ color: "#cc88ff", textShadow: "0 0 20px #cc88ff" }}
                >
                  {animatedScore.toLocaleString()}
                </motion.div>

                {reward ? (
                  <div
                    className="rounded-xl p-5 mb-5"
                    style={{
                      background: "rgba(150,80,255,0.1)",
                      border: "1px solid rgba(150,80,255,0.3)",
                    }}
                  >
                    <p
                      className="text-xs font-mono mb-1"
                      style={{ color: "rgba(200,160,255,0.6)" }}
                    >
                      YOUR REWARD
                    </p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-3xl font-bold font-mono mb-4"
                      style={{
                        color: "#ffcc44",
                        textShadow: "0 0 15px #ffaa00",
                      }}
                    >
                      {reward.text}
                    </motion.p>
                    <div
                      className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 mb-3"
                      style={{
                        background: "rgba(0,0,20,0.8)",
                        border: "1px dashed rgba(255,200,80,0.5)",
                      }}
                    >
                      <code
                        className="text-xl font-bold font-mono tracking-widest"
                        style={{ color: "#ffcc44" }}
                      >
                        {reward.coupon}
                      </code>
                    </div>
                    <Button
                      onClick={handleCopyCoupon}
                      className="w-full font-bold font-mono"
                      style={{
                        background: "linear-gradient(90deg, #cc00ff, #ff6600)",
                        border: "none",
                      }}
                      data-ocid="game.copy_coupon.button"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      COPY COUPON CODE
                    </Button>
                    {reward.isFree && (
                      <p className="text-sm mt-3" style={{ color: "#00ffcc" }}>
                        🎉 You won a FREE ALVRA perfume! Use code{" "}
                        <strong>FREEALVRA</strong> at checkout.
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{
                      background: "rgba(255,100,0,0.1)",
                      border: "1px solid rgba(255,100,0,0.3)",
                    }}
                  >
                    <p
                      className="text-sm font-mono"
                      style={{ color: "rgba(255,180,100,0.8)" }}
                    >
                      Score 500+ to unlock rewards!
                    </p>
                    <p
                      className="text-xs mt-2 font-mono"
                      style={{ color: "rgba(200,160,255,0.6)" }}
                    >
                      500 → ₹20 OFF • 1000 → ₹50 OFF • 3000 → ₹150 OFF
                    </p>
                  </div>
                )}

                <Button
                  onClick={startGame}
                  variant="outline"
                  className="w-full font-bold font-mono"
                  style={{
                    borderColor: "rgba(150,80,255,0.5)",
                    color: "#cc88ff",
                  }}
                  data-ocid="game.play_again.button"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  PLAY AGAIN
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls legend */}
      {!showReward && (
        <div
          className="flex flex-wrap gap-3 justify-center text-xs font-mono"
          style={{ color: "rgba(180,130,255,0.7)" }}
        >
          <span>⬆ SPACE = Jump</span>
          <span>⬇ DOWN = Duck</span>
          <span>↑↑ Double-tap = Double Jump</span>
          <span className="text-purple-400">
            📱 Mobile: Tap = Jump • Hold = Duck
          </span>
        </div>
      )}

      {/* Reward tiers */}
      {!showReward && (
        <div className="grid grid-cols-3 gap-2 w-full max-w-lg text-center text-xs">
          {[
            { score: "500+", reward: "₹20 OFF" },
            { score: "1000+", reward: "₹50 OFF" },
            { score: "2000+", reward: "₹100 OFF" },
            { score: "3000+", reward: "₹150 OFF" },
            { score: "5000+", reward: "₹200 OFF" },
            { score: "10000+", reward: "FREE 🎉" },
          ].map((tier) => (
            <div
              key={tier.score}
              className="rounded-lg px-2 py-2"
              style={{
                background: "rgba(150,80,255,0.08)",
                border: "1px solid rgba(150,80,255,0.2)",
              }}
            >
              <div className="font-bold font-mono" style={{ color: "#ffcc44" }}>
                {tier.score}
              </div>
              <div style={{ color: "rgba(200,160,255,0.7)" }}>
                {tier.reward}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Game Modal ────────────────────────────────────────────────────────────────
export function DinoGameModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="font-bold text-lg px-8 py-6 transition-all hover:scale-105"
        style={{
          background: "linear-gradient(90deg, #cc00ff, #ff6600)",
          border: "none",
          color: "white",
          boxShadow: "0 0 20px rgba(200,0,255,0.4)",
          fontFamily: "monospace",
        }}
        data-ocid="game.play_button"
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        PLAY GAME
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,10,0.97)" }}
            data-ocid="game.modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl overflow-y-auto rounded-2xl"
              style={{
                maxHeight: "95vh",
                background: "linear-gradient(135deg, #050015 0%, #0a0025 100%)",
                border: "1px solid rgba(150,80,255,0.4)",
                boxShadow: "0 0 60px rgba(150,80,255,0.2)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h2
                    className="text-2xl font-bold font-mono"
                    style={{
                      color: "#cc88ff",
                      textShadow: "0 0 10px rgba(200,100,255,0.5)",
                    }}
                  >
                    🎮 DINO CHALLENGE
                  </h2>
                  <p
                    className="text-sm font-mono mt-0.5"
                    style={{ color: "rgba(180,130,255,0.6)" }}
                  >
                    Jump over obstacles • Win real discounts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg transition-all"
                  style={{ color: "rgba(180,130,255,0.7)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#cc88ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(180,130,255,0.7)";
                  }}
                  data-ocid="game.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <DinoGame />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
