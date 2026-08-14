/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: '#F5F2F2',       
          orange: '#FEB05D',   
          blue: '#5A7ACD',     
          dark: '#2B2A2A',     
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'], 
      },
      boxShadow: {
        'retro-sm': '2px 2px 0px 0px #2B2A2A',
        'retro-md': '4px 4px 0px 0px #2B2A2A',
        'retro-lg': '6px 6px 0px 0px #2B2A2A',
        'retro-active': '0px 0px 0px 0px #2B2A2A', 
      }
    },
  },
  plugins: [],
}