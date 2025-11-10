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
      expect(lightTheme.colors.primary).toBe('#6200ee');
    });

    it('has secondary color', () => {
      expect(lightTheme.colors.secondary).toBe('#03dac6');
    });

    it('has background color', () => {
      expect(lightTheme.colors.background).toBe('#ffffff');
    });

    it('has surface color', () => {
      expect(lightTheme.colors.surface).toBe('#ffffff');
    });

    it('has error color', () => {
      expect(lightTheme.colors.error).toBe('#b00020');
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
      expect(darkTheme.colors.primary).toBe('#bb86fc');
    });

    it('has secondary color', () => {
      expect(darkTheme.colors.secondary).toBe('#03dac6');
    });

    it('has background color', () => {
      expect(darkTheme.colors.background).toBe('#121212');
    });

    it('has surface color', () => {
      expect(darkTheme.colors.surface).toBe('#121212');
    });

    it('has error color', () => {
      expect(darkTheme.colors.error).toBe('#cf6679');
    });
  });

  describe('theme comparison', () => {
    it('light and dark themes have different colors', () => {
      expect(lightTheme.colors.primary).not.toBe(darkTheme.colors.primary);
      expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    });
  });
});
