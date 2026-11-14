import QRCode from 'qrcode';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type BrandedQrOptions = {
  /** Rendered width/height in px, including the quiet zone and corner frame. */
  size: number;
  /** Error correction. Defaults to `H` with a logo (it must survive the cleared centre), else `M`. */
  ecl?: QrErrorCorrection;
  /** Diameter of the centre logo badge as a fraction of the code's width; `0` for no logo. */
  logoRatio?: number;
  /** Draw the four corner brackets around the code. */
  showFrame?: boolean;
  /** Device pixels per unit of `size` (`PixelRatio.get()`), so modules land on whole pixels. */
  pixelRatio?: number;
};

export type BrandedQrGeometry = {
  size: number;
  /** One module's size in px. */
  cell: number;
  /** Filled path of the data modules: rounded dots joined into rounded lines. */
  dataPath: string;
  /** Stroked outer rings of the three finder patterns. */
  finderRings: { x: number; y: number; size: number; radius: number }[];
  /** Filled centres of the three finder patterns. */
  finderEyes: { x: number; y: number; size: number; radius: number }[];
  /** Stroked corner brackets, or `null` without a frame. */
  framePath: string | null;
  frameStrokeWidth: number;
  /** Centre badge the logo sits on, or `null` without a logo. */
  logo: { cx: number; cy: number; radius: number } | null;
};

/** Modules of empty space around the code; the corner frame sits in the outermost one. */
const MARGIN = 3;
const FINDER = 7;
/** Data dot diameter per module: a little under 1 so neighbouring lines read as separate. */
const DOT = 0.8;
/** Empty space kept between the logo badge and the nearest module, in modules. */
const LOGO_GAP = 0.6;
/** Largest centre badge that stays comfortably inside error correction level H (~30%). */
const MAX_LOGO_RATIO = 0.3;
const FRAME_ARM = 2.6;
const FRAME_STROKE = 0.9;
const FRAME_RADIUS = 1;

const round = (value: number) => Math.round(value * 100) / 100;

function isInFinder(row: number, col: number, count: number): boolean {
  const nearTop = row < FINDER;
  const nearLeft = col < FINDER;
  const nearRight = col >= count - FINDER;
  const nearBottom = row >= count - FINDER;
  return (nearTop && nearLeft) || (nearTop && nearRight) || (nearBottom && nearLeft);
}

/** Clockwise circle, so every subpath of the data path winds the same way and unions cleanly. */
function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M${round(cx - r)} ${round(cy)}` +
    `a${round(r)} ${round(r)} 0 1 1 ${round(2 * r)} 0` +
    `a${round(r)} ${round(r)} 0 1 1 ${round(-2 * r)} 0Z`
  );
}

/** Clockwise rectangle. */
function rectPath(x: number, y: number, width: number, height: number): string {
  return `M${round(x)} ${round(y)}h${round(width)}v${round(height)}h${round(-width)}Z`;
}

/** Brackets drawn just inside the box `[origin, origin + span]`. */
function framePathFor(origin: number, span: number, cell: number): string {
  const inset = (FRAME_STROKE / 2) * cell;
  const arm = FRAME_ARM * cell;
  const r = FRAME_RADIUS * cell;
  const near = origin + inset;
  const far = origin + span - inset;

  const corner = (x: number, y: number, dx: number, dy: number) =>
    `M${round(x)} ${round(y + dy * arm)}` +
    `V${round(y + dy * r)}` +
    `Q${round(x)} ${round(y)} ${round(x + dx * r)} ${round(y)}` +
    `H${round(x + dx * arm)}`;

  return [
    corner(near, near, 1, 1),
    corner(far, near, -1, 1),
    corner(near, far, 1, -1),
    corner(far, far, -1, -1),
  ].join('');
}

/**
 * Lays out a branded QR code: rounded finder eyes, dot-and-line data modules, optional corner
 * brackets and a cleared circular centre for a logo. Modules are removed around the logo rather
 * than covered, so no half-cut modules show at its edge. Throws if `value` can't be encoded.
 */
export function buildBrandedQr(value: string, options: BrandedQrOptions): BrandedQrGeometry {
  const logoRatio = Math.min(Math.max(options.logoRatio ?? 0, 0), MAX_LOGO_RATIO);
  const hasLogo = logoRatio > 0;
  const showFrame = options.showFrame ?? true;
  const ecl = options.ecl ?? (hasLogo ? 'H' : 'M');

  const { modules } = QRCode.create(value, { errorCorrectionLevel: ecl });
  const count = modules.size;
  const isDark = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < count && col < count && modules.get(row, col) === 1;

  // Modules spanning whole device pixels render with crisp edges, which scanners read far more
  // reliably than blurred fractional ones; the leftover (under a pixel per module) is split evenly
  // around the code.
  const ratio = options.pixelRatio && options.pixelRatio > 0 ? options.pixelRatio : 1;
  const snap = (value: number) => Math.floor(value * ratio) / ratio;
  const units = count + MARGIN * 2;
  const exactCell = options.size / units;
  const cell = exactCell * ratio >= 2 ? snap(exactCell) : exactCell;
  const origin = snap((options.size - cell * units) / 2);
  const offset = origin + MARGIN * cell;
  const dot = DOT * cell;

  // Centre badge, in module units from the code's top-left.
  const centre = count / 2;
  const badgeRadius = (count * logoRatio) / 2;
  const clearRadius = badgeRadius + LOGO_GAP + DOT / 2;
  const isCleared = (row: number, col: number) =>
    hasLogo && Math.hypot(row + 0.5 - centre, col + 0.5 - centre) < clearRadius;

  const isDataDot = (row: number, col: number) =>
    isDark(row, col) && !isInFinder(row, col, count) && !isCleared(row, col);

  const parts: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!isDataDot(row, col)) continue;

      const cx = offset + (col + 0.5) * cell;
      const cy = offset + (row + 0.5) * cell;
      parts.push(circlePath(cx, cy, dot / 2));
      if (isDataDot(row, col + 1)) parts.push(rectPath(cx, cy - dot / 2, cell, dot));
      if (isDataDot(row + 1, col)) parts.push(rectPath(cx - dot / 2, cy, dot, cell));
    }
  }

  const finderOrigins = [
    [0, 0],
    [0, count - FINDER],
    [count - FINDER, 0],
  ];
  const finderRings = finderOrigins.map(([row, col]) => ({
    x: offset + (col + 0.5) * cell,
    y: offset + (row + 0.5) * cell,
    size: (FINDER - 1) * cell,
    radius: 1.8 * cell,
  }));
  const finderEyes = finderOrigins.map(([row, col]) => ({
    x: offset + (col + 2) * cell,
    y: offset + (row + 2) * cell,
    size: 3 * cell,
    radius: cell,
  }));

  return {
    size: options.size,
    cell,
    dataPath: parts.join(''),
    finderRings,
    finderEyes,
    framePath: showFrame ? framePathFor(origin, cell * units, cell) : null,
    frameStrokeWidth: FRAME_STROKE * cell,
    logo: hasLogo
      ? { cx: offset + centre * cell, cy: offset + centre * cell, radius: badgeRadius * cell }
      : null,
  };
}
