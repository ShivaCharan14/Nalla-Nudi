// Nalla-Nudi theme tokens — Educational Blue / Deep Charcoal palette.
export const colors = {
  // Background system
  bg: '#FAFAFA',          // Scaffold background (Soft Grey)
  bgCard: '#FFFFFF',      // Card surface (Surface White)
  bgElevated: '#ECEFF1',  // Subtle elevated/disabled surface

  // Primary — Educational Blue
  primary: '#1565C0',
  primaryLight: '#1976D2',
  primaryDark: '#0D47A1',

  // Accent (kept keys for backwards-compat with existing components)
  saffron: '#C62828',     // Alert / wrong / mastered status
  mustard: '#2E7D32',     // Success / save / correct

  // Text — Deep Charcoal
  textPrimary: '#37474F',
  textSecondary: '#607D8B',
  textInverse: '#FFFFFF',
  kannada_emphasis: '#1565C0',

  // Borders
  border: '#E0E0E0',
  borderActive: '#1565C0',

  // Status
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#C62828',

  overlay: 'rgba(13,71,161,0.55)',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadow = {
  card: {
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  hero: {
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const images = {
  splash: 'https://static.prod-images.emergentagent.com/jobs/b8c8273f-7fb6-4cd2-baba-786167f57a60/images/bc1540f5732602b96628c8d09c3de3404716c36aabf647817c1159dcdbf421ad.png',
  dailyWord: 'https://static.prod-images.emergentagent.com/jobs/b8c8273f-7fb6-4cd2-baba-786167f57a60/images/70b9507a9047881a41598430ba2475c9c2912153a7f7090a93a8b5752a6ace00.png',
  mathArt: 'https://static.prod-images.emergentagent.com/jobs/b8c8273f-7fb6-4cd2-baba-786167f57a60/images/65f5b4a317c9ddbf359cd40014fbe09cb3c3a39ecdc35a18897c69313e36eda1.png',
};
