/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk color palette
        'cyber': {
          'primary': '#00ffff',    // Cyan
          'secondary': '#ff00ff',  // Magenta
          'accent': '#ffff00',     // Yellow
          'dark': '#0a0a0a',       // Almost black
          'darker': '#050505',     // Darker black
          'light': '#ffffff',      // White
          'gray': {
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          },
          'neon': {
            'blue': '#00d4ff',
            'pink': '#ff0080',
            'green': '#00ff41',
            'purple': '#8000ff',
            'orange': '#ff8000',
          }
        }
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
        'mono': ['Fira Code', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
          },
          '100%': { 
            boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #262626 100%)',
        'gradient-neon': 'linear-gradient(45deg, #00d4ff, #ff0080, #00ff41)',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 255, 255, 0.5)',
        'cyber-lg': '0 0 40px rgba(0, 255, 255, 0.6)',
        'neon-pink': '0 0 20px rgba(255, 0, 128, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}