import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/*
  The hero eye. A synthetic, greyscale macro eye drawn in SVG that tracks the
  pointer with spring physics, blinks, makes idle saccades and dilates when the
  primary actions are hovered. A biometric overlay tracks the iris.
  No photograph of a real person is used.

  Pupil dilation: dispatch `window.dispatchEvent(new CustomEvent('eye:focus', { detail: true }))`.
*/

const W = 1000;
const H = 640;
const C = { x: 540, y: 330 };
const L = { x: 175, y: 345 };
const R = { x: 885, y: 318 };
const IRIS_R = 150;

const CHECKS = [
  "CHIP SIGNATURE VALID",
  "LIVENESS PASSED",
  "FACE MATCH 98.6%",
  "PEP AND SANCTIONS CLEAR",
  "REGISTER MATCH",
  "READY FOR ACSP REVIEW",
];
const OPEN_UP = 112;
const CLOSED_UP = 470;
const LOW_Y = 512;
const MAX_X = 92;
const MAX_Y = 38;

type P = { x: number; y: number };
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
};
const dbez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return {
    x:
      3 * u * u * (p1.x - p0.x) +
      6 * u * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    y:
      3 * u * u * (p1.y - p0.y) +
      6 * u * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  };
};

// Deterministic pseudo-random so the eye looks the same every load
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const UPPER_LASHES = Array.from({ length: 46 }, (_, i) => ({
  t: 0.05 + (0.9 * i) / 45 + (rand(i) - 0.5) * 0.012,
  k: 0.75 + rand(i + 99) * 0.5,
  w: 1.6 + rand(i + 7) * 1.2,
}));
const LOWER_LASHES = Array.from({ length: 26 }, (_, i) => ({
  t: 0.16 + (0.72 * i) / 25 + (rand(i + 50) - 0.5) * 0.015,
  k: 0.7 + rand(i + 3) * 0.6,
}));

const FIBRES = Array.from({ length: 300 }, (_, i) => {
  const a = (i / 300) * Math.PI * 2 + (rand(i) - 0.5) * 0.02;
  const r1 = 50 + rand(i + 1) * 10;
  const r2 = 138 + rand(i + 2) * 10;
  const bend = (rand(i + 3) - 0.5) * 0.12;
  return {
    d: `M ${Math.cos(a) * r1} ${Math.sin(a) * r1} Q ${Math.cos(a + bend) * ((r1 + r2) / 2)} ${Math.sin(a + bend) * ((r1 + r2) / 2)} ${Math.cos(a + bend * 0.5) * r2} ${Math.sin(a + bend * 0.5) * r2}`,
    light: rand(i + 4) > 0.55,
    o: 0.18 + rand(i + 5) * 0.35,
    w: 0.8 + rand(i + 6) * 1.4,
  };
});

const CRYPTS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + rand(i + 20) * 0.3;
  const r = 82 + rand(i + 21) * 34;
  return {
    x: Math.cos(a) * r,
    y: Math.sin(a) * r,
    rx: 7 + rand(i + 22) * 9,
    ry: 3 + rand(i + 23) * 4,
    rot: (a * 180) / Math.PI,
    o: 0.25 + rand(i + 24) * 0.25,
  };
});

