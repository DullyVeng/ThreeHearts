/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f4252f',
        'primary-dark': '#b91c24',
        'primary-light': '#ff4d55',
        gold: {
          100: '#FFF9C4',
          300: '#FFF176',
          500: '#FFD700',
          600: '#f2b90d',
          700: '#FBC02D',
          900: '#F57F17',
        },
        'bg-dark': '#221011',
        'bg-card': '#2a1415',
        surface: '#2c1a1b',
      },
      fontFamily: {
        display: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
      backgroundImage: {
        'crimson-gradient': 'radial-gradient(circle at 50% 30%, #4a0404 0%, #221011 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f2b90d 0%, #d49e00 100%)',
        'gold-shine': 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
