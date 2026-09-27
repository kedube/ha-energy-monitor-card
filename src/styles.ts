import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
    height: 100%;
    --emc-text: var(--primary-text-color, #e6e8eb);
    --emc-muted: var(--secondary-text-color, #9aa1ab);
    --emc-bg: var(--ha-card-background, var(--card-background-color, #1c1d21));
    --emc-track: var(--secondary-text-color, #9aa1ab);
    --emc-line: var(--divider-color, rgba(127, 127, 127, 0.25));
  }

  ha-card {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 10px 12px 12px;
    overflow: hidden;
    position: relative;
  }

  ha-card.transparent {
    background: none;
    box-shadow: none;
    border: none;
  }

  /* ── Header ─────────────────────────────────────────────── */

  .header {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    min-height: 28px;
  }

  .title {
    flex: 1 1 auto;
    min-width: 6em;
    font-size: 15px;
    font-weight: 500;
    color: var(--emc-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 3px 11px 3px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 32%, transparent);
    transition: color 0.6s, background 0.6s, border-color 0.6s;
  }

  .pill .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--tone);
    flex: none;
  }

  .pill.alert .dot {
    animation: ping 1.3s ease-out infinite;
  }

  .pill .dur {
    font-weight: 500;
    opacity: 0.8;
    font-variant-numeric: tabular-nums;
  }

  .tone-grid { --tone: var(--emc-grid); }
  .tone-generator { --tone: var(--emc-generator); }
  .tone-outage { --tone: var(--emc-outage); }
  .tone-battery { --tone: var(--emc-battery); }
  .tone-solar { --tone: var(--emc-solar); }
  .tone-neutral { --tone: var(--emc-muted); }

  .banner {
    position: absolute;
    inset: -2px 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 15%, var(--emc-bg));
    border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
    animation: banner-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
    pointer-events: none;
  }

  .banner .what {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .banner .when {
    flex: none;
    margin-left: auto;
    font-weight: 500;
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
  }

  .banner svg {
    width: 16px;
    height: 16px;
    flex: none;
  }

  .banner svg path {
    fill: currentColor;
  }

  /* ── Stage ──────────────────────────────────────────────── */

  .stage {
    position: relative;
    flex: 1 1 auto;
    width: 100%;
    min-height: 140px;
    max-height: 440px;
  }

  svg.diagram {
    position: absolute;
    inset: 0;
    overflow: visible;
  }

  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .overlay > * {
    pointer-events: auto;
  }

  /* Wires */

  .tracks {
    opacity: 0.22;
  }

  .tracks path,
  .live path,
  .devlive path {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .tracks path {
    stroke: var(--emc-track);
    stroke-width: calc(2px * var(--s));
  }

  .live path {
    stroke: var(--c);
    stroke-width: calc(2.4px * var(--s));
    opacity: 0.5;
    transition: stroke 0.8s ease, opacity 0.4s ease;
  }

  .live path.dead {
    stroke: var(--emc-outage);
    stroke-dasharray: calc(3px * var(--s)) calc(5px * var(--s));
    opacity: 0.75;
  }

  .devlive {
    opacity: 0.4;
  }

  .devlive path {
    stroke: var(--c);
    stroke-width: calc(2.2px * var(--s));
    transition: stroke 0.8s ease;
  }

  .fault {
    color: var(--emc-outage);
    animation: fault 1.6s steps(1) infinite;
  }

  .fault path {
    fill: currentColor;
    stroke: var(--emc-bg);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }

  /* Nodes */

  .node {
    cursor: pointer;
    color: var(--emc-muted);
    transition: color 0.5s ease;
  }

  .node:focus-visible {
    outline: none;
  }

  .node:focus-visible .disc {
    stroke: var(--emc-text);
    stroke-width: 2;
  }

  .node .disc {
    fill: var(--emc-bg);
  }

  .node .ring {
    fill: none;
    stroke: var(--c);
    stroke-width: calc(2.2px * var(--s));
    opacity: 0.32;
    transition: opacity 0.5s ease, stroke 0.6s ease;
  }

  .node .glow {
    opacity: 0;
    transition: opacity 0.8s ease;
  }

  .node.active,
  .node.running,
  .node.starting {
    color: var(--c);
  }

  .node.active .ring,
  .node.running .ring {
    opacity: 1;
  }

  .node.idle .ring {
    opacity: 0.55;
  }

  .node.active .glow {
    opacity: 1;
  }

  .node.down {
    color: var(--emc-outage);
  }

  .node.down .ring {
    stroke: var(--emc-outage);
    opacity: 0.9;
    stroke-dasharray: calc(4px * var(--s)) calc(3px * var(--s));
    animation: spin 9s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .node.starting .ring {
    opacity: 0.95;
    stroke-dasharray: calc(6px * var(--s)) calc(4px * var(--s));
    animation: spin 1.1s linear infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .gauge-track {
    fill: none;
    stroke: var(--emc-track);
    stroke-opacity: 0.15;
  }

  .gauge {
    fill: none;
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke-dasharray 0.9s ease, stroke 0.6s ease;
  }

  .gauge.hot {
    stroke: var(--emc-outage);
  }

  .glyph path,
  .glyph rect,
  .glyph circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .glyph .thin {
    stroke-width: 1.1;
  }

  .glyph .solid,
  .glyph .bolt-fill,
  .glyph .level {
    fill: currentColor;
    stroke: none;
  }

  .glyph .level {
    opacity: 0.85;
  }

  .glyph .charge {
    stroke: var(--emc-bg);
    stroke-width: 1.4;
  }

  .glyph .slash {
    stroke-width: 1.8;
  }

  .glyph .slash-halo {
    stroke: var(--emc-bg);
    stroke-width: 4.2;
  }

  .rumble {
    animation: rumble 0.16s linear infinite;
  }

  .starting .rumble {
    animation-duration: 0.07s;
  }

  .glyph .puff {
    fill: currentColor;
    stroke: none;
    opacity: 0;
    animation: puff 1.8s ease-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .glyph .puff.p2 { animation-delay: 0.6s; }
  .glyph .puff.p3 { animation-delay: 1.2s; }

  /* Home */

  .home {
    color: var(--emc-text);
  }

  .home .ring-base {
    fill: none;
    stroke: var(--emc-track);
    stroke-opacity: 0.18;
  }

  .home .seg {
    fill: none;
    stroke-linecap: round;
    transition: stroke 0.8s ease;
  }

  .home.dark .ring-base {
    stroke: var(--emc-outage);
    stroke-opacity: 0.8;
    stroke-dasharray: calc(4px * var(--s)) calc(4px * var(--s));
  }

  .home.dark .glyph {
    opacity: 0.3;
  }

  .home .flicker {
    animation: flicker 1.5s steps(1) both;
  }

  .home-value {
    fill: var(--emc-text);
    font-weight: 700;
    text-anchor: middle;
    font-variant-numeric: tabular-nums;
  }

  .home-value .u {
    font-weight: 500;
    fill: var(--emc-muted);
  }

  .home-sub {
    fill: var(--emc-muted);
    text-anchor: middle;
    font-variant-numeric: tabular-nums;
  }

  /* Transfer switch */

  .ats-box {
    fill: var(--emc-bg);
    stroke: var(--emc-muted);
    stroke-opacity: 0.4;
  }

  .ats .contact {
    fill: var(--emc-bg);
    stroke: var(--emc-muted);
    stroke-opacity: 0.7;
    transition: fill 0.5s ease, stroke 0.5s ease;
  }

  .ats .contact.on {
    fill: var(--c);
    stroke: var(--c);
    stroke-opacity: 1;
  }

  .ats .blade {
    transition: transform 1s cubic-bezier(0.55, -0.4, 0.3, 1.5);
  }

  .ats .blade line {
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke 0.6s ease;
  }

  .ats .pivot {
    fill: var(--c);
    transition: fill 0.6s ease;
  }

  .ats-label {
    fill: var(--emc-muted);
    text-anchor: middle;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  .spark {
    fill: none;
    stroke: var(--c);
    opacity: 0;
    animation: spark 0.75s ease-out 0.6s both;
    transform-box: fill-box;
    transform-origin: center;
  }

  /* Labels */

  .label {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: calc(1px * var(--s));
    line-height: 1.12;
    white-space: nowrap;
    cursor: pointer;
    color: var(--emc-text);
  }

  .label.mid {
    transform: translateY(-50%);
  }

  .label.right {
    align-items: flex-end;
    transform: translateX(-100%);
  }

  .label .name {
    display: flex;
    align-items: center;
    gap: calc(6px * var(--s));
    font-size: calc(10px * var(--s));
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--emc-muted);
  }

  .label .value {
    font-size: calc(17px * var(--s));
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }

  .label .value .unit {
    margin-left: 0.15em;
    font-size: 0.66em;
    font-weight: 500;
    color: var(--emc-muted);
  }

  .label .value .tag {
    margin-left: 0.4em;
    font-size: 0.6em;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--c);
  }

  .label .value.quiet {
    font-size: calc(14px * var(--s));
    font-weight: 600;
    color: var(--emc-muted);
  }

  .label .value.alarm {
    color: var(--emc-outage);
  }

  .label .value.accent {
    color: var(--c);
  }

  .label .detail {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.7em;
    font-size: calc(11px * var(--s));
    color: var(--emc-muted);
    font-variant-numeric: tabular-nums;
  }

  .label.right .detail {
    justify-content: flex-end;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 5px;
    border-radius: 5px;
    font-size: calc(9.5px * var(--s));
    letter-spacing: 0.02em;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 14%, transparent);
  }

  .chip.low {
    --c: var(--emc-outage);
  }

  .warnmark {
    color: var(--warning-color, #ffa600);
  }

  /* Devices */

  .device {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
    cursor: pointer;
    text-align: center;
  }

  .dev-icon {
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--emc-muted);
    transition: color 0.5s ease;
  }

  .dev-icon ha-icon {
    --mdc-icon-size: calc(17px * var(--s));
    display: flex;
  }

  .device.active .dev-icon {
    color: var(--c);
  }

  .dev-value {
    margin-top: calc(5px * var(--s));
    font-size: calc(12px * var(--s));
    font-weight: 700;
    color: var(--emc-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .dev-value .unit {
    font-size: 0.8em;
    font-weight: 500;
    color: var(--emc-muted);
    margin-left: 1px;
  }

  .device:not(.active) .dev-value {
    font-weight: 500;
    color: var(--emc-muted);
  }

  .device.high .dev-value {
    color: var(--c);
  }

  .dev-name,
  .dev-amps {
    font-size: calc(10px * var(--s));
    color: var(--emc-muted);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dev-ring {
    fill: var(--emc-bg);
    stroke: var(--emc-track);
    stroke-opacity: 0.3;
  }

  .dev-share {
    fill: none;
    stroke: var(--c);
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease, stroke 0.8s ease;
  }

  .dev-glow {
    opacity: 0;
    transition: opacity 0.6s ease;
  }

  .dev-glow.on {
    opacity: 1;
  }

  .more {
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 10px;
    color: var(--emc-muted);
  }

  /* ── Trend ──────────────────────────────────────────────── */

  .trend {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--emc-line);
  }

  .trend-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    font-size: 11px;
    color: var(--emc-muted);
  }

  .trend-head .grow {
    flex: 1 1 auto;
  }

  .trend-head b {
    color: var(--emc-text);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .trend-plot {
    position: relative;
    height: 40px;
    margin-top: 6px;
    touch-action: pan-y;
  }

  .trend-plot svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .trend-line {
    fill: none;
    stroke-width: 1.5;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .trend-base {
    stroke: var(--emc-track);
    stroke-opacity: 0.25;
    vector-effect: non-scaling-stroke;
  }

  .trend-dark {
    fill: var(--emc-outage);
    opacity: 0.22;
  }

  .trend-cursor {
    stroke: var(--emc-text);
    stroke-opacity: 0.45;
    vector-effect: non-scaling-stroke;
  }

  .trend-tip {
    position: absolute;
    top: -6px;
    transform: translate(-50%, -100%);
    padding: 3px 7px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    color: var(--emc-text);
    background: var(--emc-bg);
    border: 1px solid var(--emc-line);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    z-index: 3;
  }

  .trend-tip i,
  .legend i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 4px;
    border-radius: 2px;
    background: var(--c);
    vertical-align: -1px;
  }

  .trend-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
    color: var(--emc-muted);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    margin-top: 5px;
    font-size: 10.5px;
    color: var(--emc-muted);
  }

  .warn {
    margin-top: 6px;
    font-size: 11px;
    color: var(--warning-color, #ffa600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Motion ─────────────────────────────────────────────── */

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes ping {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tone) 70%, transparent); }
    100% { box-shadow: 0 0 0 7px transparent; }
  }

  @keyframes banner-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }

  @keyframes rumble {
    0% { transform: translate(0, 0); }
    25% { transform: translate(0.28px, -0.22px); }
    50% { transform: translate(-0.22px, 0.2px); }
    75% { transform: translate(0.2px, 0.18px); }
    100% { transform: translate(0, 0); }
  }

  @keyframes puff {
    0% { opacity: 0.55; transform: translate(0, 0) scale(0.6); }
    100% { opacity: 0; transform: translate(2.6px, -7px) scale(1.9); }
  }

  @keyframes spark {
    0% { opacity: 0; transform: scale(0.3); }
    15% { opacity: 1; }
    100% { opacity: 0; transform: scale(2.8); }
  }

  @keyframes flicker {
    0% { opacity: 1; }
    8% { opacity: 0.15; }
    14% { opacity: 1; }
    22% { opacity: 0.1; }
    34% { opacity: 0.8; }
    42% { opacity: 0.12; }
    60% { opacity: 0.45; }
    100% { opacity: 1; }
  }

  @keyframes fault {
    0% { opacity: 1; }
    6% { opacity: 0.2; }
    12% { opacity: 1; }
    50% { opacity: 1; }
    54% { opacity: 0.3; }
    58% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rumble,
    .glyph .puff,
    .node .ring,
    .pill .dot,
    .home .flicker,
    .fault,
    .spark,
    .banner {
      animation: none !important;
    }
    .ats .blade {
      transition: none;
    }
  }
`;
