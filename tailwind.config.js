/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'micro': '280px',
        'compact': '340px',
        'medium': '600px',
        'expanded': '840px',
      },
      fontFamily: {
        heading: ['"Google Sans Flex"', 'sans-serif'],
        body: ['"Google Sans Flex"', 'sans-serif'],
        stat: ['"Google Sans Flex"', 'sans-serif'],
        tag: ['"Google Sans Flex"', 'sans-serif'],
        sans: ['"Google Sans Flex"', 'sans-serif'],
        display: ['"Google Sans Flex"', 'sans-serif'],
        mono: ['"Google Sans Flex"', 'sans-serif'],
      },
      colors: {
        // ── Material 3 Expressive System Roles ──
        primary: {
          DEFAULT: 'var(--md-sys-color-primary)',
          container: 'var(--md-sys-color-primary-container)',
          'on-container': 'var(--md-sys-color-on-primary-container)',
          inverse: 'var(--md-sys-color-inverse-primary)',
        },
        'on-primary': 'var(--md-sys-color-on-primary)',
        'primary-container': 'var(--md-sys-color-primary-container)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',

        secondary: {
          DEFAULT: 'var(--md-sys-color-secondary)',
          container: 'var(--md-sys-color-secondary-container)',
          'on-container': 'var(--md-sys-color-on-secondary-container)',
        },
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'secondary-container': 'var(--md-sys-color-secondary-container)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',

        tertiary: {
          DEFAULT: 'var(--md-sys-color-tertiary)',
          container: 'var(--md-sys-color-tertiary-container)',
          'on-container': 'var(--md-sys-color-on-tertiary-container)',
        },
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',
        'tertiary-container': 'var(--md-sys-color-tertiary-container)',
        'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',

        surface: {
          DEFAULT: 'var(--md-sys-color-surface)',
          dim: 'var(--md-sys-color-surface-dim)',
          bright: 'var(--md-sys-color-surface-bright)',
          'container-lowest': 'var(--md-sys-color-surface-container-lowest)',
          'container-low': 'var(--md-sys-color-surface-container-low)',
          container: 'var(--md-sys-color-surface-container)',
          'container-high': 'var(--md-sys-color-surface-container-high)',
          'container-highest': 'var(--md-sys-color-surface-container-highest)',
        },
        'on-surface': 'var(--md-sys-color-on-surface)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'surface-variant': 'var(--md-sys-color-surface-variant)',
        'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
        'surface-container-low': 'var(--md-sys-color-surface-container-low)',
        'surface-container': 'var(--md-sys-color-surface-container)',
        'surface-container-high': 'var(--md-sys-color-surface-container-high)',
        'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',

        outline: {
          DEFAULT: 'var(--md-sys-color-outline)',
          variant: 'var(--md-sys-color-outline-variant)',
        },
        'outline-variant': 'var(--md-sys-color-outline-variant)',

        error: {
          DEFAULT: 'var(--md-sys-color-error)',
          container: 'var(--md-sys-color-error-container)',
        },
        'on-error': 'var(--md-sys-color-on-error)',
        'error-container': 'var(--md-sys-color-error-container)',
        'on-error-container': 'var(--md-sys-color-on-error-container)',

        success: {
          DEFAULT: 'var(--md-sys-color-success)',
          container: 'var(--md-sys-color-success-container)',
        },
        'on-success': 'var(--md-sys-color-on-success)',
        'success-container': 'var(--md-sys-color-success-container)',
        'on-success-container': 'var(--md-sys-color-on-success-container)',

        warning: {
          DEFAULT: 'var(--md-sys-color-warning)',
          container: 'var(--md-sys-color-warning-container)',
        },
        'on-warning': 'var(--md-sys-color-on-warning)',
        'warning-container': 'var(--md-sys-color-warning-container)',
        'on-warning-container': 'var(--md-sys-color-on-warning-container)',

        // ── Legacy Token Bridges ──
        accent: {
          DEFAULT: 'var(--accent)',
          primary: 'var(--accent-primary)',
          container: 'var(--accent-container)',
          'on-container': 'var(--accent-on-container)',
        },
        card: {
          DEFAULT: 'var(--bg-card)',
          elevated: 'var(--bg-card-elevated)',
          border: 'var(--card-border)',
        },
      },
      borderRadius: {
        'pill': '9999px',
        'm3-card': '28px',
        'm3-hero': '32px',
      },
      boxShadow: {
        'm3-elevation-1': '0 1px 3px 1px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)',
        'm3-elevation-2': '0 2px 6px 2px rgba(0, 0, 0, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.30)',
        'm3-elevation-3': '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.30)',
        'm3-elevation-4': '0 6px 10px 4px rgba(0, 0, 0, 0.15), 0 2px 3px 0 rgba(0, 0, 0, 0.30)',
        'm3-elevation-5': '0 8px 12px 6px rgba(0, 0, 0, 0.15), 0 4px 4px 0 rgba(0, 0, 0, 0.30)',
      },
      keyframes: {
        'm3-spring-pop': {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'm3-spring-pop': 'm3-spring-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
