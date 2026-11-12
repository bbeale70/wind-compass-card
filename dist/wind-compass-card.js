/**
 * Wind Compass Card for Home Assistant  (v1.0.0)
 *
 * An aircraft-style compass rose. An amber index on the bezel marks where the
 * wind is coming FROM. Current wind speed sits large in the centre, with
 * today's top gust smaller beneath it.
 *
 * Install with the Home Assistant Marketplace (HACS), or manually:
 *   1. Copy this file to  /config/www/wind-compass-card.js
 *   2. Settings > Dashboards > (three dots) > Resources > Add resource
 *        URL:  /local/wind-compass-card.js?v=1.0.0     Type: JavaScript module
 *   3. Add the "Wind Compass" card from the dashboard card picker.
 *
 * Provided as is, without warranty or support. MIT License.
 *
 * YAML (the card editor writes this for you)
 *   type: custom:wind-compass-card
 *   direction_entity: sensor.your_wind_direction   # degrees 0-360, or text like NW
 *   speed_entity: sensor.your_wind_speed
 *   gust_entity: sensor.your_max_gust_today
 *   name: Wind                                     # optional title
 *
 * Optional colour overrides (theme or card-mod):
 *   --wind-compass-face, --wind-compass-bezel, --wind-compass-marks,
 *   --wind-compass-dim, --wind-compass-pointer
 *
 * No external dependencies. Nothing is loaded from the internet.
 */

const VERSION = "1.0.0";
const TAG = "wind-compass-card";

const CARDINAL_DEGREES = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

// Rose labels the way a heading indicator shows them: cardinals as letters,
// every other 30 degrees as the heading with the last zero dropped.
const ROSE_LABELS = {
  0: "N", 30: "3", 60: "6", 90: "E", 120: "12", 150: "15",
  180: "S", 210: "21", 240: "24", 270: "W", 300: "30", 330: "33",
};

const FIELD_LABELS = {
  direction_entity: "Wind direction sensor",
  speed_entity: "Wind speed sensor",
  gust_entity: "Top gust today sensor",
  name: "Title (optional)",
};

const FIELD_HELP = {
  direction_entity:
    "Degrees (0-360) or compass text such as NW. The pointer marks where the wind comes from.",
  gust_entity: "Your existing daily maximum gust sensor.",
};

const UNAVAILABLE = new Set(["unavailable", "unknown", "none", ""]);

function toNumber(stateObj) {
  if (!stateObj || UNAVAILABLE.has(String(stateObj.state).toLowerCase())) return null;
  const n = Number.parseFloat(stateObj.state);
  return Number.isFinite(n) ? n : null;
}

function toBearing(stateObj) {
  if (!stateObj || UNAVAILABLE.has(String(stateObj.state).toLowerCase())) return null;
  const n = Number.parseFloat(stateObj.state);
  if (Number.isFinite(n)) return ((n % 360) + 360) % 360;
  const key = String(stateObj.state).trim().toUpperCase();
  return key in CARDINAL_DEGREES ? CARDINAL_DEGREES[key] : null;
}

function cardinalName(bearing) {
  const names = Object.keys(CARDINAL_DEGREES);
  return names[Math.round(bearing / 22.5) % 16];
}

function unitOf(stateObj) {
  return (stateObj && stateObj.attributes && stateObj.attributes.unit_of_measurement) || "";
}

function buildRose() {
  let out = "";
  for (let a = 0; a < 360; a += 5) {
    const major = a % 30 === 0;
    const mid = a % 10 === 0;
    const inner = major ? 86 : mid ? 91 : 95;
    const cls = major ? "t3" : mid ? "t2" : "t1";
    out += `<line class="${cls}" x1="0" y1="${-inner}" x2="0" y2="-100" transform="rotate(${a})"/>`;
  }
  for (const [angle, label] of Object.entries(ROSE_LABELS)) {
    const cls = Number(angle) % 90 === 0 ? "cardinal" : "num";
    out += `<text class="${cls}" dy="0.36em" transform="rotate(${angle}) translate(0 -73)">${label}</text>`;
  }
  return out;
}

