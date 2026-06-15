"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  type: "hub" | "node" | "relay";
}

interface Packet {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

const CYAN = "rgba(34,211,238,";
const VIOLET = "rgba(139,92,246,";
const EMERALD = "rgba(16,185,129,";

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function NeuralNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const nodes: Node[] = [];
    const packets: Packet[] = [];
    const edges: [number, number][] = [];

    const PACKET_COLORS = [
      CYAN + "0.9)",
      VIOLET + "0.85)",
      EMERALD + "0.8)",
    ];

    function buildGraph(w: number, h: number) {
      nodes.length = 0;
      edges.length = 0;
      packets.length = 0;

      const count = Math.min(Math.floor((w * h) / 22000), 52);

      for (let i = 0; i < count; i++) {
        const type: Node["type"] = i < 4 ? "hub" : i < 14 ? "relay" : "node";
        nodes.push({
          x: randomBetween(0.04, 0.96) * w,
          y: randomBetween(0.04, 0.96) * h,
          vx: randomBetween(-0.12, 0.12),
          vy: randomBetween(-0.12, 0.12),
          radius: type === "hub" ? 3.5 : type === "relay" ? 2.2 : 1.4,
          pulsePhase: Math.random() * Math.PI * 2,
          type,
        });
      }

      const maxDist = Math.min(w, h) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        const targets: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) targets.push({ j, d });
        }
        targets.sort((a, b) => a.d - b.d);
        const maxEdges = nodes[i].type === "hub" ? 5 : nodes[i].type === "relay" ? 3 : 2;
        for (let k = 0; k < Math.min(maxEdges, targets.length); k++) {
          const key1 = `${i}-${targets[k].j}`;
          const key2 = `${targets[k].j}-${i}`;
          const exists = edges.some(([a, b]) => `${a}-${b}` === key1 || `${a}-${b}` === key2);
          if (!exists) edges.push([i, targets[k].j]);
        }
      }

      for (let i = 0; i < Math.min(18, edges.length); i++) {
        const edgeIdx = Math.floor(Math.random() * edges.length);
        packets.push({
          fromNode: edges[edgeIdx][0],
          toNode: edges[edgeIdx][1],
          progress: Math.random(),
          speed: randomBetween(0.003, 0.009),
          color: PACKET_COLORS[Math.floor(Math.random() * PACKET_COLORS.length)],
        });
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
      buildGraph(width, height);
    }

    resize();
    window.addEventListener("resize", resize);

    let lastPacketSpawn = 0;

    function draw(ts: number) {
      const c = ctx!;
      c.clearRect(0, 0, width, height);

      // Spawn new packets periodically
      if (ts - lastPacketSpawn > 600 && edges.length > 0) {
        const edgeIdx = Math.floor(Math.random() * edges.length);
        packets.push({
          fromNode: edges[edgeIdx][0],
          toNode: edges[edgeIdx][1],
          progress: 0,
          speed: randomBetween(0.003, 0.009),
          color: PACKET_COLORS[Math.floor(Math.random() * PACKET_COLORS.length)],
        });
        if (packets.length > 40) packets.splice(0, 1);
        lastPacketSpawn = ts;
      }

      // Move nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      // Draw edges
      const maxEdgeDist = Math.min(width, height) * 0.28;
      for (const [a, b] of edges) {
        const na = nodes[a];
        const nb = nodes[b];
        if (!na || !nb) continue;
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxEdgeDist) continue;
        const alpha = (1 - dist / maxEdgeDist) * 0.12;
        c.beginPath();
        c.moveTo(na.x, na.y);
        c.lineTo(nb.x, nb.y);
        c.strokeStyle = `rgba(34,211,238,${alpha})`;
        c.lineWidth = 0.6;
        c.stroke();
      }

      // Draw packets (data pulses along edges)
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const na = nodes[p.fromNode];
        const nb = nodes[p.toNode];
        if (!na || !nb) continue;

        const px = na.x + (nb.x - na.x) * p.progress;
        const py = na.y + (nb.y - na.y) * p.progress;
        const trailLen = 0.06;
        const t0 = Math.max(0, p.progress - trailLen);
        const tx = na.x + (nb.x - na.x) * t0;
        const ty = na.y + (nb.y - na.y) * t0;

        const grad = c.createLinearGradient(tx, ty, px, py);
        grad.addColorStop(0, p.color.replace(/[\d.]+\)$/, "0)"));
        grad.addColorStop(1, p.color);
        c.beginPath();
        c.moveTo(tx, ty);
        c.lineTo(px, py);
        c.strokeStyle = grad;
        c.lineWidth = 1.5;
        c.stroke();

        c.beginPath();
        c.arc(px, py, 2.2, 0, Math.PI * 2);
        c.fillStyle = p.color;
        c.fill();
      }

      // Draw nodes
      for (const node of nodes) {
        node.pulsePhase += 0.025;
        const pulse = 0.5 + 0.5 * Math.sin(node.pulsePhase);

        if (node.type === "hub") {
          c.beginPath();
          c.arc(node.x, node.y, node.radius + 4 + pulse * 2, 0, Math.PI * 2);
          c.strokeStyle = `rgba(34,211,238,${0.06 + pulse * 0.08})`;
          c.lineWidth = 1;
          c.stroke();

          c.beginPath();
          c.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          c.fillStyle = `rgba(34,211,238,${0.55 + pulse * 0.2})`;
          c.fill();

          c.beginPath();
          c.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
          c.fillStyle = "rgba(255,255,255,0.9)";
          c.fill();
        } else if (node.type === "relay") {
          c.beginPath();
          c.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          c.fillStyle = `rgba(139,92,246,${0.4 + pulse * 0.2})`;
          c.fill();
        } else {
          c.beginPath();
          c.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          c.fillStyle = `rgba(34,211,238,${0.2 + pulse * 0.15})`;
          c.fill();
        }
      }

      // Subtle hex grid overlay (very faint)
      const hexSize = 60;
      const hexH = hexSize * Math.sqrt(3);
      const hexW = hexSize * 2;
      const cols = Math.ceil(width / (hexW * 0.75)) + 2;
      const rows = Math.ceil(height / hexH) + 2;
      c.strokeStyle = "rgba(34,211,238,0.022)";
      c.lineWidth = 0.5;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const ox = col * hexW * 0.75;
          const oy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
          c.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = ox + hexSize * Math.cos(angle);
            const hy = oy + hexSize * Math.sin(angle);
            if (i === 0) c.moveTo(hx, hy);
            else c.lineTo(hx, hy);
          }
          c.closePath();
          c.stroke();
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
      style={{ opacity: 0.55 }}
    />
  );
}
