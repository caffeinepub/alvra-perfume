import { Button } from "@/components/ui/button";
import { Copy, Gamepad2, RotateCcw, Trophy, X } from "lucide-react";
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
}

interface Cactus {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GameState {
  dino: Dino;
  cacti: Cactus[];
  score: number;
  speed: number;
  gameOver: boolean;
  started: boolean;
  frameCount: number;
  nextCactusIn: number;
  groundY: number;
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

// ─── Canvas drawing helpers ───────────────────────────────────────────────────
function drawDino(ctx: CanvasRenderingContext2D, dino: Dino) {
  const x = dino.x;
  const y = dino.y;
  const w = dino.width;
  const h = dino.height;

  // Body
  ctx.fillStyle = "#d4a017";
  ctx.fillRect(x, y + h * 0.2, w * 0.7, h * 0.7);

  // Head
  ctx.fillRect(x + w * 0.3, y, w * 0.5, h * 0.45);

  // Eye
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(x + w * 0.62, y + h * 0.08, w * 0.1, h * 0.1);

  // Mouth / beak
  ctx.fillStyle = "#d4a017";
  ctx.fillRect(x + w * 0.75, y + h * 0.22, w * 0.25, h * 0.1);

  // Legs (alternating)
  ctx.fillStyle = "#b8860b";
  const legOffset = Math.floor(Date.now() / 100) % 2 === 0 ? 0 : h * 0.1;
  ctx.fillRect(x + w * 0.1, y + h * 0.85, w * 0.18, h * 0.15 + legOffset);
  ctx.fillRect(x + w * 0.38, y + h * 0.85, w * 0.18, h * 0.15 - legOffset);

  // Tail
  ctx.fillStyle = "#d4a017";
  ctx.fillRect(x - w * 0.2, y + h * 0.3, w * 0.25, h * 0.25);
}

function drawCactus(ctx: CanvasRenderingContext2D, cactus: Cactus) {
  const x = cactus.x;
  const y = cactus.y;
  const w = cactus.width;
  const h = cactus.height;

  ctx.fillStyle = "#2a7a3b";
  // Main stem
  ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
  // Left arm
  ctx.fillRect(x, y + h * 0.25, w * 0.38, h * 0.18);
  ctx.fillRect(x, y + h * 0.08, w * 0.15, h * 0.22);
  // Right arm
  ctx.fillRect(x + w * 0.62, y + h * 0.35, w * 0.38, h * 0.18);
  ctx.fillRect(x + w * 0.85, y + h * 0.18, w * 0.15, h * 0.22);
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  groundY: number,
  offset: number,
) {
  ctx.strokeStyle = "#3a3020";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvasW, groundY);
  ctx.stroke();

  // Rocks/detail
  ctx.fillStyle = "#2a2010";
  for (let i = 0; i < 8; i++) {
    const rx = ((i * 180 - offset * 0.5) % (canvasW + 40)) - 20;
    ctx.fillRect(rx, groundY + 4, 8, 3);
    ctx.fillRect(rx + 30, groundY + 2, 5, 2);
  }
}

// ─── DinoGame Component ───────────────────────────────────────────────────────
export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [showReward, setShowReward] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const CANVAS_W = 700;
  const CANVAS_H = 280;
  const GROUND_Y = CANVAS_H - 60;
  const DINO_W = 44;
  const DINO_H = 52;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -13;