const COLLARETTE =
  Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r = 70 + (rand(i + 40) - 0.5) * 12;
    return `${i === 0 ? "M" : "L"} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ") + " Z";

function lidGeometry(open: number, lift: number) {
  const up = CLOSED_UP + (OPEN_UP - lift - CLOSED_UP) * open;
  const u1 = { x: 330, y: up + 8 };
  const u2 = { x: 720, y: up - 6 };
  const l1 = { x: 720, y: LOW_Y - (1 - open) * 18 };
  const l2 = { x: 330, y: LOW_Y + 6 - (1 - open) * 18 };
  const almond = `M ${L.x} ${L.y} C ${u1.x} ${u1.y}, ${u2.x} ${u2.y}, ${R.x} ${R.y} C ${l1.x} ${l1.y}, ${l2.x} ${l2.y}, ${L.x} ${L.y} Z`;
  const upper = `M ${L.x} ${L.y} C ${u1.x} ${u1.y}, ${u2.x} ${u2.y}, ${R.x} ${R.y}`;
  const crease = `M ${L.x + 20} ${L.y - 40} C 340 ${up - 70 - open * 10}, 720 ${up - 84 - open * 8}, ${R.x - 10} ${R.y - 60}`;
  const lashes = UPPER_LASHES.map(({ t, k, w }) => {
    const b = bez(L, u1, u2, R, t);
    const d = dbez(L, u1, u2, R, t);
    const len = Math.hypot(d.x, d.y) || 1;
    const tx = d.x / len;
    const ty = d.y / len;
    // Normal pointing up and out, tilting toward the outer corner
    const tilt = (t - 0.35) * 1.1;
    const nx = ty * Math.cos(tilt) + tx * Math.sin(tilt);
    const ny = -tx * Math.cos(tilt) + ty * Math.sin(tilt);
    const lenL =
      (22 + 46 * Math.pow(Math.sin(Math.PI * t), 0.7)) *
      k *
      (0.35 + 0.65 * open);
    const cx = b.x + nx * lenL * 0.6 + tx * lenL * 0.18;
    const cy = b.y + ny * lenL * 0.6;
    const ex = b.x + nx * lenL + tx * lenL * 0.5;
    const ey = b.y + ny * lenL * 0.82;
    return {
      d: `M ${b.x.toFixed(1)} ${b.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      w,
    };
  });
  const lower = LOWER_LASHES.map(({ t, k }) => {
    const b = bez(R, l1, l2, L, t);
    const lenL = (8 + 14 * Math.sin(Math.PI * t)) * k;
    const tilt = (0.5 - t) * 0.9;
    return `M ${b.x.toFixed(1)} ${b.y.toFixed(1)} q ${(Math.sin(tilt) * lenL).toFixed(1)} ${(lenL * 0.6).toFixed(1)} ${(Math.sin(tilt) * lenL * 1.4).toFixed(1)} ${lenL.toFixed(1)}`;
  });
  return { almond, upper, crease, lashes, lower };
}

const OPEN = lidGeometry(1, 0);

