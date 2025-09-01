# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Project
```bash
npm start      # Start development server on port 8000
npm run dev    # Alternative development server command
```

The project uses Python's built-in HTTP server to serve static files locally.

## Project Architecture

This is a browser-based maze game built with pure HTML5/CSS/JavaScript (no external dependencies). The game features 5 different maze generation algorithms and WASD-based player navigation.

### Planned File Structure
```
mazegame/
├── index.html          # Main HTML structure and UI
├── style.css          # Styling and responsive layout  
├── script.js          # Core game logic and algorithms
├── package.json       # Project metadata and scripts
└── PLANNING.md        # Detailed requirements and task breakdown
```

### Core Components (Planned)
1. **Maze Generator** - Implements 5 algorithms: Recursive Backtracking, Binary Tree, Eller's Algorithm, Prim's Algorithm, Recursive Division
2. **Game Engine** - Handles game state, timer, win conditions
3. **Renderer** - HTML5 Canvas-based maze and player rendering  
4. **Input Handler** - WASD key processing and collision detection
5. **UI Controller** - Algorithm selection, maze size options, controls

### Technical Constraints
- Pure vanilla JavaScript (no frameworks or libraries)
- HTML5 Canvas for rendering
- WASD key controls for player movement
- Responsive design for cross-platform compatibility
- Target performance: <2 second generation for 35x35 mazes

### Development Phases
The project follows a 4-phase implementation approach detailed in PLANNING.md:
1. Foundation (HTML/CSS/Canvas setup)
2. Algorithm implementation (5 maze generation algorithms)  
3. Game mechanics (player movement, collision, win conditions)
4. Enhanced features (solution display, UI polish)

### Testing Requirements
Each maze generation algorithm must pass specific tests for:
- Valid maze generation (exactly one solution path)
- Proper boundary walls
- Performance benchmarks
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)