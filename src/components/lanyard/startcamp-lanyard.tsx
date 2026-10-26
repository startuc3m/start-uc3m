"use client";

import React, { useEffect, useRef, useState } from "react";
import neonpassQRAsset from "../../assets/component_assets/startcamp-neonpass-qr.svg";
const neonpassQR = typeof neonpassQRAsset === "string" ? neonpassQRAsset : (neonpassQRAsset as { src: string }).src;
import { advanceLanyardClock, LANYARD_STEP, smoothLanyardAngle } from "./lanyard_motion.js";
import { getStartcampCountdown, STARTCAMP_END } from "./startcamp_countdown.js";

const DISMISS_KEY = "startcamp-lanyard-dismissed";

// Only on screens wide enough to hang beside the hero, and only until the event ends.
function shouldShow() {
        if (Date.now() >= STARTCAMP_END) return false;
        if (!window.matchMedia("(min-width: 1024px)").matches) return false;
        try {
                return sessionStorage.getItem(DISMISS_KEY) !== "1";
        } catch {
                return true;
        }
}

const EVENT_URL = "https://www.neonpass.es/event/ec3ee828-56d3-40d4-9636-ece85cfd383b";

function StartcampCountdown() {
        const [remaining, setRemaining] = useState(getStartcampCountdown);
        useEffect(() => {
                const timer = window.setInterval(() => setRemaining(getStartcampCountdown()), 1000);
                return () => window.clearInterval(timer);
        }, []);

        return (
                <div className="scl-countdown">
                        <div className="scl-countdown-units" role="timer" aria-label="Tiempo hasta el inicio de STARTCAMP">
                                {remaining.map((value, i) => (
                                        <span key={i}><b>{String(value).padStart(2, "0")}</b><small>{["DÍAS", "HORAS", "MIN", "SEG"][i]}</small></span>
                                ))}
                        </div>
                </div>
        );
}

export interface StartcampLanyardProps {
        /** If false, shows the guest/incognito badge with the Join CTA */
        isLoggedIn?: boolean;
        name?: string;
        role?: string;
        brand?: string;
        brandTagline?: string;
        pillars?: [string, string, string];
        location?: string;
        idNumber?: string;
        validThru?: string;
        githubUrl?: string;
        linkedinUrl?: string;
        instagramUrl?: string;
        anchorX?: string;
        anchorY?: number;
        scale?: number;
        zIndex?: number;
        showHint?: boolean;
        className?: string;
}