export function EyeHero({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const refs = useRef<Record<string, SVGElement | null>>({});
  const set = (k: string) => (el: SVGElement | null) => {
    refs.current[k] = el;
  };

  useEffect(() => {
    const svg = svgRef.current;
    const root = rootRef.current;
    if (!svg || !root) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const s = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
      bx: 0,
      by: 0,
      pupil: 1,
      pupilT: 1,
      open: 1,
      lift: 0,
    };
    let lastMove = 0;
    let nextSaccade = 0;
    let nextBlink = performance.now() + 2200;
    let blinkStart = -1;
    let focus = false;
    let visible = true;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const cx = r.left + ((C.x - 40) / (W - 60)) * r.width;
      const cy = r.top + ((C.y + 70) / (H + 140)) * r.height;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / (r.width * 0.55));
      s.tx = (dx / d) * f * MAX_X;
      s.ty = (dy / d) * f * MAX_Y;
      // Constrict when the pointer is very close: as if the light got brighter
      s.pupilT = focus ? 1.42 : d < r.width * 0.12 ? 0.78 : 1;
      lastMove = performance.now();
    };
    const onFocus = (e: Event) => {
      focus = !!(e as CustomEvent).detail;
      s.pupilT = focus ? 1.42 : 1;
    };
    const onClick = () => {
      blinkStart = performance.now();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    io.observe(root);

    const apply = () => {
      const g = refs.current;
      const sx = 1 - Math.abs(s.x) / 520;
      const sy = 1 - Math.abs(s.y) / 420;
      g.iris?.setAttribute(
        "transform",
        `translate(${C.x + s.x} ${C.y + s.y}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`,
      );
      g.pupil?.setAttribute("r", (40 * s.pupil).toFixed(2));
      g.pupilHalo?.setAttribute("r", (58 * s.pupil).toFixed(2));
      g.spec?.setAttribute(
        "transform",
        `translate(${(s.x * 0.45).toFixed(1)} ${(s.y * 0.45).toFixed(1)})`,
      );
      g.hud?.setAttribute(
        "transform",
        `translate(${(C.x + s.bx).toFixed(1)} ${(C.y + s.by).toFixed(1)})`,
      );
      // Step through the checks a case goes through, about two seconds each
      const step = CHECKS[Math.floor(performance.now() / 2200) % CHECKS.length];
      if (g.readout && g.readout.textContent !== step) {
        g.readout.textContent = step;
        // Fit the pill to its text and keep its right edge on the bracket
        const w =
          Math.ceil((g.readout as SVGTextElement).getComputedTextLength()) + 44;
        g.readoutBox?.setAttribute("width", String(w));
        g.readoutGroup?.setAttribute("transform", `translate(${230 - w} 186)`);
      }
    };

    const applyLids = () => {
      const geo = lidGeometry(s.open, s.lift);
      const g = refs.current;
      g.clip?.setAttribute("d", geo.almond);
      g.outline?.setAttribute("d", geo.almond);
      g.lidShadow?.setAttribute("d", geo.upper);
      g.lidEdge?.setAttribute("d", geo.upper);
      g.crease?.setAttribute("d", geo.crease);
      geo.lashes.forEach((l, i) =>
        refs.current[`lash${i}`]?.setAttribute("d", l.d),
      );
      geo.lower.forEach((d, i) =>
        refs.current[`low${i}`]?.setAttribute("d", d),
      );
    };

    function tick(t: number) {
      if (!visible || document.hidden) {
        frame = 0;
        return;
      }
      // Idle saccades when the pointer is still
      if (t - lastMove > 2600 && t > nextSaccade) {
        s.tx = (rand(t) - 0.5) * MAX_X * 1.3;
        s.ty = (rand(t + 1) - 0.5) * MAX_Y * 1.2;
        nextSaccade = t + 900 + rand(t + 2) * 1800;
      }
      // Spring toward the target: quick, with a touch of overshoot, like a real saccade
      s.vx = (s.vx + (s.tx - s.x) * 0.16) * 0.64;
      s.vy = (s.vy + (s.ty - s.y) * 0.16) * 0.64;
      s.x += s.vx;
      s.y += s.vy;
      // The overlay lags behind the iris, as if locking on
      s.bx += (s.x - s.bx) * 0.08;
      s.by += (s.y - s.by) * 0.08;
      s.pupil += (s.pupilT - s.pupil) * 0.08;
      s.lift += (-s.y * 0.35 - s.lift) * 0.1;

      // Blink: close fast, open slower
      if (blinkStart < 0 && t > nextBlink) {
        blinkStart = t;
        nextBlink = t + 2600 + rand(t + 3) * 3800;
      }
      let lidsChanged = Math.abs(s.lift) > 0.05;
      if (blinkStart >= 0) {
        const e = t - blinkStart;
        if (e < 85) s.open = 1 - e / 85;
        else if (e < 105) s.open = 0;
        else if (e < 260) s.open = (e - 105) / 155;
        else {
          s.open = 1;
          blinkStart = -1;
          // Sometimes a double blink
          if (rand(t + 9) > 0.82) nextBlink = t + 160;
        }
        lidsChanged = true;
      }
      if (lidsChanged) applyLids();
      apply();
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("eye:focus", onFocus);
    svg.addEventListener("click", onClick);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("eye:focus", onFocus);
      svg.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn("relative overflow-hidden bg-[#a8998f]", className)}
    >
      <svg
        ref={svgRef}
        viewBox={`40 -70 ${W - 60} ${H + 140}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full cursor-crosshair"
      >
        <defs>
          {/* Skin: noise lit from the top left, for pores and relief */}
          <filter id="skin" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="3"
              seed="4"
              result="n"
            />
            <feDiffuseLighting
              in="n"
              lightingColor="#ffffff"
              surfaceScale="1.6"
              result="lit"
            >
              <feDistantLight azimuth="225" elevation="58" />
            </feDiffuseLighting>
            <feColorMatrix in="lit" type="saturate" values="0" result="g" />
            <feComponentTransfer in="g">
              <feFuncA type="linear" slope="0.22" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="skinTone" cx="56%" cy="46%" r="75%">
            <stop offset="0" stopColor="#efe7e1" />
            <stop offset="0.35" stopColor="#d9cbc1" />
            <stop offset="0.7" stopColor="#a8958a" />
            <stop offset="1" stopColor="#6c5b52" />
          </radialGradient>
          <radialGradient id="socket" cx="50%" cy="50%" r="50%">
            <stop offset="0.55" stopColor="#4a3a33" stopOpacity="0.5" />
            <stop offset="1" stopColor="#4a3a33" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sclera" cx="50%" cy="54%" r="62%">
            <stop offset="0" stopColor="#fbf9f7" />
            <stop offset="0.5" stopColor="#efe8e3" />
            <stop offset="0.82" stopColor="#d2bdb4" />
            <stop offset="1" stopColor="#a6857c" />
          </radialGradient>
          <radialGradient id="irisBase" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#2b1d10" />
            <stop offset="0.26" stopColor="#9a5f1f" />
            <stop offset="0.4" stopColor="#d39a45" />
            <stop offset="0.56" stopColor="#8f9a6f" />
            <stop offset="0.74" stopColor="#5f7584" />
            <stop offset="0.9" stopColor="#33424d" />
            <stop offset="1" stopColor="#141a1f" />
          </radialGradient>
          <radialGradient id="pupilSoft" cx="50%" cy="50%" r="50%">
            <stop offset="0.6" stopColor="#060607" stopOpacity="0.85" />
            <stop offset="1" stopColor="#060607" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="corneaSheen" cx="38%" cy="30%" r="70%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="organic" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="2"
              seed="9"
              result="w"
            />
            <feDisplacementMap in="SourceGraphic" in2="w" scale="7" />
          </filter>
          <filter id="blur1">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id="blur4">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="blur10">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <clipPath id="eyeClip">
            <path ref={set("clip")} d={OPEN.almond} />
          </clipPath>
        </defs>

        {/* Skin */}
        <rect y={-150} width={W} height={H + 300} fill="url(#skinTone)" />
        <rect y={-150} width={W} height={H + 300} filter="url(#skin)" />
        <ellipse
          cx={C.x - 10}
          cy={C.y - 10}
          rx="440"
          ry="250"
          fill="url(#socket)"
          filter="url(#blur10)"
        />
        {/* Brow hairs */}
        <g
          opacity="0.3"
          stroke="#3a2c24"
          strokeLinecap="round"
          filter="url(#blur1)"
        >
          {Array.from({ length: 110 }, (_, i) => {
            const x = 140 + i * 6.6 + rand(i) * 6;
            const y =
              -20 - Math.sin((i / 110) * Math.PI) * 46 + rand(i + 1) * 16;
            return (
              <path
                key={i}
                d={`M ${x} ${y + 22} q ${10 + rand(i + 2) * 8} -${12 + rand(i + 3) * 6} ${22 + rand(i + 4) * 10} -${6 + rand(i + 5) * 6}`}
                strokeWidth={1.2 + rand(i + 6)}
                fill="none"
              />
            );
          })}
        </g>
        <path
          ref={set("crease")}
          d={OPEN.crease}
          fill="none"
          stroke="#5a463c"
          strokeOpacity="0.5"
          strokeWidth="9"
          filter="url(#blur4)"
        />

        {/* The eyeball, clipped to the opening */}
        <g clipPath="url(#eyeClip)">
          <rect width={W} height={H} fill="url(#sclera)" />
          {/* Faint vessels */}
          <g
            stroke="#9a8f8f"
            strokeOpacity="0.18"
            fill="none"
            strokeWidth="1.2"
            filter="url(#blur1)"
          >
            <path d="M 210 340 q 60 -12 120 4 t 70 -10" />
            <path d="M 860 322 q -60 10 -110 -2 t -70 14" />
            <path d="M 820 360 q -40 6 -80 26" />
          </g>
          <g ref={set("iris")} transform={`translate(${C.x} ${C.y})`}>
            <circle
              r={IRIS_R + 14}
              fill="#101112"
              opacity="0.45"
              filter="url(#blur4)"
            />
            <circle r={IRIS_R} fill="url(#irisBase)" />
            <g filter="url(#organic)">
              {FIBRES.map((f, i) => (
                <path
                  key={i}
                  d={f.d}
                  fill="none"
                  stroke={f.light ? "#f3e3c4" : "#1d1610"}
                  strokeOpacity={f.o}
                  strokeWidth={f.w}
                  strokeLinecap="round"
                />
              ))}
              {CRYPTS.map((c, i) => (
                <ellipse
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  rx={c.rx}
                  ry={c.ry}
                  transform={`rotate(${c.rot} ${c.x} ${c.y})`}
                  fill="#2a1d12"
                  opacity={c.o}
                />
              ))}
              <path
                d={COLLARETTE}
                fill="none"
                stroke="#f0c77e"
                strokeOpacity="0.55"
                strokeWidth="3.5"
              />
            </g>
            <circle
              r={IRIS_R - 4}
              fill="none"
              stroke="#121a20"
              strokeOpacity="0.85"
              strokeWidth="14"
              filter="url(#blur1)"
            />
            <circle ref={set("pupilHalo")} r="58" fill="url(#pupilSoft)" />
            <circle ref={set("pupil")} r="40" fill="#040405" />
          </g>
          {/* Reflections on the cornea move less than the iris */}
          <g ref={set("spec")}>
            <circle cx={C.x} cy={C.y} r={IRIS_R + 6} fill="url(#corneaSheen)" />
            <rect
              x={C.x - 62}
              y={C.y - 72}
              width="34"
              height="26"
              rx="8"
              fill="#ffffff"
              opacity="0.92"
              filter="url(#blur1)"
            />
            <circle
              cx={C.x + 46}
              cy={C.y + 40}
              r="5"
              fill="#ffffff"
              opacity="0.6"
            />
          </g>
          {/* Shadow cast by the upper lid */}
          <path
            ref={set("lidShadow")}
            d={OPEN.upper}
            fill="none"
            stroke="#3a2b24"
            strokeOpacity="0.5"
            strokeWidth="46"
            filter="url(#blur10)"
          />
        </g>
        <path
          ref={set("outline")}
          d={OPEN.almond}
          fill="none"
          stroke="#6d4f45"
          strokeOpacity="0.55"
          strokeWidth="3"
          filter="url(#blur1)"
        />
        <path
          ref={set("lidEdge")}
          d={OPEN.upper}
          fill="none"
          stroke="#22181a"
          strokeOpacity="0.85"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Lashes */}
        <g stroke="#141516" fill="none" strokeLinecap="round">
          {OPEN.lashes.map((l, i) => (
            <path
              key={i}
              ref={set(`lash${i}`)}
              d={l.d}
              strokeWidth={l.w}
              strokeOpacity="0.88"
            />
          ))}
        </g>
        <g
          stroke="#2a2c2e"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.45"
        >
          {OPEN.lower.map((d, i) => (
            <path key={i} ref={set(`low${i}`)} d={d} strokeWidth="1.3" />
          ))}
        </g>

        {/* Biometric overlay */}
        <g ref={set("hud")} transform={`translate(${C.x} ${C.y})`}>
          <g className="eye-ring">
            <circle
              r="196"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="2 10"
            />
            <circle
              r="212"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="60 22"
            />
          </g>
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy]) => (
            <path
              key={`${sx}${sy}`}
              d={`M ${sx * 230} ${sy * 170} h ${-sx * 40} M ${sx * 230} ${sy * 170} v ${-sy * 40}`}
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <line
            className="eye-scan"
            x1="-200"
            x2="200"
            y1="0"
            y2="0"
            stroke="#ffffff"
            strokeOpacity="0.8"
            strokeWidth="1.5"
          />
          <g transform="translate(-230 -212)">
            <rect
              width="172"
              height="30"
              rx="15"
              fill="#16181b"
              fillOpacity="0.88"
            />
            <circle cx="16" cy="15" r="4" fill="#ffd84d" />
            <text
              x="28"
              y="20"
              fill="#fafaf9"
              fontFamily="Google Sans Code, monospace"
              fontSize="13"
              letterSpacing="1.5"
            >
              IDENTITY CHECK
            </text>
          </g>
          <g ref={set("readoutGroup")} transform="translate(-20 186)">
            <rect
              ref={set("readoutBox")}
              width="250"
              height="30"
              rx="15"
              fill="#16181b"
              fillOpacity="0.88"
            />
            <circle cx="16" cy="15" r="4" fill="#5fd38d" />
            <text
              ref={set("readout")}
              x="28"
              y="20"
              fill="#fafaf9"
              fontFamily="Google Sans Code, monospace"
              fontSize="13"
              letterSpacing="1"
            >
              CHIP SIGNATURE VALID
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
