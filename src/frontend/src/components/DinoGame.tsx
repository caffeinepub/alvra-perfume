import { Button } from "@/components/ui/button";
import { Copy, Gamepad2, Heart, RotateCcw, Trophy, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Leaderboard utility ─────────────────────────────────────────────────────
export function saveToLeaderboard(name: string, score: number) {
  try {
    const existing: { name: string; score: number; date: string }[] =
      JSON.parse(localStorage.getItem("alvra_leaderboard") || "[]");
    existing.push({
      name: name.trim() || "Anonymous",
      score,
      date: new Date().toLocaleDateString(),
    });
    existing.sort((a, b) => b.score - a.score);
    const top10 = existing.slice(0, 10);
    localStorage.setItem("alvra_leaderboard", JSON.stringify(top10));
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dino {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isOnGround: boolean;
  isDucking: boolean;
  jumpCount: number;
  legFrame: number;
  invincible: number;
  flashTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "perfume" | "coin" | "double_perfume" | "fast_coin";
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
  showLifeLostText: number;
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

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137 + starOffset * 0.3) % (canvasW + 20)) - 10;
    const sy = (i * 73) % (canvasH * 0.6);
    const size = i % 3 === 0 ? 1.5 : 1;
    ctx.fillRect(sx, sy, size, size);
  }

  ctx.fillStyle = "rgba(200, 180, 255, 0.5)";
  for (let i = 0; i < 25; i++) {
    const sx = ((i * 211 + starOffset * 0.7) % (canvasW + 20)) - 10;
    const sy = (i * 53 + 15) % (canvasH * 0.55);
    ctx.fillRect(sx, sy, 1, 1);
  }

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

  ctx.fillStyle = `${glowColor}33`;
  for (let i = 0; i < 12; i++) {
    const rx = ((i * 160 - bgOffset * 0.5) % (canvasW + 40)) - 20;
    ctx.fillRect(rx, groundY + 4, 6, 2);
    ctx.fillRect(rx + 25, groundY + 2, 4, 1);
  }
}

