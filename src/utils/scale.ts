// Accessibility scaling utilities
// Requirements: 11.2, 11.3

/** Minimum touch target size in points (44×44 per Apple HIG / Android guidelines). */
export const MIN_TOUCH_TARGET = 44;

/**
 * Returns a font size scaled relative to a base scale factor.
 * In a React Native environment, pass PixelRatio.getFontScale() as the scale.
 */
export function sp(size: number, fontScale = 1): number {
  return Math.round(size * fontScale);
}