const STYLE = `
  :host {
    display: block;
    height: 100%;
    --_face: var(--wind-compass-face, #0a0a0a);
    --_bezel: var(--wind-compass-bezel, #2c2e32);
    --_marks: var(--wind-compass-marks, #f3f2ec);
    --_dim: var(--wind-compass-dim, #9c9d98);
    --_pointer: var(--wind-compass-pointer, #ff9f1a);
  }
  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .wrap {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 16px;
  }
  svg {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
    max-width: 440px;
    aspect-ratio: 1;
    font-family: "DIN Alternate", "Bahnschrift", "Roboto Condensed",
      "sans-serif-condensed", "Arial Narrow", Roboto, system-ui, sans-serif;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .bezel { fill: var(--_bezel); }
  .face { fill: var(--_face); }
  .lip { fill: none; stroke: var(--_marks); stroke-width: 0.6; opacity: 0.18; }

  line { stroke: var(--_marks); stroke-linecap: butt; }
  .t1 { stroke-width: 1; opacity: 0.55; }
  .t2 { stroke-width: 1.5; opacity: 0.9; }
  .t3 { stroke-width: 2.4; }

  text {
    fill: var(--_marks);
    text-anchor: middle;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .num { font-size: 13px; }
  .cardinal { font-size: 16px; font-weight: 700; }
  .speed-value { font-size: 50px; font-weight: 700; }
  .unit { font-size: 10px; letter-spacing: 2px; fill: var(--_dim); }
  .gust-label { font-size: 7.5px; letter-spacing: 1.4px; fill: var(--_dim); }
  .gust-line { font-size: 21px; }
  .gust-unit { font-size: 0.45em; letter-spacing: 1px; fill: var(--_dim); }
  .empty { fill: var(--_dim); }

  .pointer {
    transform-box: view-box;
    transform-origin: 0px 0px;
    opacity: 0;
  }
  .pointer path { fill: var(--_pointer); }
  .pointer.on { opacity: 1; }
  .pointer.on.calm { opacity: 0.35; }
  .pointer.animate {
    transition: transform 0.9s cubic-bezier(0.3, 0.1, 0.2, 1), opacity 0.4s linear;
  }
  @media (prefers-reduced-motion: reduce) {
    .pointer.animate { transition: none; }
  }

  .hit { cursor: pointer; outline: none; }
  .hitbox { fill: transparent; stroke: none; }
  .hitring { fill: none; stroke: transparent; stroke-width: 48; pointer-events: stroke; }
  .focus { fill: none; stroke: var(--_pointer); stroke-width: 1.2; opacity: 0; }
  .hit:focus-visible .focus { opacity: 1; }

  .hint {
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
    color: var(--secondary-text-color);
  }
  .hint[hidden] { display: none; }
`;

const TEMPLATE = `
  <style>${STYLE}</style>
  <ha-card>
    <div class="wrap">
      <svg viewBox="-125 -125 250 250" role="group">
        <title></title>
        <circle class="bezel" r="124"/>
        <circle class="face" r="118"/>
        <circle class="lip" r="118"/>

        <g class="hit" data-target="direction_entity" tabindex="0" role="button" aria-label="Wind direction details">
          <circle class="hitring" r="93"/>
          <circle class="focus" r="121"/>
          ${buildRose()}
        </g>

        <g class="pointer"><path d="M0 -102 L8.5 -116 L-8.5 -116 Z"/></g>

        <g class="hit" data-target="speed_entity" tabindex="0" role="button" aria-label="Wind speed details">
          <rect class="hitbox" x="-56" y="-48" width="112" height="66"/>
          <rect class="focus" x="-56" y="-48" width="112" height="66" rx="6"/>
          <text class="speed-value" y="-6">&#8211;</text>
          <text class="unit speed-unit" y="12"></text>
        </g>

        <g class="hit" data-target="gust_entity" tabindex="0" role="button" aria-label="Top gust today details">
          <rect class="hitbox" x="-46" y="21" width="92" height="38"/>
          <rect class="focus" x="-46" y="21" width="92" height="38" rx="6"/>
          <text class="gust-label" y="31">TOP GUST TODAY</text>
          <text class="gust-line" y="52"><tspan class="gust-value">&#8211;</tspan><tspan class="gust-unit" dx="3"></tspan></text>
        </g>
      </svg>
      <div class="hint" hidden></div>
    </div>
  </ha-card>
`;

class WindCompassCard extends HTMLElement {
  static getConfigForm() {
    const sensor = { entity: { domain: ["sensor", "input_number"] } };
    return {
      schema: [
        { name: "direction_entity", required: true, selector: sensor },
        { name: "speed_entity", required: true, selector: sensor },
        { name: "gust_entity", required: true, selector: sensor },
        { name: "name", selector: { text: {} } },
      ],
      computeLabel: (field) => FIELD_LABELS[field.name] || field.name,
      computeHelper: (field) => FIELD_HELP[field.name],
    };
  }

