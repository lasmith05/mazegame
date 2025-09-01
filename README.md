# Maze Game

A browser-based maze game featuring 5 different maze generation algorithms with smooth animations and interactive gameplay.

## Features

- **5 Maze Generation Algorithms**:
  - Recursive Backtracking (creates winding paths)
  - Binary Tree (northeast bias with guaranteed top-right path)
  - Eller's Algorithm (memory-efficient row-by-row generation)
  - Prim's Algorithm (creates many short dead ends)
  - Recursive Division (chamber-like structures)

- **Interactive Gameplay**:
  - Heart-shaped player character with smooth animations
  - WASD/Arrow key controls
  - Timer functionality
  - Win detection with celebration effects

- **Advanced Features**:
  - Solution path finding and display
  - Multiple maze sizes (Small 15x15, Medium 25x25, Large 35x35)
  - Responsive design for all screen sizes
  - Performance optimizations for large mazes

## Quick Start

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

3. **Play the game**:
   - Select an algorithm and maze size
   - Click "Generate Maze"
   - Use WASD keys to navigate from start (green) to finish (red)
   - Click "Show Solution" if you get stuck!

## Development

### Project Structure
```
mazegame/
├── index.html          # Main HTML structure and UI
├── style.css          # Styling and responsive layout  
├── script.js          # Core game logic and algorithms
├── package.json       # Project metadata and scripts
├── PLANNING.md        # Detailed requirements and implementation plan
└── CLAUDE.md          # Development guidance for Claude Code
```

### Testing

Run automated tests in the browser console:
```javascript
// Test all algorithms
game.runAutomatedTests()

// Debug specific algorithm
game.debugEller()
```

### Technologies Used
- Pure HTML5/CSS/JavaScript (no external dependencies)
- HTML5 Canvas for rendering
- CSS animations and transitions
- Python HTTP server for development

## Algorithm Details

Each maze generation algorithm has unique characteristics:

- **Recursive Backtracking**: Stack-based depth-first traversal creating long winding paths
- **Binary Tree**: Simple algorithm with guaranteed northeast bias and top-right solution path
- **Eller's Algorithm**: Row-by-row generation using union-find data structure for memory efficiency
- **Prim's Algorithm**: Minimum spanning tree approach creating many short dead ends
- **Recursive Division**: Divide-and-conquer method creating chamber-like maze structures

## Browser Compatibility

Tested and supported on:
- ✅ Chrome/Chromium
- ✅ Firefox  
- ✅ Safari
- ✅ Edge

## License

MIT License - feel free to use this project for learning and experimentation!