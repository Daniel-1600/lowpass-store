import type { Config } from 'tailwindcss'

export default {
  content: ['./components/**/*.vue', './layouts/**/*.vue', './pages/**/*.vue', './app.vue', './error.vue'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F4EF',
        ink: '#17181B',
        muted: '#5C5C57',
        rule: '#D8D5CC',
        signal: { DEFAULT: '#E4572E', strong: '#B93A15' },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: { store: '84rem' },
    },
  },
} satisfies Config
