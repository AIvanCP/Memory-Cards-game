# 🃏 Memory Card Game

A beautiful, modern memory card game built with React, TypeScript, and Tailwind CSS. Features multiple themes, AI opponents, and local multiplayer support.

![Memory Card Game](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC)

## ✨ Features

### 🎮 Game Modes
- **Single Player vs AI** - Challenge AI opponents with adjustable difficulty
- **Player vs Player** - Local multiplayer for two players
- **AI vs AI** - Watch AI players compete against each other

### 🎨 Multiple Themes
- **Light** - Clean and bright interface
- **Dark** - Modern dark theme
- **Minimalist** - Simple and clean design
- **Cyberpunk** - Futuristic neon aesthetics
- **Neon** - Bright glowing colors
- **Forest** - Natural green tones

### 🧠 AI Features
- Multiple difficulty levels (Easy, Medium, Hard, Expert)
- Smart AI that learns and adapts
- Realistic thinking delays for natural gameplay

### 🎯 Game Features
- **Multiple Board Sizes** - 3x4, 4x4, 5x4, 6x4, 6x6
- **Match Types** - Color matching and pattern matching
- **Statistics Tracking** - Track your progress and achievements
- **Achievement System** - Unlock achievements as you play
- **Sound Effects** - Immersive audio feedback
- **Animations** - Smooth Framer Motion animations
- **Responsive Design** - Works on all screen sizes

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/memory-card-game.git
   cd memory-card-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## 🎮 How to Play

1. **Choose a game mode** - Single player, multiplayer, or AI vs AI
2. **Select your preferences** - Board size, difficulty, theme
3. **Start playing** - Click cards to flip them and find matching pairs
4. **Win the game** - Match all pairs to complete the game

### Game Rules
- Players take turns flipping two cards
- If cards match, the player keeps the pair and gets another turn
- If cards don't match, they flip back and turn passes to next player
- Player with the most pairs wins!

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Create React App
- **Code Quality**: ESLint, TypeScript strict mode

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── GameBoard.tsx   # Main game board component
│   ├── Card.tsx        # Individual card component
│   ├── GameSettings.tsx # Game configuration
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useGameLogic.ts # Main game logic
│   ├── useAI.ts        # AI logic
│   └── ...
├── utils/              # Utility functions
│   ├── gameLogic.ts    # Core game mechanics
│   ├── aiLogic.ts      # AI algorithms
│   └── ...
├── types/              # TypeScript type definitions
└── styles/             # CSS and styling
```

## 🎨 Themes

The game includes 6 beautiful themes:

| Theme | Description |
|-------|-------------|
| Light | Clean, bright interface with blue gradients |
| Dark | Modern dark theme with blue accents |
| Minimalist | Simple, clean design with minimal colors |
| Cyberpunk | Futuristic theme with neon colors and dark background |
| Neon | Bright, glowing colors with electric aesthetics |
| Forest | Natural theme with green tones and earthy colors |

## 🤖 AI System

The AI system features:
- **Multiple Difficulty Levels** with different strategies
- **Memory Simulation** - AI remembers previously seen cards
- **Realistic Delays** - Natural thinking time
- **Strategic Play** - Prioritizes certain moves based on difficulty

## 📊 Statistics & Achievements

Track your progress with:
- Games played and won
- Best completion times
- Win streaks
- Achievement unlocks

## 🎵 Audio

Immersive sound effects for:
- Card flips
- Successful matches
- Button clicks
- Game completion

## 📱 Responsive Design

Fully responsive design that works on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🔧 Development

### Available Scripts

- `npm start` - Runs the development server
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting and formatting
- **Strict Mode** - Enhanced error checking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

⭐ Star this repository if you found it helpful!
