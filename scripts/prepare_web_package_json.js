const fs = require('fs');
const path = require('path');

const origPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'original_template', 'react', 'template', 'package.json'), 'utf8'));

const webPkg = {
  name: "@dreamspos/web",
  version: "1.0.0",
  type: "module",
  scripts: {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  dependencies: {
    ...origPkg.dependencies,
    "@dreamspos/shared": "*",
    "@tanstack/react-query": "^5.66.0",
    "zustand": "^5.0.3",
    "axios": "^1.7.9",
    "react-hook-form": "^7.54.2",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.24.2"
  },
  devDependencies: {
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@types/node": "^22.13.1",
    "@vitejs/plugin-react": "^4.3.4",
    "sass": "^1.84.0",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
};

fs.writeFileSync(path.join(__dirname, '..', 'apps', 'web', 'package.json'), JSON.stringify(webPkg, null, 2));
console.log('apps/web/package.json created successfully.');