// ─── Elegant Runner Character (ALVRA brand person) ────────────────────────────
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

  // Glow aura
  if (dino.invincible > 0) {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#00ffff";
  } else {
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#0d9488";
  }

  if (dino.isDucking) {
    // ── Crouching pose ──────────────────────────────────────────────────────
    // Body / coat crouched
    ctx.fillStyle = "#0d9488";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.15, y + h * 0.35, w * 0.65, h * 0.55, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = "#f5c5a3";
    ctx.beginPath();
    ctx.arc(x + w * 0.62, y + h * 0.22, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Hair bun
    ctx.fillStyle = "#4a2c0a";
    ctx.beginPath();
    ctx.arc(x + w * 0.62, y + h * 0.06, w * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(x + w * 0.71, y + h * 0.2, w * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Arm holding perfume bottle
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#0d9488";
    ctx.fillStyle = "#0a7a70";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.75, y + h * 0.38, w * 0.18, h * 0.32, 3);
    ctx.fill();

    // Mini perfume bottle in hand
    ctx.fillStyle = "#d4a017";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.88, y + h * 0.3, w * 0.12, h * 0.08, 2);
    ctx.fill();
    ctx.fillStyle = "#6b21a8";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.85, y + h * 0.37, w * 0.16, h * 0.28, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.87, y + h * 0.4, w * 0.05, h * 0.1, 1);
    ctx.fill();

    // Legs crouched
    ctx.fillStyle = "#0a5c53";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.2, y + h * 0.78, w * 0.2, h * 0.22, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w * 0.5, y + h * 0.78, w * 0.2, h * 0.22, 3);
    ctx.fill();
    // Shoes
    ctx.fillStyle = "#d4a017";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.14, y + h * 0.92, w * 0.3, h * 0.1, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w * 0.44, y + h * 0.92, w * 0.3, h * 0.1, 2);
    ctx.fill();
  } else {
    // ── Standing / running pose ──────────────────────────────────────────────
    // Legs (animated 4-frame)
    const legOffsets = [
      [0, h * 0.13],
      [h * 0.09, h * 0.04],
      [h * 0.13, 0],
      [h * 0.04, h * 0.09],
    ];
    const [l1, l2] = legOffsets[frame];

    // Legs
    ctx.fillStyle = "#0a5c53";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.2, y + h * 0.72, w * 0.2, h * 0.22 + l1, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w * 0.5, y + h * 0.72, w * 0.2, h * 0.22 + l2, 3);
    ctx.fill();
    // Shoes
    ctx.fillStyle = "#d4a017";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.12, y + h + l1 - h * 0.05, w * 0.32, h * 0.08, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w * 0.42, y + h + l2 - h * 0.05, w * 0.32, h * 0.08, 2);
    ctx.fill();

    // Coat/body
    ctx.fillStyle = "#0d9488";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.1, y + h * 0.28, w * 0.68, h * 0.5, 5);
    ctx.fill();

    // Coat lapels
    ctx.fillStyle = "#0a7a70";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y + h * 0.28);
    ctx.lineTo(x + w * 0.48, y + h * 0.52);
    ctx.lineTo(x + w * 0.25, y + h * 0.52);
    ctx.closePath();
    ctx.fill();

    // Gold button row
    ctx.fillStyle = "#d4a017";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        x + w * 0.44,
        y + h * (0.35 + i * 0.11),
        w * 0.04,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Back arm
    ctx.fillStyle = "#0a6b62";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.06, y + h * 0.3, w * 0.16, h * 0.35, 3);
    ctx.fill();

    // Neck
    ctx.fillStyle = "#f5c5a3";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.38, y + h * 0.18, w * 0.16, h * 0.14, 3);
    ctx.fill();

    // Head
    ctx.fillStyle = "#f5c5a3";
    ctx.beginPath();
    ctx.arc(x + w * 0.48, y + h * 0.12, w * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Hair bun
    ctx.fillStyle = "#4a2c0a";
    ctx.beginPath();
    ctx.arc(x + w * 0.48, y - h * 0.03, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    // Hair strand
    ctx.beginPath();
    ctx.arc(x + w * 0.65, y + h * 0.04, w * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(x + w * 0.57, y + h * 0.1, w * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + w * 0.555, y + h * 0.09, w * 0.022, 0, Math.PI * 2);
    ctx.fill();

    // Front arm holding perfume
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#0d9488";
    ctx.fillStyle = "#0d9488";
    // Arm angled forward
    const armY = frame < 2 ? y + h * 0.3 : y + h * 0.34;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.72, armY, w * 0.18, h * 0.32, 3);
    ctx.fill();
    // Hand
    ctx.fillStyle = "#f5c5a3";
    ctx.beginPath();
    ctx.arc(x + w * 0.82, armY + h * 0.32, w * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Perfume bottle in hand
    const bottleX = x + w * 0.88;
    const bottleY = armY + h * 0.18;
    // Cap
    ctx.fillStyle = "#d4a017";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#d4a017";
    ctx.beginPath();
    ctx.roundRect(bottleX, bottleY, w * 0.14, h * 0.06, 2);
    ctx.fill();
    // Neck
    ctx.fillStyle = "#9333ea";
    ctx.beginPath();
    ctx.roundRect(
      bottleX + w * 0.04,
      bottleY + h * 0.06,
      w * 0.06,
      h * 0.06,
      1,
    );
    ctx.fill();
    // Bottle body
    ctx.fillStyle = "#6b21a8";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#c084fc";
    ctx.beginPath();
    ctx.roundRect(bottleX, bottleY + h * 0.12, w * 0.14, h * 0.22, 3);
    ctx.fill();
    // Label
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.roundRect(bottleX + w * 0.02, bottleY + h * 0.16, w * 0.1, h * 0.1, 1);
    ctx.fill();
    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.roundRect(
      bottleX + w * 0.02,
      bottleY + h * 0.13,
      w * 0.03,
      h * 0.08,
      1,
    );
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// ─── Obstacle drawing ─────────────────────────────────────────────────────────
function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const { x, y, width: w, height: h, type } = obs;

  if (type === "coin") {
    // Flying gold coin (like a bird) at different heights
    const spinFrame = Math.floor(Date.now() / 100) % 4;
    const scaleX = [1, 0.6, 0.15, 0.6][spinFrame];
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#fbbf24";

    // Coin body (ellipse to simulate spin)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.5,
      y + h * 0.5,
      w * 0.45 * scaleX,
      h * 0.45,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (scaleX > 0.4) {
      // Gold rim
      ctx.strokeStyle = "#d4a017";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        x + w * 0.5,
        y + h * 0.5,
        w * 0.45 * scaleX,
        h * 0.45,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      // ₹ symbol
      ctx.fillStyle = "#7c3f00";
      ctx.font = `bold ${Math.round(h * 0.45)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₹", x + w * 0.5, y + h * 0.52);
      ctx.textBaseline = "alphabetic";

      // Shine streak
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(
        x + w * 0.35,
        y + h * 0.3,
        w * 0.12 * scaleX,
        h * 0.1,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    return;
  }

  if (type === "fast_coin") {
    // Fast spinning small gold coin
    const spinFrame = Math.floor(Date.now() / 70) % 4;
    const scaleX = [1, 0.5, 0.08, 0.5][spinFrame];
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#fbbf24";

    // Outer ring
    ctx.strokeStyle = "#d4a017";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.5,
      y + h * 0.5,
      w * 0.45 * scaleX,
      h * 0.45,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // Coin body
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(
      x + w * 0.5,
      y + h * 0.5,
      w * 0.4 * scaleX,
      h * 0.4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (scaleX > 0.3) {
      ctx.fillStyle = "#92400e";
      ctx.font = `bold ${Math.round(h * 0.4)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₹", x + w * 0.5, y + h * 0.52);
      ctx.textBaseline = "alphabetic";

      // Speed streaks
      ctx.strokeStyle = "rgba(251,191,36,0.5)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + w + 4 + i * 8, y + h * (0.3 + i * 0.15));
        ctx.lineTo(x + w + 18 + i * 8, y + h * (0.3 + i * 0.15));
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    return;
  }

  // ── Perfume bottle ─────────────────────────────────────────────────────────
  const drawPerfumeBottle = (
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ) => {
    // Cap (gold)
    ctx.fillStyle = "#d4a017";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#d4a017";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.15, by, bw * 0.7, bh * 0.1, 2);
    ctx.fill();

    // Sprayer nozzle
    ctx.fillStyle = "#b8860b";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.6, by - bh * 0.06, bw * 0.25, bh * 0.1, 2);
    ctx.fill();
    // Nozzle tip
    ctx.fillStyle = "#d4a017";
    ctx.beginPath();
    ctx.arc(bx + bw * 0.88, by - bh * 0.02, bw * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = "#9333ea";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.3, by + bh * 0.1, bw * 0.4, bh * 0.1, 2);
    ctx.fill();

    // Bottle body
    ctx.fillStyle = "#6b21a8";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#c084fc";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.08, by + bh * 0.2, bw * 0.84, bh * 0.78, 6);
    ctx.fill();

    // Label area
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.18, by + bh * 0.35, bw * 0.64, bh * 0.35, 4);
    ctx.fill();

    // Label text "A"
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `bold ${Math.round(bw * 0.4)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", bx + bw * 0.5, by + bh * 0.53);
    ctx.textBaseline = "alphabetic";

    // Shine streak
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.12, by + bh * 0.22, bw * 0.12, bh * 0.5, 3);
    ctx.fill();

    // Base highlight
    ctx.fillStyle = "rgba(212,160,23,0.4)";
    ctx.beginPath();
    ctx.roundRect(bx + bw * 0.15, by + bh * 0.9, bw * 0.7, bh * 0.08, 2);
    ctx.fill();
  };

  if (type === "perfume") {
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#c084fc";
    drawPerfumeBottle(x, y, w, h);
  } else if (type === "double_perfume") {
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#c084fc";
    drawPerfumeBottle(x, y, w, h);
    const h2 = h * 0.78;
    const y2 = y + h - h2;
    drawPerfumeBottle(x + w + 10, y2, w, h2);
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

// Precomputed confetti particle data
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
      speed: 11,
      gameOver: false,
      started: false,
      frameCount: 0,
      nextObstacleIn: 50 + Math.random() * 30,
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
      gs.dino.velocityY = DOUBLE_JUMP_FORCE;
      gs.dino.jumpCount = 2;
      gs.doubleJumpAvailable = false;
      setDoubleJumpAvailable(false);
      spawnParticles(gs, gs.dino.x + DINO_W / 2, gs.dino.y + DINO_H, 8, "dust");
    }
  }, []);

  const duck = useCallback(
    (isDucking: boolean) => {
      const gs = gameStateRef.current;
      if (!gs || !gs.started || gs.gameOver) return;
      isDuckingRef.current = isDucking;

      if (isDucking && !gs.dino.isDucking && !gs.dino.isOnGround) {
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

    const obsWidth =
      obs.type === "double_perfume" ? obs.width * 2 + 10 : obs.width;
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

      // Score (harder: fewer points per frame)
      const scoreGain = Math.ceil(gs.speed * dt * 0.035 * gs.comboMultiplier);
      gs.score += scoreGain;

      // Speed increase (starts faster, slower ramp)
      gs.speed = 11 + gs.score * 0.007;
      if (gs.speed > 38) gs.speed = 38;

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
          spawnParticles(gs, gs.dino.x + DINO_W / 2, GROUND_Y, 6, "dust");
          gs.doubleJumpAvailable = true;
          setDoubleJumpAvailable(true);
        }
      }

      if (gs.dino.invincible > 0) gs.dino.invincible -= dt;
      if (gs.dino.flashTimer > 0) gs.dino.flashTimer -= dt;
      if (gs.showLifeLostText > 0) gs.showLifeLostText -= dt;
      if (gs.screenShake > 0) gs.screenShake -= dt;

      gs.bgOffset += gs.speed * dt;
      gs.starOffset += gs.speed * dt;

      for (const cloud of gs.clouds) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x < -cloud.w * 2) {
          cloud.x = CANVAS_W + cloud.w;
          cloud.y = 20 + Math.random() * 80;
        }
      }

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
        // More frequent obstacles
        const minGap = Math.max(12, 40 - gs.score / 60);
        gs.nextObstacleIn = minGap + Math.random() * 28;

        const roll = Math.random();
        if (gs.score > 600 && roll < 0.22) {
          // Fast coin
          const cH = 28 + Math.random() * 12;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 28,
            height: cH,
            type: "fast_coin",
            speedMultiplier: 1.8,
          });
        } else if (gs.score > 400 && roll < 0.4) {
          // Double perfume bottles
          const cH = 40 + Math.random() * 20;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 28,
            height: cH,
            type: "double_perfume",
            speedMultiplier: 1,
          });
        } else if (gs.score > 200 && roll < 0.55) {
          // Flying coin at varying heights
          const birdRoll = Math.random();
          let coinY: number;
          if (birdRoll < 0.33) {
            coinY = GROUND_Y - 90;
          } else if (birdRoll < 0.66) {
            coinY = GROUND_Y - 145;
          } else {
            coinY = GROUND_Y - 200;
          }
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: coinY,
            width: 40,
            height: 40,
            type: "coin",
            speedMultiplier: 1.1,
          });
        } else {
          // Normal perfume bottle
          const cH = 40 + Math.random() * 35;
          gs.obstacles.push({
            x: CANVAS_W + 20,
            y: GROUND_Y - cH,
            width: 28,
            height: cH,
            type: "perfume",
            speedMultiplier: 1,
          });
        }
      }

      gs.obstacles = gs.obstacles
        .map((o) => ({ ...o, x: o.x - gs.speed * o.speedMultiplier * dt }))
        .filter((o) => o.x > -80);

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
            gs.dino.invincible = 80;
            gs.dino.flashTimer = 80;
            gs.showLifeLostText = 90;
            setLives(gs.lives);
            obs.x = -200;
          } else {
            gs.gameOver = true;
            setFinalScore(gs.score);
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
            // Leaderboard prompt
            try {
              const board: { name: string; score: number }[] = JSON.parse(
                localStorage.getItem("alvra_leaderboard") || "[]",
              );
              const finalScoreVal = gs.score;
              if (
                board.length < 10 ||
                finalScoreVal > (board[board.length - 1]?.score ?? 0)
              ) {
                setTimeout(() => {
                  const playerName = window.prompt(
                    "🏆 You made the leaderboard! Enter your name:",
                    "Player",
                  );
                  if (playerName !== null) {
                    saveToLeaderboard(playerName, finalScoreVal);
                  }
                }, 400);
              }
            } catch {}
            return;
          }
          break;
        }
      }

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

      drawBackground(
        ctx,
        CANVAS_W,
        CANVAS_H,
        gs.score,
        gs.starOffset,
        gs.clouds,
      );
      drawSpeedLines(ctx, gs.speedLines, gs.speed);
      drawGround(ctx, CANVAS_W, GROUND_Y, gs.bgOffset, gs.score);

      for (const o of gs.obstacles) {
        drawObstacle(ctx, o);
      }

      drawParticles(ctx, gs.particles);
      drawDino(ctx, gs.dino, timestamp);

      // HUD score
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffcc44";
      ctx.fillStyle = "#ffcc44";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "right";
      ctx.fillText(gs.score.toString(), CANVAS_W - 16, 32);
      ctx.shadowBlur = 0;

      if (highScore > 0) {
        ctx.fillStyle = "rgba(255,200,100,0.4)";
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`HI: ${highScore}`, CANVAS_W - 16, 50);
      }

      if (gs.comboMultiplier > 1.05) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ffff";
        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`×${gs.comboMultiplier.toFixed(1)} COMBO`, 12, 32);
        ctx.shadowBlur = 0;
      }

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
    // Use setTimeout to ensure React has committed state updates before starting the loop
    setTimeout(() => {
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(gameLoop);
    }, 0);
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

      <div className="relative w-full" style={{ maxWidth: CANVAS_W }}>
        <div className="relative w-full">
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
                if (Date.now() - touchStartRef.current > 200) {
                  duck(true);
                }
              }}
              data-ocid="game.canvas_target"
              tabIndex={0}
              style={{ touchAction: "none" }}
            />
          </div>
        </div>
      </div>

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
            <div
              className="h-1 w-full"
              style={{
                background: "linear-gradient(90deg, #0d9488, #d4a017, #0d9488)",
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
                    color: "#d4a017",
                    filter: "drop-shadow(0 0 8px #d4a017)",
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
                  color: "#d4a017",
                  textShadow: "0 0 15px #d4a017",
                  fontFamily: "monospace",
                }}
              >
                {reward?.isFree ? "LEGENDARY!" : "ALVRA RUNNER"}
              </h3>

              <p
                className="text-sm mb-4"
                style={{ color: "rgba(200,160,255,0.7)" }}
              >
                Your Score
              </p>

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
                      color: "#d4a017",
                      textShadow: "0 0 15px #d4a017",
                    }}
                  >
                    {reward.text}
                  </motion.p>
                  <div
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 mb-3"
                    style={{
                      background: "rgba(0,0,20,0.8)",
                      border: "1px dashed rgba(212,160,23,0.5)",
                    }}
                  >
                    <code
                      className="text-xl font-bold font-mono tracking-widest"
                      style={{ color: "#d4a017" }}
                    >
                      {reward.coupon}
                    </code>
                  </div>
                  <Button
                    onClick={handleCopyCoupon}
                    className="w-full font-bold font-mono"
                    style={{
                      background: "linear-gradient(90deg, #0d9488, #d4a017)",
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
                  borderColor: "rgba(13,148,136,0.5)",
                  color: "#0d9488",
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
                background: "rgba(13,148,136,0.08)",
                border: "1px solid rgba(13,148,136,0.2)",
              }}
            >
              <div className="font-bold font-mono" style={{ color: "#d4a017" }}>
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
          background: "linear-gradient(90deg, #0d9488, #d4a017)",
          border: "none",
          color: "white",
          boxShadow: "0 0 20px rgba(13,148,136,0.4)",
          fontFamily: "monospace",
        }}
        data-ocid="game.play_button"
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        PLAY ALVRA RUNNER
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,10,0.95)" }}
            data-ocid="game.modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
              style={{
                background: "#050015",
                border: "1px solid rgba(13,148,136,0.4)",
                boxShadow: "0 0 60px rgba(13,148,136,0.2)",
              }}
            >
              <div
                className="h-1 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, #0d9488, #d4a017, #0d9488)",
                }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-2xl font-bold font-mono"
                    style={{
                      color: "#0d9488",
                      textShadow: "0 0 15px #0d9488",
                    }}
                  >
                    🏃 ALVRA RUNNER
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    style={{ color: "rgba(200,160,255,0.6)" }}
                    data-ocid="game.close_button"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <DinoGame />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