const CSS = `
.scl-root{
  --scl-ink-faint:#5b6270;
  --scl-accent:#333399;
  --scl-accent-dim:#24246f;
  --scl-card:#f5f7ff;
  --scl-card-2:#e4e9f8;
  --scl-card-ink:#24246f;
  --scl-card-soft:#5a6586;
  --scl-card-line:#cbd3ec;
  --scl-font-display:'Anton','Arial Narrow',sans-serif;
  --scl-font-mono:'JetBrains Mono','Consolas',monospace;
  --scl-font-script:'Permanent Marker',cursive;
  font-family:'Titillium Web',system-ui,sans-serif;
}
.scl-root *{ box-sizing:border-box; }
.scl-countdown{ width:100%; margin:auto 0 0; padding:10px 0 4px; color:var(--scl-card-ink); font-family:var(--scl-font-mono); pointer-events:none; text-align:center; border-top:1px solid var(--scl-card-line); }
.scl-countdown-units{ display:grid; grid-template-columns:repeat(4,1fr); }
.scl-countdown-units>span{ position:relative; display:flex; flex-direction:column; gap:2px; }
.scl-countdown-units>span:not(:last-child)::after{ content:':'; position:absolute; right:-3px; top:0; font-size:25px; line-height:1; }
.scl-countdown-units b{ font-size:25px; line-height:1; font-variant-numeric:tabular-nums; }
.scl-countdown-units small{ font-size:7.5px; letter-spacing:1px; color:var(--scl-card-soft); }

.scl-stage{
  /* Hangs over the hero and scrolls away with it, under the sticky menu. */
  position:absolute;
  top:0; left:0; width:100%; height:100svh;
  z-index:var(--scl-z, 60);
  pointer-events:none;
  overflow:visible;
}

.scl-rope{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }

.scl-rail{
  position:absolute; top:0; width:64px; height:6px;
  transform:translateX(-50%);
  background:linear-gradient(180deg, #3a4150, #21252f);
  border-radius:0 0 4px 4px;
  box-shadow:0 2px 6px rgba(0,0,0,.5);
  pointer-events:none;
}

.scl-card{
  position:absolute;
  left:0; top:0;
  width:min(236px, calc(100vw - 32px));
  aspect-ratio: 236 / 460;
  perspective:1400px;
  cursor:grab; touch-action:none; user-select:none;
  transform-origin:50% 20px;
  will-change:transform;
  pointer-events:auto;
  visibility:hidden; /* until the first frame positions it */
}
.scl-card:active{ cursor:grabbing; }

.scl-flipper{ position:relative; width:100%; height:100%; transform-style:preserve-3d; }

.scl-face{
  position:absolute; inset:0; border-radius:18px;
  padding:16px 16px 14px;
  display:flex; flex-direction:column;
  backface-visibility:hidden;
  box-shadow:
    0 32px 60px -16px rgba(0,0,0,.6),
    0 10px 20px -8px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 0 0 1px rgba(0,0,0,.05);
}
.scl-face::before{
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background:
    linear-gradient(180deg, rgba(255,255,255,.55) 0%, transparent 24%),
    radial-gradient(rgba(0,0,0,.07) 1px, transparent 1.3px) 0 0/3px 3px;
  mix-blend-mode:multiply; opacity:.6;
}
.scl-face::after{
  content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.6), transparent 40%);
  mix-blend-mode:overlay; opacity:0; transition:opacity .3s ease;
}
.scl-card.scl-hovering .scl-face::after{ opacity:1; }
@media (prefers-reduced-motion: reduce){ .scl-face::after{ transition:none; } }

.scl-front{ background:linear-gradient(165deg, var(--scl-card), var(--scl-card-2)); align-items:stretch; text-align:left; }
.scl-back{ background:linear-gradient(165deg, var(--scl-card-2), var(--scl-card)); transform:rotateY(180deg); }

.scl-holo{
  position:absolute; top:14px; bottom:14px; right:5px; width:6px; border-radius:5px;
  background:repeating-linear-gradient(125deg, #eef1f7 0%, #cfd6e4 10%, #b9c2d6 20%, #e7ebf3 30%, #eef1f7 40%);
  background-size:220% 220%;
  animation:scl-foil 7s linear infinite;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.1), 0 0 6px rgba(255,255,255,.3);
}
@keyframes scl-foil{ to{ background-position:220% 0%; } }
@media (prefers-reduced-motion: reduce){ .scl-holo{ animation:none; } }

.scl-hole{ width:32px; height:9px; background:var(--scl-card-ink); border-radius:5px; margin:0 auto 10px; flex-shrink:0; opacity:.85; }
.scl-close{ position:absolute; top:5px; right:12px; z-index:2; width:24px; height:24px; padding:0; border:none; border-radius:50%; background:transparent; color:var(--scl-card-soft); font-family:var(--scl-font-mono); font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:.75; transition:opacity .15s, background .15s, color .15s; }
.scl-close:hover{ opacity:1; background:rgba(32,46,115,.1); color:var(--scl-card-ink); }

.scl-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
.scl-brand{ display:flex; align-items:flex-start; gap:6px; }
.scl-brand-text{ display:flex; flex-direction:column; }
.scl-brand-text b{ font-family:var(--scl-font-display); font-weight:400; font-size:25px; letter-spacing:.01em; color:var(--scl-card-ink); line-height:1.1; }
.scl-brand-text small{ font-family:var(--scl-font-mono); font-size:8px; letter-spacing:.09em; text-transform:uppercase; color:var(--scl-card-soft); }
.scl-pillars{ display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
.scl-pillars span{ font-family:var(--scl-font-mono); font-size:8px; letter-spacing:.1em; text-transform:none; color:var(--scl-card-soft); }
.scl-pillars i{ width:16px; height:2px; background:var(--scl-card-ink); margin-top:3px; }

.scl-photo{
  position:relative; width:100%; height:110px; border-radius:10px;
  background:#eae7de; overflow:hidden; margin-bottom:10px; flex-shrink:0;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.08), inset 0 2px 6px rgba(0,0,0,.12);
}
.scl-photo svg{ width:100%; height:100%; display:block; }
.scl-verified{
  position:absolute; right:-6px; bottom:-6px; width:22px; height:22px; border-radius:50%;
  background:linear-gradient(160deg, var(--scl-accent), var(--scl-accent-dim));
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 2px 6px rgba(0,0,0,.4), 0 0 0 3px var(--scl-card);
}
.scl-verified.scl-incognito{
  background:linear-gradient(160deg, #5264b0, #24246f);
  color:#fff;
  font-family:var(--scl-font-mono);
  font-size:11px;
  font-weight:700;
}
.scl-verified svg{ width:11px; height:11px; }

.scl-name{ margin:0 0 2px; font-family:var(--scl-font-display); font-weight:400; font-size:18px; color:var(--scl-card-ink); letter-spacing:-.01em; }
.scl-role{ margin:0 0 8px; font-size:10px; color:var(--scl-card-soft); font-weight:600; letter-spacing:.09em; text-transform:uppercase; }

.scl-divider{ width:100%; height:1px; background:var(--scl-card-line); margin-bottom:8px; }
.scl-status-banner{ width:100%; margin:auto 0; padding:10px 0; border-top:1px solid var(--scl-card-line); border-bottom:1px solid var(--scl-card-line); font-family:var(--scl-font-display); font-weight:400; font-size:17px; letter-spacing:.06em; text-align:center; text-transform:uppercase; color:var(--scl-card-ink); }

.scl-idrow{ width:100%; display:flex; justify-content:space-between; align-items:center; gap:10px; margin:auto 0; }
.scl-idrow-labels{ display:flex; flex-direction:column; justify-content:space-between; height:80px; font-family:var(--scl-font-mono); }
.scl-idrow-labels div{ display:flex; flex-direction:column; gap:1px; }
.scl-idrow-labels span{ font-size:7.5px; line-height:1; letter-spacing:.08em; text-transform:uppercase; color:var(--scl-card-soft); }
.scl-idrow-labels b{ font-size:11px; font-weight:700; color:var(--scl-card-ink); white-space:nowrap; line-height:1.1; }

.scl-join-btn{
  width:100%;
  text-decoration:none;
  padding:10px 12px;
  margin-top:auto;
  border-radius:6px;
  background:var(--scl-card-ink);
  color:#ffffff;
  border:none;
  font-family:var(--scl-font-mono);
  font-size:11.5px;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  transition:background .15s ease, transform .1s ease;
  box-shadow:0 3px 8px rgba(0,0,0,.2);
}
.scl-join-btn:hover{ background:var(--scl-accent-dim); transform:translateY(-1px); }
.scl-join-btn:focus-visible{ outline:3px solid var(--scl-accent); outline-offset:4px; }
.scl-join-btn:active{ transform:translateY(1px); }

.scl-footer{
  width:100%; margin-top:auto; padding-top:6px; border-top:1px solid var(--scl-card-line);
  text-align:center; font-family:var(--scl-font-mono); font-size:8px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--scl-card-soft);
}
.scl-footer i{ color:var(--scl-card-line); font-style:normal; margin:0 5px; }

.scl-stripe{ width:100%; height:28px; background:repeating-linear-gradient(45deg, #1b1d24, #1b1d24 6px, #26282f 6px, #26282f 12px); border-radius:3px; margin-bottom:10px; }
.scl-barcode{ display:flex; align-items:flex-end; gap:2px; height:30px; width:100%; background:#fff; border-radius:3px; padding:0 4px; margin-bottom:8px; overflow:hidden; }
.scl-barcode span{ width:2px; background:#1a1c22; }
.scl-idnum{ margin:0 0 8px; font-family:var(--scl-font-mono); font-size:9px; font-weight:600; color:var(--scl-card-ink); letter-spacing:.03em; display:flex; justify-content:space-between; font-variant-numeric: tabular-nums; }
.scl-idnum em{ font-style:normal; color:var(--scl-card-soft); }

.scl-backrow{ display:flex; gap:10px; align-items:flex-start; margin-bottom:8px; }
.scl-qr{ display:block; width:80px; height:80px; background:#fff; border-radius:4px; overflow:hidden; flex-shrink:0; box-shadow:0 0 0 1px var(--scl-card-line); }
.scl-qr img{ display:block; width:100%; height:100%; }


.scl-scan{ font-family:var(--scl-font-mono); font-size:8px; color:var(--scl-card-soft); line-height:1.45; padding-top:1px; text-align:left; }
.scl-scan b{ color:var(--scl-card-ink); display:block; font-size:8.5px; margin-bottom:2px; letter-spacing:.03em; }

.scl-connect{ display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
.scl-connect span{ font-family:var(--scl-font-mono); font-size:8px; letter-spacing:.1em; text-transform:uppercase; color:var(--scl-card-soft); }
.scl-connect-icons{ display:flex; gap:6px; }
.scl-connect-icons a{
  width:22px; height:22px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--scl-card-line); color:var(--scl-card-soft);
  transition:border-color .15s ease, color .15s ease, transform .15s ease;
}
.scl-connect-icons a:hover{ border-color:var(--scl-accent); color:var(--scl-accent); transform:translateY(-1px); }
.scl-connect-icons svg{ width:11px; height:11px; }

.scl-sig{ margin-top:12px; }
.scl-sig .scl-script{ font-family:var(--scl-font-script); font-size:24px; color:var(--scl-card-ink); line-height:1; }
.scl-sig small{ display:block; font-family:var(--scl-font-mono); font-size:7.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--scl-card-soft); border-top:1px solid var(--scl-card-line); margin-top:3px; padding-top:3px; }

.scl-hint{
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  display:flex; align-items:center; gap:6px;
  background:rgba(10,12,16,.72);
  color:#f3f0e9;
  padding:7px 14px;
  border-radius:999px;
  font-family:var(--scl-font-mono);
  font-size:11px; letter-spacing:.03em;
  pointer-events:none;
  opacity:1;
  transition:opacity .4s ease;
  white-space:nowrap;
}
.scl-hint.scl-hint-hidden{ opacity:0; }
.scl-hint svg{ width:13px; height:13px; opacity:.75; flex-shrink:0; }
`;

