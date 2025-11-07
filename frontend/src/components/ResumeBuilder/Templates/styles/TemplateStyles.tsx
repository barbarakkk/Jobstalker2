import type { ThemeConfig, StyleConfig } from '../config/templateConfigSchema';

export function applyTheme(theme: ThemeConfig): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (theme.backgroundColor) {
    styles.backgroundColor = theme.backgroundColor;
  }
  if (theme.textColor) {
    styles.color = theme.textColor;
  }
  if (theme.fontFamily) {
    styles.fontFamily = theme.fontFamily;
  }
  
  return styles;
}

export function getThemeClasses(theme: ThemeConfig): string {
  const classes: string[] = [];
  
  // You can add theme-based Tailwind classes here if needed
  // For now, we'll use inline styles from the theme config
  
  return classes.join(' ');
}

export function applyContainerStyles(
  theme: ThemeConfig,
  layoutStyle?: StyleConfig,
  containerStyle?: StyleConfig
): React.CSSProperties {
  const baseStyle = applyTheme(theme);
  
  if (containerStyle) {
    return { ...baseStyle, ...containerStyle };
  }
  
  if (layoutStyle) {
    return { ...baseStyle, ...layoutStyle };
  }
  
  return baseStyle;
}

export function getTypographyClasses(theme: ThemeConfig): string {
  const classes: string[] = [];
  
  if (theme.headingFontSize) {
    // Map to Tailwind classes if needed
  }
  
  if (theme.bodyFontSize) {
    // Map to Tailwind classes if needed
  }
  
  return classes.join(' ');
}