  const initGameState = useCallback(
    (): GameState => ({
      dino: {
        x: 80,
        y: GROUND_Y - DINO_H,
        width: DINO_W,
        height: DINO_H,
        velocityY: 0,
        isOnGround: true,
      },
      cacti: [],
      score: 0,
      speed: 5,
      gameOver: false,
      started: false,
      frameCount: 0,
      nextCactusIn: 80,
      groundY: GROUND_Y,
    }),
    [GROUND_Y],
  );

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs) return;
    if (!gs.started) {
      gs.started = true;
      setGameStarted(true);
    }
    if (gs.dino.isOnGround && !gs.gameOver) {
      gs.dino.velocityY = JUMP_FORCE;
      gs.dino.isOnGround = false;
    }
  }, []);

  const checkCollision = useCallback((dino: Dino, cactus: Cactus): boolean => {
    const margin = 6;
    return (
      dino.x + margin < cactus.x + cactus.width - margin &&
      dino.x + dino.width - margin > cactus.x + margin &&
      dino.y + margin < cactus.y + cactus.height - margin &&
      dino.y + dino.height - margin > cactus.y + margin
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
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawGround(ctx, CANVAS_W, GROUND_Y, 0);
        drawDino(ctx, gs.dino);
        ctx.fillStyle = "rgba(212, 160, 23, 0.6)";
        ctx.font = "bold 18px 'Cabinet Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Press SPACE or TAP to start",
          CANVAS_W / 2,
          CANVAS_H / 2 - 20,
        );
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Update score
      gs.score += Math.ceil(gs.speed * dt * 0.25);

      // Speed increase
      gs.speed = 5 + gs.score * 0.003;
      if (gs.speed > 18) gs.speed = 18;

      // Update dino physics
      gs.dino.velocityY += GRAVITY * dt;
      gs.dino.y += gs.dino.velocityY * dt;

      if (gs.dino.y >= GROUND_Y - DINO_H) {
        gs.dino.y = GROUND_Y - DINO_H;
        gs.dino.velocityY = 0;
        gs.dino.isOnGround = true;
      }

      // Spawn cacti
      gs.frameCount += dt;
      gs.nextCactusIn -= dt;
      if (gs.nextCactusIn <= 0) {
        const cH = 40 + Math.random() * 30;
        gs.cacti.push({
          x: CANVAS_W + 20,
          y: GROUND_Y - cH,
          width: 28,
          height: cH,
        });
        gs.nextCactusIn = 55 + Math.random() * 60;
      }

      // Update cacti
      gs.cacti = gs.cacti
        .map((c) => ({ ...c, x: c.x - gs.speed * dt }))
        .filter((c) => c.x > -60);

      // Collision detection
      for (const cactus of gs.cacti) {
        if (checkCollision(gs.dino, cactus)) {
          gs.gameOver = true;
          setFinalScore(gs.score);
          setShowReward(true);
          return;
        }
      }

      // Update display score (throttled)
      if (gs.frameCount % 3 < dt) {
        setDisplayScore(gs.score);
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars / particles in background
      ctx.fillStyle = "rgba(212, 160, 23, 0.15)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + gs.score * 0.1) % CANVAS_W;
        const sy = (i * 43) % (GROUND_Y - 20);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      drawGround(ctx, CANVAS_W, GROUND_Y, gs.score);
      for (const c of gs.cacti) {
        drawCactus(ctx, c);
      }
      drawDino(ctx, gs.dino);

      // Score display
      ctx.fillStyle = "rgba(212, 160, 23, 0.8)";
      ctx.font = "bold 20px 'Cabinet Grotesk', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${gs.score}`, CANVAS_W - 16, 32);

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [GROUND_Y, checkCollision],
  );

  const startGame = useCallback(() => {
    const gs = initGameState();
    gameStateRef.current = gs;
    setShowReward(false);
    setFinalScore(0);
    setDisplayScore(0);
    setGameStarted(false);
    lastTimeRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [initGameState, gameLoop]);

  useEffect(() => {
    startGame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [startGame]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  const reward = getReward(finalScore);

  const handleCopyCoupon = () => {
    if (reward) {
      navigator.clipboard.writeText(reward.coupon);
      toast.success("Coupon copied!", { description: reward.coupon });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Canvas Area */}
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
            <div className="relative border border-gold-dim rounded-lg overflow-hidden gold-glow-box">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full h-auto cursor-pointer block"
                onClick={jump}
                onKeyDown={(e) => {
                  if (e.code === "Space" || e.code === "Enter") {
                    e.preventDefault();
                    jump();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  jump();
                }}
                data-ocid="game.canvas_target"
                tabIndex={0}
                style={{ touchAction: "none" }}
              />
              {/* Score overlay */}
              <div className="absolute top-3 left-3 text-gold text-sm font-bold font-sans">
                {gameStarted ? `Score: ${displayScore}` : ""}
              </div>
            </div>
            <p className="text-center text-muted-foreground text-sm mt-2">
              {gameStarted
                ? "SPACE / TAP to jump"
                : "Press SPACE or TAP to start"}
            </p>
          </motion.div>
        )}

        {/* Reward popup */}
        {showReward && (
          <motion.div
            key="reward"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full max-w-md mx-auto"
            data-ocid="game.reward.modal"
          >
            <div className="bg-obsidian-2 border border-gold-dim rounded-2xl p-8 text-center gold-glow-box">
              {reward?.isFree ? (
                <div className="text-5xl mb-3">🎉</div>
              ) : (
                <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
              )}

              <h3 className="font-display text-2xl font-bold text-gold mb-1">
                {reward?.isFree ? "INCREDIBLE!" : "Game Over!"}
              </h3>

              <p className="text-muted-foreground mb-4">
                Your Score:{" "}
                <span className="text-gold-bright font-bold text-xl">
                  {finalScore.toLocaleString()}
                </span>
              </p>

              {reward ? (
                <>
                  <div className="bg-obsidian border border-gold rounded-xl p-4 mb-5">
                    <p className="text-sm text-muted-foreground mb-1">
                      Your Reward
                    </p>
                    <p className="font-display text-2xl text-gold font-bold mb-3">
                      {reward.text}
                    </p>
                    <div className="flex items-center justify-center gap-2 bg-obsidian-3 rounded-lg px-4 py-2 mb-3">
                      <code className="text-gold-bright font-bold tracking-widest text-lg">
                        {reward.coupon}
                      </code>
                    </div>
                    <Button
                      onClick={handleCopyCoupon}
                      className="w-full bg-gold text-obsidian font-bold hover:bg-gold-bright transition-colors"
                      data-ocid="game.copy_coupon.button"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Coupon
                    </Button>
                  </div>
                  {reward.isFree && (
                    <p className="text-sm text-gold mb-4">
                      🎉 You won a FREE ALVRA perfume! Use code{" "}
                      <strong>FREEALVRA</strong> at checkout.
                    </p>
                  )}
                </>
              ) : (
                <div className="bg-obsidian border border-border rounded-xl p-4 mb-5">
                  <p className="text-muted-foreground">
                    Score 500+ to unlock rewards!
                  </p>
                  <div className="mt-2 text-sm text-gold">
                    500 pts → ₹20 OFF | 1000 pts → ₹50 OFF | 3000 pts → ₹150 OFF
                  </div>
                </div>
              )}

              <Button
                onClick={startGame}
                variant="outline"
                className="w-full border-gold-dim text-gold hover:bg-gold hover:text-obsidian transition-all"
                data-ocid="game.play_again.button"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!showReward && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg text-center text-xs text-muted-foreground">
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
              className="bg-obsidian-2 border border-border rounded-lg px-2 py-2"
            >
              <div className="text-gold font-bold">{tier.score}</div>
              <div>{tier.reward}</div>
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
        className="bg-gold text-obsidian font-bold text-lg px-8 py-6 hover:bg-gold-bright transition-all hover:scale-105 animate-pulse-gold"
        data-ocid="game.play_button"
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        Play Game
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            data-ocid="game.modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl bg-obsidian border border-gold-dim rounded-2xl p-6 overflow-y-auto"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-gold">
                    🎮 DINO CHALLENGE
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Jump over cacti & win discounts!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-gold transition-colors p-2 rounded-lg hover:bg-obsidian-3"
                  data-ocid="game.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <DinoGame />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
