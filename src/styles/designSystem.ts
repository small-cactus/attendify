// Design tokens for the minimalist black and white system
export const design = {
  // Colors
  colors: {
    // Primary palette
    black: '#000000',
    white: '#FFFFFF',
    
    // Grayscale
    gray: {
      50: '#F9F9F9',
      100: '#F2F2F2',
      200: '#E6E6E6',
      300: '#D1D1D1',
      400: '#ADADAD',
      500: '#808080',
      600: '#666666',
      700: '#404040',
      800: '#292929',
      900: '#121212',
    },
    
    // Subtle accent for important actions
    accent: '#000000',
    
    // System feedback colors (used sparingly)
    success: '#2E7D32',
    error: '#D32F2F',
    warning: '#ED6C02',
    info: '#0288D1',
  },
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      md: '1.125rem',   // 18px
      lg: '1.25rem',    // 20px
      xl: '1.5rem',     // 24px
      '2xl': '1.75rem', // 28px
      '3xl': '2rem',    // 32px
      '4xl': '2.5rem',  // 40px
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
  },
  
  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  // Animation
  animation: {
    durations: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      easeIn: 'cubic-bezier(0.42, 0, 1.0, 1.0)',
      easeOut: 'cubic-bezier(0, 0, 0.58, 1.0)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1.0)',
    },
  },
  
  // Styles for commonly used components
  components: {
    // Button styles
    button: {
      primary: 'bg-black text-white border-0 rounded-md hover:bg-gray-800 transition-all',
      secondary: 'bg-gray-100 text-black border border-gray-200 rounded-md hover:bg-gray-200 transition-all',
      text: 'bg-transparent text-black hover:bg-gray-100 transition-all',
    },
    
    // Input styles
    input: 'w-full bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-black focus:border-black focus:outline-none transition-all',
    
    // Card styles
    card: 'bg-white border border-gray-200 rounded-md',
  }
};

export default design; 