import { svg, nothing, type SVGTemplateResult } from "lit";

// Glyphs are drawn on a 24×24 grid and placed with `placeGlyph`. They stroke
// with currentColor so node state (idle, active, outage) is purely CSS.

export function placeGlyph(x: number, y: number, size: number, body: SVGTemplateResult, cls = "glyph") {
  const k = size / 24;
  return svg`<g class=${cls} transform="translate(${x - size / 2} ${y - size / 2}) scale(${k})">${body}</g>`;
}

export const pylonGlyph = (down: boolean) => svg`
  <path d="M8 22 L11 3.5 H13 L16 22" />
  <path d="M5 7.5 H19 M6.6 12 H17.4" />
  <path d="M10.35 7.5 L14.38 12 M13.65 7.5 L9.62 12 M9.62 12 L15.27 17.5 M14.38 12 L8.73 17.5 M8.73 17.5 H15.27" class="thin" />
  <path d="M5 7.5 v2.2 M19 7.5 v2.2 M6.6 12 v2.2 M17.4 12 v2.2" class="thin" />
  ${down ? svg`<path class="slash-halo" d="M4 4 L20 20" /><path class="slash" d="M4 4 L20 20" />` : nothing}
`;

export const generatorGlyph = (running: boolean) => svg`
  <g class=${running ? "rumble" : ""}>
    <rect x="2.8" y="8.2" width="18.4" height="10.8" rx="2.2" />
    <path d="M5.8 11.4 H11 M5.8 13.6 H11 M5.8 15.8 H11" class="thin" />
    <path d="M16.1 10.4 L14 14 H16.3 L14.9 17.3" class="bolt" />
    <path d="M17.2 8.2 V5.6 H19.8" />
    <path d="M6 19 V21 M18 19 V21" />
  </g>
  ${
    running
      ? svg`<g class="puffs">
          <circle class="puff" cx="20.2" cy="5.3" r="1.1" />
          <circle class="puff p2" cx="20.2" cy="5.3" r="1.1" />
          <circle class="puff p3" cx="20.2" cy="5.3" r="1.1" />
        </g>`
      : nothing
  }
`;

export const homeGlyph = svg`
  <path d="M2.8 11.4 L12 3.9 L21.2 11.4" />
  <path d="M5.6 9.4 V20.3 H18.4 V9.4" />
  <path d="M16.3 6.6 V4.2 H18.3 V8.3" class="thin" />
  <path d="M13.3 9.9 L9.7 15.1 H12.3 L10.9 19.3 L14.7 13.9 H12.1 Z" class="bolt-fill" />
`;

export const solarGlyph = svg`
  <circle cx="18.2" cy="5.2" r="2.2" />
  <path d="M18.2 1.2 V1.9 M22.2 5.2 H21.5 M21 2.4 L20.5 2.9 M15.4 2.4 L15.9 2.9 M21 8 L20.5 7.5" class="thin" />
  <path d="M2.6 20.6 L5.6 10.8 H16.4 L13.4 20.6 Z" />
  <path d="M4.1 15.7 H14.9 M9.6 10.8 L7.4 20.6 M13 10.8 L10.8 20.6" class="thin" />
`;

export function batteryGlyph(soc: number | null, charging: boolean) {
  const level = soc === null ? 0 : Math.min(100, Math.max(0, soc)) / 100;
  const inner = 13.4;
  const fillH = inner * level;
  return svg`
    <rect x="7" y="4.6" width="10" height="17" rx="2" />
    <rect x="10" y="2.4" width="4" height="2.2" rx="0.8" class="solid" />
    ${fillH > 0.2 ? svg`<rect class="level" x="8.8" y=${6.4 + inner - fillH} width="6.4" height=${fillH} rx="1" />` : nothing}
    ${charging ? svg`<path d="M12.9 8.8 L10.6 13.2 H13.2 L11.3 17.6" class="charge" />` : nothing}
  `;
}

/** Small zig-zag spark drawn where the utility line has failed. */
export const faultGlyph = svg`
  <path d="M13.5 2 L7 13 H11.5 L9.5 22 L17 10 H12.5 Z" />
`;
