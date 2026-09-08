/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans Flex Variable"', '"Google Sans Flex"', '"Google Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Google Sans Flex Variable"', '"Google Sans Flex"', '"Google Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
          light: '#FFFFFF',
          dark: '#1A1B1F',
        },
        border: {
          light: '#E7E8EC',
          dark: '#2B2D33',
        },
        primary: {
          light: '#09090B',
          dark: '#FAFAFA',
        },
        secondary: {
          light: '#71717A',
          dark: '#71717A',
        },
        muted: {
          light: '#A1A1AA',
          dark: '#52525B',
        },
        pill: {
          light: '#18181B',
          dark: '#FAFAFA',
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
            darkContainer: '#231E2E',
            darkBadge: '#3B324D',
            darkText: '#D0BCFF',
          },
          mint: {
            container: '#EDF8F2',
            badge: '#CEEEDC',
            track: '#B2E2C7',
            text: '#146C3E',
            darkContainer: '#19261E',
            darkBadge: '#263D30',
            darkText: '#A6EDC2',
          },
          peach: {
            container: '#FFF5ED',
            badge: '#FFE4D1',
            track: '#FDD2B3',
            text: '#8F4C1B',
            darkContainer: '#2B1E17',
            darkBadge: '#432E23',
            darkText: '#FFB787',
          },
          rose: {
            container: '#FDF2F4',
            badge: '#FCE0E5',
            track: '#FACDD5',
            text: '#8C2B42',
            darkContainer: '#2C1B20',
            darkBadge: '#442831',
            darkText: '#FFB2B8',
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
