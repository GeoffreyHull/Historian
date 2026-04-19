# HISTORIAN — Game Specification & Build Guide
## Quick Setup
npm init -y
npm install react react-dom
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom
## Project Structure
Historian/
├── src/
│   ├── game/
│   │   ├── types.ts
│   │   ├── eventGenerator.ts
│   │   ├── credibilitySystem.ts
│   │   └── gameManager.ts
│   ├── components/
│   │   ├── GameBoard.tsx
│   │   ├── GameBoard.css
│   │   ├── BookWriter.tsx
│   │   └── BookWriter.css
│   ├── App.tsx
│   ├── App.css
│   ├── main.jsx (rename to main.tsx)
│   └── index.css
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
## Game Overview
**Historian** is a single-player, turn-based narrative strategy game where players:
1. Write history books based on incomplete information about world events
2. Gain credibility (0-100%) based on accuracy and faction reactions
3. Earn influence from credibility
4. Spend influence to retcon past claims, force events, or buy intel
5. Manage faction trust (lose if all factions refuse to buy your book or credibility hits 0)
6. Survive 20 turns to win
## Core Game Mechanics
### Turn Structure
1. **Events Occur** — 2-6 random events happen in the world
2. **Observation** — You learn 0-all of them (random)
3. **Writing** — You write claims about events (observed or guessed)
4. **Publishing** — Book credibility is calculated
5. **Influence** — You gain influence based on credibility × faction multiplier
6. **Spending** — (Future) Use influence to retcon, force events, or buy intel
### Credibility Scoring
- Base accuracy: 100%
- Each wrong major fact: −20%
- Each faction you insult: −5% to −10%
- Result: 0-100% credibility
### Influence System
- Earn: credibility % × faction multiplier (1.0 to 0 based on faction anger)
- Spend on: Retcon (40-60), Force events (30-50), Buy intel (20-40)
### Factions
- Player selects 3/5/7 at game start
- Each has trust (−200 to +100)
- Trust below −100: refuses to buy next book (lose condition)
- All factions refuse: influence multiplier = 0 (auto-lose)
## Files to Create
### 1. src/game/types.ts
[See full code below]
### 2. src/game/eventGenerator.ts
[See full code below]
### 3. src/game/credibilitySystem.ts
[See full code below]
### 4. src/game/gameManager.ts
[See full code below]
### 5. src/components/GameBoard.tsx
[See full code below]
### 6. src/components/BookWriter.tsx
[See full code below]
### 7. src/App.tsx
[See full code below]
### 8. tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
### 9. tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
### 10. vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
})
### 11. index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Historian</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
### 12. src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
### 13. src/index.css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: 'Georgia', serif;
  background: #1a1a1a;
  color: #f0f0f0;
}
## To Run After Setup
npm run dev
Open http://localhost:5173
---