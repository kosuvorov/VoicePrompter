/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                blue: {
                    400: '#DAA000',
                    500: '#DAA000',
                    600: '#B8860B', // Darker shade for hover
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
