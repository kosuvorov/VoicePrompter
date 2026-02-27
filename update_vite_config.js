const fs = require('fs');
const file = fs.readFileSync('/Users/konstantin.suvorov/Teleprompter/vite.config.ts', 'utf8');

const updated = file.replace(
    /registerType: 'autoUpdate',/,
    `registerType: 'autoUpdate',\n            workbox: {\n                navigateFallbackDenylist: [/\\/mac/, /\\/web/, /\\/about/, /\\/blog/]\n            },`
);

fs.writeFileSync('/Users/konstantin.suvorov/Teleprompter/vite.config.ts', updated);
console.log('Vite config updated with workbox navigateFallbackDenylist');
