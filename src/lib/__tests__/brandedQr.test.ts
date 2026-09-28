import { describe, expect, it } from '@jest/globals';
import QRCode from 'qrcode';
import { buildBrandedQr } from '@/src/lib/brandedQr';

const URI =
  'otpauth://totp/GatePass:claire@example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=GatePass';

/** Centres of the circles in the data path, i.e. one per drawn module. */
function dotCentres(dataPath: string): { x: number; y: number }[] {
  const centres: { x: number; y: number }[] = [];
  const circle = /M([\d.]+) ([\d.]+)a([\d.]+) /g;
  for (let match = circle.exec(dataPath); match; match = circle.exec(dataPath)) {
    centres.push({ x: Number(match[1]) + Number(match[3]), y: Number(match[2]) });
  }
  return centres;
}

describe('buildBrandedQr', () => {
  it('clears every module from around the logo instead of covering them', () => {
    const qr = buildBrandedQr(URI, { size: 234, logoRatio: 0.24 });
    const { logo, cell } = qr;
    expect(logo).not.toBeNull();

    const nearest = Math.min(
      ...dotCentres(qr.dataPath).map(({ x, y }) => Math.hypot(x - logo!.cx, y - logo!.cy))
    );
    // Nearest dot's edge stays clear of the badge's edge.
    expect(nearest - 0.4 * cell).toBeGreaterThan(logo!.radius);
  });

  it('uses error correction level H when there is a logo', () => {
    const withLogo = buildBrandedQr(URI, { size: 234, logoRatio: 0.24 });
    const expectedModules = QRCode.create(URI, { errorCorrectionLevel: 'H' }).modules.size;
    expect(withLogo.cell).toBe(Math.floor(234 / (expectedModules + 6)));
  });

  it('draws every dark data module when there is no logo', () => {
    const { modules } = QRCode.create('GP-483920', { errorCorrectionLevel: 'M' });
    const count = modules.size;
    let expected = 0;
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        const inFinder =
          (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);
        if (!inFinder && modules.get(row, col)) expected++;
      }
    }

    const qr = buildBrandedQr('GP-483920', { size: 200, logoRatio: 0 });
    expect(qr.logo).toBeNull();
    expect(dotCentres(qr.dataPath)).toHaveLength(expected);
  });

  it('snaps modules to whole device pixels without shrinking the code', () => {
    const qr = buildBrandedQr(URI, { size: 220, logoRatio: 0.24, pixelRatio: 3 });
    expect(Number.isInteger(Math.round(qr.cell * 3 * 1e6) / 1e6)).toBe(true);
    const count = QRCode.create(URI, { errorCorrectionLevel: 'H' }).modules.size;
    // Loses less than one device pixel per module against the exact fit.
    expect(220 / (count + 6) - qr.cell).toBeLessThan(1 / 3);
  });

  it('keeps the code, frame and finders inside the requested size', () => {
    const qr = buildBrandedQr(URI, { size: 220, logoRatio: 0.24 });
    for (const ring of qr.finderRings) {
      expect(ring.x).toBeGreaterThanOrEqual(0);
      expect(ring.x + ring.size).toBeLessThanOrEqual(220);
    }
    expect(qr.framePath).not.toBeNull();
    expect(buildBrandedQr(URI, { size: 220, showFrame: false }).framePath).toBeNull();
  });

  it('caps the logo so the code stays within error correction', () => {
    const qr = buildBrandedQr(URI, { size: 234, logoRatio: 0.9 });
    const codeWidth = qr.finderRings[1].x + qr.finderRings[1].size - qr.finderRings[0].x + qr.cell;
    expect((qr.logo!.radius * 2) / codeWidth).toBeLessThanOrEqual(0.3 + 1e-6);
  });

  it('throws for data too long to encode', () => {
    expect(() => buildBrandedQr('x'.repeat(5000), { size: 234, logoRatio: 0.24 })).toThrow();
  });
});
