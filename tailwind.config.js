/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gameboy: {
          bg: '#8B956D',        // Classic GameBoy body color
          screen: '#9BBC0F',    // Original GameBoy screen color
          darker: '#306230',    // Dark green shade
          darkest: '#0F380F',   // Darkest green shade
          lightest: '#C4CFA1',  // Light accent color
          button: '#2F2F2F',    // Button color
          shadow: '#4A533A',    // Shadow color
          light: '#e0e0e0',
          dark: '#8b8b8b'
        }
      },
      boxShadow: {
        'gameboy': '0 0 10px rgba(0, 0, 0, 0.3), inset 0 0 3px rgba(255, 255, 255, 0.1)',
        'button': '0 4px 0 rgba(0, 0, 0, 0.2)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gameboy-pattern': 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.1) 1px, transparent 0, transparent 50%)',
      },
      dropShadow: {
        'gameboy': '0 0 10px rgba(0, 0, 0, 0.5)',
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.custom-scrollbar': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgba(220, 38, 38, 0.3) transparent',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            'background-color': 'rgba(220, 38, 38, 0.3)',
            'border-radius': '3px'
          }
        }
      })
    }
  ]
}