  // Best-guess defaults so the card picker preview shows live data.
  static getStubConfig(hass) {
    const ids = Object.keys((hass && hass.states) || {}).filter((id) => id.startsWith("sensor."));
    const deviceClass = (id) => hass.states[id].attributes.device_class;
    const first = (...tests) => {
      for (const test of tests) {
        const hit = ids.find(test);
        if (hit) return hit;
      }
      return "";
    };
    return {
      direction_entity: first(
        (id) => deviceClass(id) === "wind_direction",
        (id) => /wind_?(dir|bearing)/.test(id)
      ),
      speed_entity: first(
        (id) => deviceClass(id) === "wind_speed" && !/gust/.test(id),
        (id) => /wind_?speed/.test(id) && !/gust/.test(id)
      ),
      gust_entity: first(
        (id) => /gust/.test(id) && /(max|peak|daily|today|top|high)/.test(id),
        (id) => /gust/.test(id)
      ),
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._rotation = null;
    this._last = {};
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Wind Compass: configuration is missing.");
    }
    this._config = { ...config };
    this._last = {};
    this._build();
    this._els.card.header = this._config.name || undefined;
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  connectedCallback() {
    // Text fitting needs layout, so run one more pass once the card is on screen.
    this._last = {};
    requestAnimationFrame(() => this._update());
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return { columns: 6, rows: 5, min_columns: 4, min_rows: 3 };
  }

  _build() {
    if (this._built) return;
    const root = this.shadowRoot;
    root.innerHTML = TEMPLATE;
    const q = (sel) => root.querySelector(sel);
    this._els = {
      card: q("ha-card"),
      title: q("svg > title"),
      pointer: q(".pointer"),
      speedValue: q(".speed-value"),
      speedUnit: q(".speed-unit"),
      gustLine: q(".gust-line"),
      gustValue: q(".gust-value"),
      gustUnit: q(".gust-unit"),
      hint: q(".hint"),
    };
    root.querySelectorAll(".hit").forEach((group) => {
      const open = () => this._moreInfo(this._config[group.dataset.target]);
      group.addEventListener("click", open);
      group.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          open();
        }
      });
    });
    this._built = true;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  _format(stateObj) {
    const n = toNumber(stateObj);
    if (n === null) return "\u2013";
    const registry = this._hass.entities && this._hass.entities[stateObj.entity_id];
    let precision = registry ? registry.display_precision : undefined;
    if (precision === undefined || precision === null) {
      const decimals = String(stateObj.state).split(".")[1];
      precision = decimals ? 1 : 0;
    }
    precision = Math.max(0, Math.min(2, precision));
    try {
      const language = this._hass.locale && this._hass.locale.language;
      return new Intl.NumberFormat(language, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(n);
    } catch (err) {
      return n.toFixed(precision);
    }
  }

  // Shrink a text element so it never spills past the space inside the rose.
  _fit(el, baseSize, maxWidth) {
    el.style.fontSize = `${baseSize}px`;
    let width = 0;
    try {
      width = el.getComputedTextLength();
    } catch (err) {
      width = 0;
    }
    if (width > maxWidth) {
      el.style.fontSize = `${((baseSize * maxWidth) / width).toFixed(2)}px`;
    }
  }

  _setBearing(bearing, calm) {
    const p = this._els.pointer;
    if (bearing === null) {
      p.classList.remove("on");
      return;
    }
    if (this._rotation === null) {
      this._rotation = bearing;
    } else {
      // Turn the short way round (350 -> 10 moves 20 degrees, not 340).
      const delta = ((bearing - this._rotation) % 360 + 540) % 360 - 180;
      this._rotation += delta;
    }
    p.style.transform = `rotate(${this._rotation}deg)`;
    p.classList.add("on");
    p.classList.toggle("calm", calm);
    if (!p.classList.contains("animate")) {
      requestAnimationFrame(() => p.classList.add("animate"));
    }
  }

  _update() {
    if (!this._built || !this._hass || !this._config) return;
    const cfg = this._config;
    const states = this._hass.states;
    const dir = states[cfg.direction_entity];
    const spd = states[cfg.speed_entity];
    const gust = states[cfg.gust_entity];
    if (this._last.dir === dir && this._last.spd === spd && this._last.gust === gust && this._last.done) {
      return;
    }
    this._last = { dir, spd, gust, done: true };

    const e = this._els;
    const bearing = toBearing(dir);
    const speed = toNumber(spd);
    this._setBearing(bearing, speed === 0);

    const speedText = this._format(spd);
    const speedUnit = unitOf(spd);
    e.speedValue.textContent = speedText;
    e.speedValue.classList.toggle("empty", speed === null);
    e.speedUnit.textContent = speedUnit.toUpperCase();
    this._fit(e.speedValue, 50, 102);

    const gustText = this._format(gust);
    const gustUnit = unitOf(gust);
    e.gustValue.textContent = gustText;
    e.gustValue.classList.toggle("empty", toNumber(gust) === null);
    e.gustUnit.textContent = gustUnit.toUpperCase();
    this._fit(e.gustLine, 21, 62);

    const fromText =
      bearing === null ? "direction unknown" : `from ${Math.round(bearing)} degrees (${cardinalName(bearing)})`;
    e.title.textContent =
      `Wind ${fromText} at ${speedText} ${speedUnit}. Top gust today ${gustText} ${gustUnit}.`;

    const problems = [];
    for (const key of ["direction_entity", "speed_entity", "gust_entity"]) {
      const id = cfg[key];
      if (!id) problems.push(`Choose a ${FIELD_LABELS[key].toLowerCase()} in the card editor.`);
      else if (!states[id]) problems.push(`${id} was not found. Check the entity ID in the card editor.`);
    }
    e.hint.hidden = problems.length === 0;
    e.hint.textContent = problems.join(" ");
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, WindCompassCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === TAG)) {
  window.customCards.push({
    type: TAG,
    name: "Wind Compass",
    description:
      "Aircraft-style compass showing wind direction, current speed and today's top gust.",
    preview: true,
  });
}

console.info(`%c WIND-COMPASS-CARD %c v${VERSION} `, "background:#0a0a0a;color:#ff9f1a;font-weight:700", "background:#2c2e32;color:#f3f2ec");
