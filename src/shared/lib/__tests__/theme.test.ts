/**
 * Theme Tests
 */

import { lightTheme, darkTheme } from '../theme';

describe('Theme', () => {
  describe('lightTheme', () => {
    it('is defined', () => {
      expect(lightTheme).toBeDefined();
    });

    it('has colors property', () => {
      expect(lightTheme.colors).toBeDefined();
    });

    it('has primary color', () => {
      expect(lightTheme.colors.primary).toBe('#5E35B1');
    });

    it('has secondary color', () => {
      expect(lightTheme.colors.secondary).toBe('#00897B');
    });

    it('has background color', () => {
      expect(lightTheme.colors.background).toBe('#FAFAFA');
    });

    it('has surface color', () => {
      expect(lightTheme.colors.surface).toBe('#FFFFFF');
    });

    it('has error color', () => {
      expect(lightTheme.colors.error).toBe('#BA1A1A');
    });
  });

  describe('darkTheme', () => {
    it('is defined', () => {
      expect(darkTheme).toBeDefined();
    });

    it('has colors property', () => {
      expect(darkTheme.colors).toBeDefined();
    });

    it('has primary color', () => {
      expect(darkTheme.colors.primary).toBe('#B39DDB');
    });

    it('has secondary color', () => {
      expect(darkTheme.colors.secondary).toBe('#80CBC4');
    });

    it('has background color', () => {
      expect(darkTheme.colors.background).toBe('#1C1B1F');
    });

    it('has surface color', () => {
      expect(darkTheme.colors.surface).toBe('#272629');
    });

    it('has error color', () => {
      expect(darkTheme.colors.error).toBe('#F2B8B5');
    });
  });

  describe('theme comparison', () => {
    it('light and dark themes have different colors', () => {
      expect(lightTheme.colors.primary).not.toBe(darkTheme.colors.primary);
      expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    });
  });
});
