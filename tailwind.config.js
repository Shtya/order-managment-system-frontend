module.exports = {
  darkMode: ['class'],

  content: ['./app/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#22c55e',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'skeleton-loading': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-badge': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },

      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'skeleton-loading': 'skeleton-loading 1.5s ease-in-out infinite',
        'pulse-badge': 'pulse-badge 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
      },

      // Custom Box Shadows
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-orange': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
      },

      // Custom Border Radius
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // Custom Spacing for consistent layout
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
      },

      // Custom Font Sizes
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },

      // Custom Z-Index
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },

      // Custom Backdrop Blur
      backdropBlur: {
        xs: '2px',
      },

      // Custom Transition Durations
      transitionDuration: {
        400: '400ms',
      },

      // Custom Max Width
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },

  plugins: [
    // Add custom scrollbar plugin
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'rgb(209 213 219)',
          borderRadius: '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'rgb(156 163 175)',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'rgb(55 65 81)',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'rgb(75 85 99)',
        },
      };
      addUtilities(newUtilities);
    },

    // Add custom gradient plugin
    function ({ addUtilities }) {
      const newUtilities = {
        '.bg-gradient-radial': {
          'background-image': 'radial-gradient(var(--tw-gradient-stops))',
        },
        '.bg-gradient-conic': {
          'background-image': 'conic-gradient(var(--tw-gradient-stops))',
        },
      };
      addUtilities(newUtilities);
    },
  ],

  mode: 'jit',
  safelist: ['from-blue-500', 'to-cyan-600', 'from-emerald-500', 'to-green-600', 'from-amber-500', 'to-orange-600', 'from-violet-500', 'to-purple-600', 'from-green-600', 'to-emerald-700', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-violet-100', 'bg-green-100', 'text-blue-700', 'text-emerald-700', 'text-amber-700', 'text-violet-700', 'text-green-700', 'dark:bg-blue-950/30', 'dark:bg-emerald-950/30', 'dark:bg-amber-950/30', 'dark:bg-violet-950/30', 'dark:bg-green-950/30', 'dark:text-blue-400', 'dark:text-emerald-400', 'dark:text-amber-400', 'dark:text-violet-400', 'dark:text-green-400'],
};