export function StartcampLanyard({
        isLoggedIn = false,
        name = "Maya Chen",
        role = "Creative Developer",
        brand = "STARTCAMP",
        brandTagline = "Hackatón · Start UC3M",
        pillars = ["start_", "uc3m", "2026"],
        location = "Brooklyn, NY",
        idNumber = "MC-042019",
        validThru = "12/2029",
        githubUrl,
        linkedinUrl,
        instagramUrl,
        anchorX = "50%",
        anchorY = 6,
        scale = 1.15,
        zIndex = 40,
        showHint = false,
        className = "",
}: StartcampLanyardProps) {
        const sceneRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const railRef = useRef<HTMLDivElement>(null);
        const cardRef = useRef<HTMLDivElement>(null);
        const flipperRef = useRef<HTMLDivElement>(null);
        const barcodeRef = useRef<HTMLDivElement>(null);
        const [interacted, setInteracted] = useState(false);
        const [dismissed, setDismissedState] = useState(() => !shouldShow());
        const setDismissed = (value: boolean) => {
                try {
                        if (value) sessionStorage.setItem(DISMISS_KEY, "1");
                } catch {
                        // Private mode: it only stays closed until reload
                }
                setDismissedState(value);
        };


        useEffect(() => {
                const scene = sceneRef.current;
                const canvas = canvasRef.current;
                const rail = railRef.current;
                const card = cardRef.current;
                const flipper = flipperRef.current;
                const barcodeEl = barcodeRef.current;
                if (!scene || !canvas || !rail || !card || !flipper || !barcodeEl) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                barcodeEl.innerHTML = "";
                for (let i = 0; i < 30; i++) {
                        const bar = document.createElement("span");
                        bar.style.height = ((i * 37) % 100 > 40 ? 100 : 55) + "%";
                        barcodeEl.appendChild(bar);
                }

                function resolveAnchorX() {
                        const rect = scene!.getBoundingClientRect();
                        const v = anchorX.trim();
                        const calcMatch = v.match(/^calc\(\s*100%\s*-\s*([\d.]+)px\s*\)$/);
                        const x = calcMatch ? rect.width - parseFloat(calcMatch[1]) : v.endsWith("%") ? rect.width * (parseFloat(v) / 100) : parseFloat(v);
                        // Keep the whole badge on screen on narrow viewports.
                        const half = (card!.offsetWidth * scale) / 2 + 8;
                        return Math.max(half, Math.min(rect.width - half, x));
                }

                const anchor = { x: resolveAnchorX(), y: anchorY };

                function resize() {
                        const rect = scene!.getBoundingClientRect();
                        canvas!.width = rect.width;
                        canvas!.height = rect.height;
                        anchor.x = resolveAnchorX();
                        rail!.style.left = anchor.x + "px";
                        rail!.style.top = anchor.y - 3 + "px";
                }
                resize();

                const NUM_POINTS = 14;
                const REST_LENGTH = 150;
                const SEGMENT_LENGTH = REST_LENGTH / (NUM_POINTS - 1);
                const GRAVITY = 0.48;
                const FRICTION = 0.965; // realistic ribbon air resistance
                const CONSTRAINT_ITERATIONS = 8;
                const TAP_THRESHOLD = 8;
                const MAX_TILT = 11;

                type Pt = { x: number; y: number; oldx: number; oldy: number; pinned: boolean };
                const points: Pt[] = [];
                for (let i = 0; i < NUM_POINTS; i++) {
                        const y = anchor.y + i * SEGMENT_LENGTH;
                        points.push({ x: anchor.x, y, oldx: anchor.x, oldy: y, pinned: i === 0 });
                }
                const previousPoints = points.map(p => ({ x: p.x, y: p.y }));
                const renderPoints = points.map(p => ({ x: p.x, y: p.y }));
                let cardAngle = 0;

                // Entrance: the badge free-falls from above the viewport and the ribbon catches it.
                // The offset only shifts the rendered ribbon and card; the physics points already hang at rest.
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const dropHeight = anchor.y + REST_LENGTH + card.offsetHeight * scale + 40;
                const drop = { active: !reduceMotion, offset: reduceMotion ? 0 : -dropHeight, previous: reduceMotion ? 0 : -dropHeight, velocity: 0 };

                function updateDrop() {
                        drop.previous = drop.offset;
                        // Wait for the site's intro curtain (Base.astro) so the fall is actually seen.
                        if (!drop.active || document.documentElement.classList.contains("is-loading")) return;
                        drop.velocity += GRAVITY;
                        drop.offset += drop.velocity;
                        if (drop.offset < 0) return;
                        drop.offset = 0;
                        drop.active = false;
                        // Hand the landing speed to the ribbon so it stretches, bounces and swings a little.
                        const impulse = Math.min(drop.velocity * 0.5, 12);
                        points.forEach((p, i) => {
                                const t = i / (points.length - 1);
                                p.oldy = p.y - impulse * t;
                                p.oldx = p.x + 3 * t;
                        });
                }

                let dragging = false;
                let flipped = false;
                let downPos = { x: anchor.x, y: anchor.y };
                // Offset between pointer position and the top-center card attachment hole
                let dragOffset = { x: 0, y: 0 };
                let pointer = { x: anchor.x, y: anchor.y + REST_LENGTH };
                let lastPointerPos = { x: anchor.x, y: anchor.y + REST_LENGTH };
                let lastPointerTime = 0;
                let smoothVelocity = { x: 0, y: 0 };

                let flipTarget = 0;
                let flipCurrent = 0;
                const tiltTarget = { x: 0, y: 0 };
                const tiltCurrent = { x: 0, y: 0 };
                let mouse = { x: -9999, y: -9999 };

                function getScenePos(e: PointerEvent) {
                        const rect = scene!.getBoundingClientRect();
                        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }

                function clampToScene(p: { x: number; y: number }) {
                        const margin = 20;
                        p.x = Math.max(margin, Math.min(canvas!.width - margin, p.x));
                        p.y = Math.max(anchor.y + 10, Math.min(canvas!.height - margin, p.y));
                        return p;
                }

                function updatePoints() {
                        for (let i = 1; i < points.length; i++) {
                                if (dragging && i === points.length - 1) continue;
                                const p = points[i];
                                const vx = (p.x - p.oldx) * FRICTION;
                                const vy = (p.y - p.oldy) * FRICTION;
                                p.oldx = p.x;
                                p.oldy = p.y;
                                p.x += vx;
                                p.y += vy + GRAVITY;
                        }
                }

                function applyConstraints() {
                        points[0].x = anchor.x;
                        points[0].y = anchor.y;
                        if (dragging) {
                                const last = points[points.length - 1];
                                last.x = pointer.x;
                                last.y = pointer.y;
                        }
                        for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
                                for (let i = 0; i < points.length - 1; i++) {
                                        const p1 = points[i];
                                        const p2 = points[i + 1];
                                        const dx = p2.x - p1.x;
                                        const dy = p2.y - p1.y;
                                        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                                        const diff = (SEGMENT_LENGTH - dist) / dist;
                                        const offX = dx * diff * 0.5;
                                        const offY = dy * diff * 0.5;
                                        if (!p1.pinned) {
                                                p1.x -= offX;
                                                p1.y -= offY;
                                        }
                                        if (!(dragging && i + 1 === points.length - 1)) {
                                                p2.x += offX;
                                                p2.y += offY;
                                        }
                                        // Pinned anchor cannot move
                                        if (p1.pinned) {
                                                p1.x = anchor.x;
                                                p1.y = anchor.y;
                                        }
                                }
                        }
                        for (let i = 1; i < points.length; i++) clampToScene(points[i]);
                }

                function drawRope() {
                        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
                        const path: { x: number; y: number; cx?: number; cy?: number }[] = [];
                        path.push({ x: renderPoints[0].x, y: renderPoints[0].y });
                        for (let i = 1; i < renderPoints.length - 1; i++) {
                                const midX = (renderPoints[i].x + renderPoints[i + 1].x) / 2;
                                const midY = (renderPoints[i].y + renderPoints[i + 1].y) / 2;
                                path.push({ x: renderPoints[i].x, y: renderPoints[i].y, cx: midX, cy: midY });
                        }
                        path.push(renderPoints[renderPoints.length - 1]);

                        function strokeRibbon(style: string | CanvasGradient, width: number) {
                                ctx!.beginPath();
                                ctx!.moveTo(path[0].x, path[0].y);
                                for (let i = 1; i < path.length; i++) {
                                        const p = path[i];
                                        if (p.cx !== undefined) ctx!.quadraticCurveTo(p.x, p.y, p.cx, p.cy as number);
                                        else ctx!.lineTo(p.x, p.y);
                                }
                                ctx!.strokeStyle = style;
                                ctx!.lineWidth = width;
                                ctx!.lineCap = "round";
                                ctx!.lineJoin = "round";
                                ctx!.stroke();
                        }

                        ctx!.save();
                        ctx!.translate(2, 4);
                        ctx!.globalAlpha = 0.3;
                        strokeRibbon("#000000", 16);
                        ctx!.restore();

                        strokeRibbon("#333399", 16);
                        strokeRibbon("rgba(0,0,0,0.35)", 16.5);
                        strokeRibbon("#333399", 13.5);
                        strokeRibbon("rgba(255,255,255,0.07)", 3);

                        const markIdx = Math.floor(points.length * 0.3);
                        const m = renderPoints[markIdx];
                        const mPrev = renderPoints[markIdx - 1];
                        const mNext = renderPoints[markIdx + 1];
                        const angle = Math.atan2(mNext.y - mPrev.y, mNext.x - mPrev.x) + Math.PI / 2;
                        ctx!.save();
                        ctx!.translate(m.x, m.y);
                        ctx!.rotate(angle);
                        ctx!.strokeStyle = "rgba(255,255,255,0.5)";
                        ctx!.lineWidth = 1.3;
                        ctx!.lineCap = "round";
                        ctx!.lineJoin = "round";
                        ctx!.beginPath();
                        ctx!.moveTo(-4, 3.5);
                        ctx!.lineTo(0, -3.5);
                        ctx!.lineTo(4, 3.5);
                        ctx!.stroke();
                        ctx!.restore();
                }

                function drawClip() {
                        ctx!.save();
                        ctx!.translate(anchor.x, anchor.y - 2);
                        const g = ctx!.createLinearGradient(-11, -9, 11, 9);
                        g.addColorStop(0, "#e7e9ec");
                        g.addColorStop(0.35, "#aeb2b8");
                        g.addColorStop(0.65, "#7c8087");
                        g.addColorStop(1, "#4d5157");
                        ctx!.fillStyle = g;
                        ctx!.beginPath();
                        ctx!.roundRect(-11, -9, 22, 16, 4);
                        ctx!.fill();
                        ctx!.strokeStyle = "rgba(0,0,0,.25)";
                        ctx!.lineWidth = 1;
                        ctx!.stroke();
                        ctx!.strokeStyle = "rgba(255,255,255,.55)";
                        ctx!.lineWidth = 1;
                        ctx!.beginPath();
                        ctx!.moveTo(-8, -6);
                        ctx!.lineTo(8, -6);
                        ctx!.stroke();
                        ctx!.fillStyle = "#3a3d42";
                        ctx!.beginPath();
                        ctx!.arc(0, 0, 2.2, 0, Math.PI * 2);
                        ctx!.fill();
                        ctx!.restore();
                }

                function positionCard(elapsed: number) {
                        const last = renderPoints[renderPoints.length - 1];
                        const prev = renderPoints[renderPoints.length - 2];
                        const angle = Math.atan2(last.y - prev.y, last.x - prev.x) - Math.PI / 2;
                        cardAngle = smoothLanyardAngle(cardAngle, angle, elapsed);
                        card!.style.transform = `translate3d(${last.x}px, ${last.y - 20}px, 0) translateX(-50%) rotate(${cardAngle}rad) scale(${scale})`;
                        card!.style.visibility = "visible";
                }

                function updateTiltAndSheen(elapsed: number) {
                        const frameScale = elapsed / LANYARD_STEP;
                        flipCurrent += (flipTarget - flipCurrent) * (1 - Math.pow(0.84, frameScale));

                        const hovering = !dragging && mouse.x > -1000;
                        if (hovering) {
                                const last = renderPoints[renderPoints.length - 1];
                                const left = last.x - card!.offsetWidth / 2;
                                const top = last.y - 20;
                                const cx = last.x;
                                const cy = top + card!.offsetHeight / 2;
                                const dx = Math.max(-1, Math.min(1, (mouse.x - cx) / (card!.offsetWidth / 2)));
                                const dy = Math.max(-1, Math.min(1, (mouse.y - cy) / (card!.offsetHeight / 2)));
                                tiltTarget.y = dx * MAX_TILT;
                                tiltTarget.x = -dy * MAX_TILT;

                                const mx = Math.max(0, Math.min(100, ((mouse.x - left) / card!.offsetWidth) * 100));
                                const my = Math.max(0, Math.min(100, ((mouse.y - top) / card!.offsetHeight) * 100));
                                card!.style.setProperty("--mx", mx + "%");
                                card!.style.setProperty("--my", my + "%");
                                card!.classList.add("scl-hovering");
                        } else {
                                tiltTarget.x = 0;
                                tiltTarget.y = 0;
                                card!.classList.remove("scl-hovering");
                        }

                        const tiltBlend = 1 - Math.pow(0.88, frameScale);
                        tiltCurrent.x += (tiltTarget.x - tiltCurrent.x) * tiltBlend;
                        tiltCurrent.y += (tiltTarget.y - tiltCurrent.y) * tiltBlend;

                        flipper!.style.transform = `rotateY(${flipCurrent + tiltCurrent.y}deg) rotateX(${tiltCurrent.x}deg)`;
                }

                let raf = 0;
                const clock = { time: performance.now(), accumulator: 0 };
                function loop(time: number) {
                        const { steps, blend, elapsed } = advanceLanyardClock(clock, time);
                        for (let step = 0; step < steps; step++) {
                                points.forEach((p, i) => {
                                        previousPoints[i].x = p.x;
                                        previousPoints[i].y = p.y;
                                });
                                updatePoints();
                                applyConstraints();
                                updateDrop();
                        }
                        // Interpolate both the ribbon and badge between fixed physics steps.
                        const dropOffset = drop.previous + (drop.offset - drop.previous) * blend;
                        points.forEach((p, i) => {
                                renderPoints[i].x = previousPoints[i].x + (p.x - previousPoints[i].x) * blend;
                                renderPoints[i].y = previousPoints[i].y + (p.y - previousPoints[i].y) * blend + (i === 0 ? 0 : dropOffset);
                        });
                        drawRope();
                        drawClip();
                        positionCard(elapsed);
                        updateTiltAndSheen(elapsed);
                        raf = requestAnimationFrame(loop);
                }

                const onCardDown = (e: PointerEvent) => {
                        // Prevent drag initiation when clicking buttons or links
                        if ((e.target as HTMLElement).closest("a, button")) return;
                        if (drop.active) return;
                        e.preventDefault();
                        dragging = true;
                        setInteracted(true);
                        card!.setPointerCapture(e.pointerId);

                        const pos = getScenePos(e);
                        downPos = pos;
                        const last = renderPoints[renderPoints.length - 1];
                        // Maintain mouse relative grab distance so card does not teleport to pointer
                        dragOffset = {
                                x: last.x - pos.x,
                                y: last.y - pos.y,
                        };
                        pointer = { x: last.x, y: last.y };
                        lastPointerPos = pos;
                        lastPointerTime = e.timeStamp;
                        smoothVelocity = { x: 0, y: 0 };
                };

                const onWindowMove = (e: PointerEvent) => {
                        const pos = getScenePos(e);
                        mouse = pos;
                        if (!dragging) return;

                        const elapsed = Math.max(1, e.timeStamp - lastPointerTime);
                        const velocityBlend = 1 - Math.pow(0.4, elapsed / LANYARD_STEP);
                        const instVx = (pos.x - lastPointerPos.x) * LANYARD_STEP / elapsed * 0.75;
                        const instVy = (pos.y - lastPointerPos.y) * LANYARD_STEP / elapsed * 0.75;
                        smoothVelocity.x += (instVx - smoothVelocity.x) * velocityBlend;
                        smoothVelocity.y += (instVy - smoothVelocity.y) * velocityBlend;
                        lastPointerPos = pos;
                        lastPointerTime = e.timeStamp;

                        const targetCardHole = {
                                x: pos.x + dragOffset.x,
                                y: pos.y + dragOffset.y,
                        };
                        pointer = clampToScene(targetCardHole);
                };

                const onWindowUp = (e: PointerEvent) => {
                        if (!dragging) return;
                        dragging = false;
                        try {
                                card!.releasePointerCapture(e.pointerId);
                        } catch {
                                // Pointer capture may already be released
                        }

                        const pos = getScenePos(e);
                        const dist = Math.hypot(pos.x - downPos.x, pos.y - downPos.y);
                        if (dist < TAP_THRESHOLD) {
                                flipped = !flipped;
                                flipTarget = flipped ? 180 : 0;
                                const last = points[points.length - 1];
                                last.oldx = last.x;
                                last.oldy = last.y;
                                return;
                        }

                        // Apply fling velocity to the lanyard end tip with clamping to prevent explosive fling
                        const maxVel = 18;
                        const releaseDecay = Math.exp(-Math.max(0, e.timeStamp - lastPointerTime) / 50);
                        const clampedVx = Math.max(-maxVel, Math.min(maxVel, smoothVelocity.x * releaseDecay));
                        const clampedVy = Math.max(-maxVel, Math.min(maxVel, smoothVelocity.y * releaseDecay));

                        const last = points[points.length - 1];
                        last.oldx = last.x - clampedVx;
                        last.oldy = last.y - clampedVy;
                };
                const onResize = () => resize();
                const onPointerOut = (e: PointerEvent) => {
                        if (e.relatedTarget === null) mouse = { x: -9999, y: -9999 };
                };

                card.addEventListener("pointerdown", onCardDown);
                window.addEventListener("pointermove", onWindowMove);
                window.addEventListener("pointerup", onWindowUp);
                window.addEventListener("resize", onResize);
                document.addEventListener("pointerout", onPointerOut);

                raf = requestAnimationFrame(loop);

                return () => {
                        cancelAnimationFrame(raf);
                        card.removeEventListener("pointerdown", onCardDown);
                        window.removeEventListener("pointermove", onWindowMove);
                        window.removeEventListener("pointerup", onWindowUp);
                        window.removeEventListener("resize", onResize);
                        document.removeEventListener("pointerout", onPointerOut);
                };
        }, [anchorX, anchorY, scale, isLoggedIn, dismissed]);

	if (dismissed) return null;

        return (
                <div className={`scl-root ${className}`} style={{ "--scl-z": zIndex } as React.CSSProperties}>
                        <style>{CSS}</style>

                        <div className="scl-stage" ref={sceneRef}>
                                <canvas className="scl-rope" ref={canvasRef} />
                                <div className="scl-rail" ref={railRef} />

                                <div className="scl-card" ref={cardRef}>
                                        <div className="scl-flipper" ref={flipperRef}>
                                                {/* FRONT FACE */}
                                                <div className="scl-face scl-front">
							<button type="button" className="scl-close" onClick={() => setDismissed(true)} aria-label="Cerrar">×</button>
                                                        <div className="scl-hole" />
                                                        <div className="scl-holo" />

                                                        <div className="scl-header">
                                                                <div className="scl-brand">
                                                                        <div className="scl-brand-text">
                                                                                <b>{brand}</b>
                                                                                <small>{brandTagline}</small>
                                                                        </div>
                                                                </div>
                                                                <div className="scl-pillars">
                                                                        {pillars.map((p) => (
                                                                                <span key={p}>{p}</span>
                                                                        ))}
                                                                        <i />
                                                                </div>
                                                        </div>
							<div className="scl-status-banner">PLAZAS ABIERTAS</div>

                                                        <div className="scl-idrow">
                                                                <div className="scl-idrow-labels">
                                                                        <div>
                                                                                <span>Evento</span>
                                                                                <b>{isLoggedIn ? idNumber : "STARTCAMP 2026"}</b>
                                                                        </div>
                                                                        <div>
                                                                                <span>Lugar</span>
                                                                                <b>{isLoggedIn ? location : "MADTECH CAMPUS"}</b>
                                                                        </div>
                                                                        <div>
                                                                                <span>Fecha</span>
                                                                                <b>{isLoggedIn ? validThru : "07/08 NOVIEMBRE"}</b>
                                                                        </div>
                                                                </div>
                                                                <a className="scl-qr" href={EVENT_URL} target="_blank" rel="noopener noreferrer"><img src={neonpassQR} alt="QR de reserva de STARTCAMP en Neonpass" width="80" height="80" /></a>
                                                        </div>

                                                        {!isLoggedIn && (
                                                                <a
                                                                        className="scl-join-btn"
                                                                        href={EVENT_URL}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                >
                                                                        RESERVA PLAZA →
                                                                </a>
                                                        )}

                                                        <StartcampCountdown />
                                                        {isLoggedIn && <div className="scl-footer">Build·Ship·Iterate</div>}
                                                </div>

                                                {/* BACK FACE */}
                                                <div className="scl-face scl-back">
							<button type="button" className="scl-close" onClick={() => setDismissed(true)} aria-label="Cerrar">×</button>
                                                        <div className="scl-hole" />
                                                        <div className="scl-holo" />
                                                        <div className="scl-stripe" />

                                                        <div className="scl-idnum">
                                                                <span>NO. {isLoggedIn ? idNumber : "••••••••"}</span>
                                                                <em>{isLoggedIn ? `VALID ${validThru}` : "PASE: INVITADO"}</em>
                                                        </div>
                                                        <div className="scl-barcode" ref={barcodeRef} />

                                                        <div className="scl-backrow">
                                                                <a className="scl-qr" href={EVENT_URL} target="_blank" rel="noopener noreferrer"><img src={neonpassQR} alt="QR de reserva de STARTCAMP en Neonpass" width="80" height="80" /></a>
                                                                <div className="scl-scan">
                                                                        <b>Reserva tu plaza</b>
                                                                        Escanea el QR para inscribirte en STARTCAMP a través de Neonpass.
                                                                </div>
                                                        </div>

                                                        {isLoggedIn && (githubUrl || linkedinUrl || instagramUrl) && (
                                                                <div className="scl-connect">
                                                                        <span>Connect</span>
                                                                        <div className="scl-connect-icons">
                                                                                {githubUrl && (
                                                                                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                                                                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                                                                                </svg>
                                                                                        </a>
                                                                                )}
                                                                                {linkedinUrl && (
                                                                                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                                                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                                                                                        <rect x="2" y="9" width="4" height="12" />
                                                                                                        <circle cx="4" cy="4" r="2" />
                                                                                                </svg>
                                                                                        </a>
                                                                                )}
                                                                                {instagramUrl && (
                                                                                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                                                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                                                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                                                                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                                                                                </svg>
                                                                                        </a>
                                                                                )}
                                                                        </div>
                                                                </div>
                                                        )}

                                                        <div className="scl-sig">
                                                                <div className="scl-script">{isLoggedIn ? name : "Tu nombre"}</div>
                                                                <small>{isLoggedIn ? "Authorized Signature" : "Firma del asistente"}</small>
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                {showHint && (
                                        <div className={`scl-hint ${interacted ? "scl-hint-hidden" : ""}`}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                        <path d="M12 3v18M7 8l-4 4 4 4M17 8l4 4-4 4" />
                                                </svg>
                                                Drag to swing · Click to flip
                                        </div>
                                )}
                        </div>
                </div>
        );
}

export default StartcampLanyard;
