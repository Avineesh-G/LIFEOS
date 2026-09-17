/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Clash Display"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Satoshi"', 'system-ui', '-apple-system', 'sans-serif'],
        stat: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        tag: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Satoshi"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Clash Display"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        bg: {
          light: '#F8F9FA',
          dark: '#121316',
        },
        surface: {
          DEFAULT: 'var(--bg-card)',
          light: 'var(--bg-card)',
          dark: 'var(--bg-card)',
          elevated: 'var(--bg-card-elevated)',
        },
        border: {
          DEFAULT: 'var(--border-card)',
          light: 'var(--border-card)',
          dark: 'var(--border-card)',
        },
        primary: {
          DEFAULT: 'var(--text-primary)',
          light: 'var(--text-primary)',
          dark: 'var(--text-primary)',
        },
        secondary: {
          DEFAULT: 'var(--text-secondary)',
          light: 'var(--text-secondary)',
          dark: 'var(--text-secondary)',
        },
        muted: {
          DEFAULT: 'var(--text-muted)',
          light: 'var(--text-muted)',
          dark: 'var(--text-muted)',
        },
        pill: {
          light: 'var(--accent)',
          dark: 'var(--accent)',
        },
        m3: {
          surface: {
            light: '#F8F9FA',
            dark: '#141218',
          },
          lavender: {
            container: '#F2EDFD',
            badge: '#E0D7FA',
            track: '#D5C7F7',
            text: '#4F378B',
            darkContainer: '#2E2748',
            darkBadge: '#493C6E',
            darkText: '#D6C6FF',
          },
          mint: {
            container: '#EDF8F2',
            badge: '#CEEEDC',
            track: '#B2E2C7',
            text: '#146C3E',
            darkContainer: '#1B3629',
            darkBadge: '#2C5943',
            darkText: '#B4F3CE',
          },
          peach: {
            container: '#FFF5ED',
            badge: '#FFE4D1',
            track: '#FDD2B3',
            text: '#8F4C1B',
            darkContainer: '#3C261B',
            darkBadge: '#5F3B29',
            darkText: '#FFC39A',
          },
          rose: {
            container: '#FDF2F4',
            badge: '#FCE0E5',
            track: '#FACDD5',
            text: '#8C2B42',
            darkContainer: '#3C202B',
            darkBadge: '#633042',
            darkText: '#FFBAC1',
          },
        },
      },
      borderRadius: {
        'pill': '9999px',
        'm3-card': '28px',
        'm3-hero': '32px',
      },
      boxShadow: {
        'pill': '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
        'm3-subtle': '0 2px 12px rgba(0,0,0,0.03)',
        'm3-hover': '0 8px 24px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'grid-light': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40M0 0h40M0 40h40' stroke='%23D4D4D8' stroke-width='0.5'/%3E%3C/svg%3E\")",
        'grid-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0v40M40 0v40M0 0h40M0 40h40' stroke='%2327272A' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
