"use client";

import { useEffect, useRef } from "react";

// Characters pulled from threat-relevant symbol sets:
// hex digits, binary, network operators, bracketed threat tokens
const GLYPHS =
  "0123456789ABCDEFabcdef><[]{}|/\\.:;#@!?%^&*01" +
  "ÆÇÈÉÊÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñ" +
  "░▒▓█▀▄■□▪▫▬▭▮▯◆◇○●◎◉◈◍◌◊◘◙◚◛";

const CHAR_LIST = Array.from(GLYPHS);

const BRIGHT_CYAN = "rgba(34,211,238,";
const DIM_CYAN = "rgba(20,140,160,";
const VIOLET = "rgba(139,92,246,";
const EMERALD = "rgba(16,185,129,";

// Each column has an occasional color override (most are cyan)
const COLOR_CHANCE_VIOLET = 0.06;
const COLOR_CHANCE_EMERALD = 0.04;

function randomGlyph() {
  return CHAR_LIST[Math.floor(Math.random() * CHAR_LIST.length)];
}

interface Column {
  x: number;
  y: number;         // current head y in px
  speed: number;     // px per frame
  len: number;       // trail length in cells
  chars: string[];   // one char per cell in trail
  colorBase: string; // BRIGHT_CYAN | VIOLET | EMERALD
  ticker: number;    // frames since last char change
  tickRate: number;  // how many frames between char scrambles
}

export function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CELL = 14;        // font size / cell height
    let cols: Column[] = [];
    let W = 0;
    let H = 0;

    function pickColor(): string {
      const r = Math.random();
      if (r < COLOR_CHANCE_VIOLET) return VIOLET;
      if (r < COLOR_CHANCE_VIOLET + COLOR_CHANCE_EMERALD) return EMERALD;
      return BRIGHT_CYAN;
    }

    function spawnColumn(x: number): Column {
      const len = 8 + Math.floor(Math.random() * 28);
      return {
        x,
        y: -Math.random() * H,       // start above viewport (staggered)
        speed: 0.6 + Math.random() * 1.4,
        len,
        chars: Array.from({ length: len }, randomGlyph),
        colorBase: pickColor(),
        ticker: 0,
        tickRate: 3 + Math.floor(Math.random() * 8),
      };
    }

    function buildColumns() {
      cols = [];
      const spacing = CELL * 1.35;
      const count = Math.ceil(W / spacing);
      for (let i = 0; i < count; i++) {
        cols.push(spawnColumn(i * spacing + CELL * 0.4));
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W;
      canvas!.height = H;
      buildColumns();
    }

    resize();
    window.addEventListener("resize", resize);

    ctx.font = `${CELL}px "JetBrains Mono", "Fira Mono", monospace`;
    ctx.textBaseline = "top";

    function draw() {
      const c = ctx!;

      // Fade-out trail with dark semi-transparent fill
      c.fillStyle = "rgba(2,6,23,0.18)";
      c.fillRect(0, 0, W, H);

      c.font = `${CELL}px "JetBrains Mono", "Fira Mono", monospace`;
      c.textBaseline = "top";

      for (const col of cols) {
        col.ticker++;
        if (col.ticker >= col.tickRate) {
          col.ticker = 0;
          // Scramble a random char in the trail
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = randomGlyph();
        }

        col.y += col.speed;

        // Draw trail cells from oldest (dim) to newest (bright head)
        for (let i = col.chars.length - 1; i >= 0; i--) {
          const cy = col.y - i * CELL;
          if (cy < -CELL || cy > H) continue;

          let alpha: number;
          let colorStr: string;

          if (i === 0) {
            // Head: pure white flash
            alpha = 0.92;
            colorStr = "rgba(220,255,255,";
          } else if (i <= 3) {
            // Near-head: bright color
            alpha = 0.55 - i * 0.08;
            colorStr = col.colorBase;
          } else {
            // Tail: dim
            const tailFade = 1 - (i - 3) / (col.chars.length - 3);
            alpha = 0.12 * tailFade;
            colorStr = DIM_CYAN;
          }

          c.fillStyle = `${colorStr}${alpha.toFixed(3)})`;
          c.fillText(col.chars[i], col.x, cy);
        }

        // Reset column when it scrolls fully off-screen
        if (col.y - col.chars.length * CELL > H) {
          // Recycle: new random position above viewport
          col.y = -Math.random() * H * 0.5;
          col.speed = 0.6 + Math.random() * 1.4;
          col.colorBase = pickColor();
          col.len = 8 + Math.floor(Math.random() * 28);
          col.chars = Array.from({ length: col.len }, randomGlyph);
          col.tickRate = 3 + Math.floor(Math.random() * 8);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.38 }}
    />
  );
}
