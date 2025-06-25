// tailwind.config.js
module.exports = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", // if you're using /src
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#FFECE5',
  				'100': '#FCB59A',
  				'200': '#FA9874',
  				'500': '#EB5017',
  				'600': '#CC400C',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#E3EFFC',
  				'100': '#101928',
  				'200': '#1D2739',
  				'300': '#E5E7EB',
  				'500': '#0D5EBA',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			heading: {
  				primary: '#111827',
  				secondary: '#374151'
  			},
  			body: '#4B5563',
  			neural: {
  				'50': '#F9FAFB',
  				'200': '#E5E7EB'
  			},
  			grey: {
  				'2': '#3B3B3B',
  				'50': '#F9FAFB',
  				'100': '#F0F2F5',
  				'200': '#E4E7EC',
  				'300': '#D0D5DD',
  				'400': '#98A2B3',
  				'500': '#667185',
  				'600': '#475367',
  				'700': '#344054',
  				'900': '#101928',
  				light: '#E5E6E8'
  			},
  			error: {
  				'50': '#FBEAE9',
  				'300': '#DD524D',
  				'500': '#CB1A14',
  				DEFAULT: '#D42620'
  			},
  			warning: {
  				'50': '#FEF6E7',
  				'200': '#F7C164',
  				'400': '#F3A218',
  				'500': '#DD900D'
  			},
  			success: {
  				'50': '#E7F6EC',
  				'200': '#BBF7D0',
  				'500': '#099137',
  				'600': '#04802E',
  				'700': '#15803D'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			inter: [
  				'Inter',
  				'sans-serif'
  			],
  			poppins: [
  				'poppins',
  				'sans-serif'
  			],
  			bricolage: [
  				'Bricolage Grotesque',
  				'sans-serif'
  			],
  			helvetica: [
  				'helvetica',
  				'sans-serif'
  			],
  			geist: [
  				'geist',
  				'sans-serif'
  			]
  		},
  		backgroundImage: {
  			authGradient: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 84.72%, #000000 84.72%)'
  		},
  		boxShadow: {
  			'1': '0px 4px 6px -4px #121A2B0D,0px 12px 15px -4px #121A2B1A',
  			'2': '0px 1px 2px 0px #121A2B0D'
  		},
  		screens: {
  			qy: '575px',
  			xs: '480px',
  			ss: '632px',
  			sm: '768px',
  			md: '940px',
  			xl: '1200px'
  		},
  		lineHeight: {
  			normal: '145%'
  		},
  		letterSpacing: {
  			normal: '-4%'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [],
};
