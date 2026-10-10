import type { Config } from 'tailwindcss'

// Tailwind is kept for layout utilities during the DKFDS migration only.
// DKFDS (Det Fælles Designsystem, Virk theme) owns base styles,
// typography, components and the palette; see docs/DKFDS_REFERENCE.md for
// the load order and the shared-class-name rules.
//
// Palette below follows the Virk theme so any remaining Tailwind colour
// utility stays on-brand (primary #0059B3, link #004D99), with borger.dk
// green kept as the `accent` scale for success and live states.
const config: Config = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  corePlugins: {
    // DKFDS ships its own reset and element styles; Tailwind's preflight
    // would override them (and the dkfds.scss load order would not help,
    // since preflight is injected first).
    preflight: false,
    // DKFDS defines .container (1200px, 16px gutter); Tailwind's version
    // would fight it at every breakpoint.
    container: false,
  },
  theme: {
    extend: {
      colors: {
        // Virk theme primary blue (official DKFDS theme): 600 = #0059B3,
        // 700 = dark #004993, 800 = darker #003972. 500 and up pass AA on
        // white as text.
        primary: {
          50: '#E6EFF8',
          100: '#CCDEF0',
          200: '#99BDE1',
          300: '#5C95CF',
          400: '#2A73BE',
          500: '#0059B3',
          600: '#0059B3',
          700: '#004993',
          800: '#003972',
          900: '#002952',
        },
        // borger.dk green as the supporting accent: success states, the
        // LIVE badge, positive outcome alerts. 500 = #44831E, 700 = #3C5C22,
        // 900 = #233614.
        accent: {
          50: '#F3F8EE',
          100: '#E3F0D8',
          200: '#C6E0B1',
          300: '#9CC77F',
          400: '#6FA64C',
          500: '#44831E',
          600: '#44831E',
          700: '#3C5C22',
          800: '#2E4A1A',
          900: '#233614',
        },
        // DKFDS link blue / info blue as the accent family
        secondary: {
          50: '#E2F2FB',
          100: '#C7E4F6',
          200: '#9CCDED',
          300: '#5FADDC',
          400: '#1B86C3',
          500: '#1B86C3',
          600: '#004D99',
          700: '#003D7A',
          800: '#002E5C',
          900: '#001F3D',
        },
        success: {
          50: '#DDF7CE',
          100: '#DDF7CE',
          200: '#BDEBA0',
          300: '#8FD66A',
          400: '#5EB532',
          500: '#358000',
          600: '#358000',
          700: '#2A6600',
          800: '#204D00',
          900: '#163300',
        },
        warning: {
          50: '#FFEECC',
          100: '#FFEECC',
          200: '#FFDF99',
          300: '#FECF66',
          400: '#FEBB30',
          500: '#FEBB30',
          600: '#E0A020',
          700: '#B5801A',
          800: '#8A6014',
          900: '#5F400D',
        },
        error: {
          50: '#FFE0E0',
          100: '#FFE0E0',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#E63333',
          500: '#CC0000',
          600: '#CC0000',
          700: '#A30000',
          800: '#7A0000',
          900: '#520000',
        },
        // DKFDS gray 100..600 plus black
        neutral: {
          50: '#F5F5F5',
          100: '#F5F5F5',
          200: '#DCDCDC',
          300: '#BFBFBF',
          400: '#8E8E8E',
          500: '#707070',
          600: '#454545',
          700: '#454545',
          800: '#2A2A2A',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

export default config
