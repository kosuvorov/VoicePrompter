/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                blue: {
                    400: '#FFBB00',
                    500: '#FFBB00',
                    600: '#D9A000',
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
