/**
 * GatePass passwords hide with ASCII asterisks (`********`), not the platform
 * bullet glyph from `secureTextEntry`.
 */

export function passwordDisplayValue(password: string, visible: boolean): string {
  return visible ? password : '*'.repeat(password.length);
}

/** Map a masked-field edit back to the real password string. */
export function nextPasswordFromMaskedInput(
  previous: string,
  nextVisible: string,
  visible: boolean
): string {
  if (visible) return nextVisible;
  if (nextVisible.length === 0) return '';

  // Only asterisks → length change (backspace / delete).
  if (/^\*+$/.test(nextVisible)) {
    return previous.slice(0, nextVisible.length);
  }

  // No asterisks → full replace (paste or select-all typing).
  if (!nextVisible.includes('*')) {
    return nextVisible;
  }

  // Leading asterisks keep the previous prefix; the rest is newly typed.
  const starCount = /^\*+/.exec(nextVisible)?.[0].length ?? 0;
  return previous.slice(0, starCount) + nextVisible.slice(starCount);
}
