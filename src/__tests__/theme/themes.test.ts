import { lightTheme, darkTheme, SemanticColors } from '../../theme/themes';

describe('themes', () => {
  it('light and dark expose the same semantic color keys', () => {
    const lightKeys = Object.keys(lightTheme.colors).sort();
    const darkKeys = Object.keys(darkTheme.colors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('flags dark theme correctly', () => {
    expect(lightTheme.isDark).toBe(false);
    expect(darkTheme.isDark).toBe(true);
  });

  it('has distinct backgrounds per theme', () => {
    expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
  });

  it('defines every semantic color as a non-empty string', () => {
    for (const theme of [lightTheme, darkTheme]) {
      (Object.keys(theme.colors) as (keyof SemanticColors)[]).forEach(key => {
        expect(typeof theme.colors[key]).toBe('string');
        expect(theme.colors[key].length).toBeGreaterThan(0);
      });
    }
  });

  it('provides gradient stops for headers', () => {
    expect(Array.isArray(lightTheme.gradients.primary)).toBe(true);
    expect(lightTheme.gradients.primary.length).toBeGreaterThanOrEqual(2);
    expect(darkTheme.gradients.primary.length).toBeGreaterThanOrEqual(2);
  });
});
