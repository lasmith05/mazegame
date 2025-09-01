class MazeGame {
    constructor() {
        this.canvas = document.getElementById('maze-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timer = document.getElementById('timer');
        this.status = document.getElementById('status');
        
        // Game state
        this.maze = null;
        this.player = { x: 0, y: 0 };
        this.playerDisplay = { x: 0, y: 0 }; // Visual position for animation
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationDuration = this.settings.animationSpeed; // milliseconds
        this.gameStarted = false;
        this.gameWon = false;
        this.startTime = null;
        this.timerInterval = null;
        this.solutionPath = [];
        this.showingSolution = false;
        
        // Character selection system
        this.selectedCharacter = localStorage.getItem('mazeGameCharacter') || '❤️';
        this.characterOptions = {
            'faces': ['😀', '😎', '🤓', '😇', '🥳', '🤩', '😊', '🙂', '😍', '🤯', '🤔', '😴'],
            'animals': ['🐱', '🐶', '🐼', '🐨', '🦊', '🐸', '🐧', '🦆', '🦀', '🐙', '🦋', '🐝'],
            'objects': ['⚡', '🔥', '💎', '⭐', '🌟', '💫', '🎯', '🎪', '🎭', '🎨', '🎵', '⚽'],
            'nature': ['🌺', '🌸', '🌞', '🌙', '☀️', '🌈', '🦋', '🌿', '🌊', '🍀', '🌵', '🌳'],
            'food': ['🍕', '🍔', '🎂', '🍎', '🍊', '🥨', '🧀', '🍪', '🍓', '🥑', '🌮', '🍜']
        };
        
        // Game settings
        this.settings = {
            soundEnabled: JSON.parse(localStorage.getItem('mazeGameSoundEnabled') ?? 'true'),
            animationSpeed: parseInt(localStorage.getItem('mazeGameAnimationSpeed') ?? '200'),
            generationDelay: parseInt(localStorage.getItem('mazeGameGenerationDelay') ?? '50'),
            showTrail: JSON.parse(localStorage.getItem('mazeGameShowTrail') ?? 'false')
        };
        
        // Trail system
        this.playerTrail = [];
        
        // Canvas and maze settings
        this.cellSize = 20;
        this.wallThickness = 2;
        
        // Performance optimization settings
        this.renderCache = null;
        this.lastRenderTime = 0;
        this.renderThrottle = 16; // ~60fps limit
        
        // Maze size configurations
        this.sizeConfigs = {
            'small': { width: 15, height: 15, cellSize: 25 },
            'medium': { width: 25, height: 25, cellSize: 20 },
            'large': { width: 35, height: 35, cellSize: 15 }
        };
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupSettingsModal();
        this.updateStatus('Ready to play - Generate a maze to start!');
    }
    
    initializeCanvas() {
        // Set up initial canvas size
        this.resizeCanvas('medium');
        
        // Clear canvas with a welcome message
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw welcome text
        this.ctx.fillStyle = '#6c757d';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Click "Generate Maze" to begin!', 
            this.canvas.width / 2, 
            this.canvas.height / 2
        );
    }
    
    resizeCanvas(sizeKey) {
        const config = this.sizeConfigs[sizeKey];
        this.cellSize = config.cellSize;
        this.mazeWidth = config.width;
        this.mazeHeight = config.height;
        
        // Calculate canvas dimensions
        const canvasWidth = this.mazeWidth * this.cellSize;
        const canvasHeight = this.mazeHeight * this.cellSize;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
    }
    
    setupEventListeners() {
        // Button event listeners
        document.getElementById('generate').addEventListener('click', () => {
            this.generateMaze();
        });
        
        document.getElementById('solve').addEventListener('click', () => {
            this.showSolution();
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Size change listener
        document.getElementById('size').addEventListener('change', (e) => {
            this.resizeCanvas(e.target.value);
            if (this.maze) {
                this.generateMaze(); // Regenerate with new size
            } else {
                this.initializeCanvas(); // Redraw welcome message
            }
        });
        
        // Make canvas focusable for keyboard events
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        // Keyboard event listeners for WASD movement
        this.setupKeyboardControls();
    }
    
    generateMaze() {
        const algorithm = document.getElementById('algorithm').value;
        const size = document.getElementById('size').value;
        const generateBtn = document.getElementById('generate');
        
        // Disable UI during generation
        this.setUIEnabled(false);
        this.updateStatus('Generating maze...', 'generating');
        generateBtn.textContent = 'Generating...';
        
        // Add generating class for visual feedback
        this.canvas.classList.add('generating');
        
        // Use setTimeout to allow UI update before heavy computation
        setTimeout(() => {
            try {
                // Initialize maze structure
                this.initializeMazeStructure();
                
                // Generate maze based on selected algorithm
                switch (algorithm) {
                    case 'recursive-backtracking':
                        this.generateRecursiveBacktracking();
                        break;
                    case 'binary-tree':
                        this.generateBinaryTree();
                        break;
                    case 'eller':
                        this.generateEller();
                        break;
                    case 'prim':
                        this.generatePrim();
                        break;
                    case 'recursive-division':
                        this.generateRecursiveDivision();
                        break;
                    default:
                        this.generateRecursiveBacktracking();
                }
                
                // Reset player position
                this.player = { x: 0, y: 0 };
                this.playerDisplay = { x: 0, y: 0 };
                this.isAnimating = false;
                this.animationProgress = 0;
                this.gameStarted = false;
                this.gameWon = false;
                this.solutionPath = [];
                this.showingSolution = false;
                this.playerTrail = []; // Clear trail on new maze
                this.renderCache = null; // Clear render cache
                
                // Reset solve button
                document.getElementById('solve').textContent = 'Show Solution';
                
                this.render();
                this.updateStatus('Maze generated! Use WASD keys to move.', 'success');
                
                // Re-enable UI with animation
                this.setUIEnabled(true);
                generateBtn.textContent = 'Generate Maze';
                this.canvas.classList.remove('generating');
                this.canvas.classList.add('fade-in');
                
            } catch (error) {
                console.error('Error generating maze:', error);
                this.updateStatus('Error generating maze! Please try again.', 'error');
                this.setUIEnabled(true);
                generateBtn.textContent = 'Generate Maze';
                this.canvas.classList.remove('generating');
            }
        }, 50);
    }
    
    initializeMazeStructure() {
        // Initialize 2D array for maze
        this.maze = [];
        for (let y = 0; y < this.mazeHeight; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeWidth; x++) {
                // Each cell has walls on all sides initially
                this.maze[y][x] = {
                    walls: {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true
                    },
                    visited: false
                };
            }
        }
    }
    
    
    removeWall(x, y, wall) {
        this.maze[y][x].walls[wall] = false;
        
        // Remove corresponding wall from adjacent cell
        switch (wall) {
            case 'top':
                this.maze[y - 1][x].walls.bottom = false;
                break;
            case 'right':
                this.maze[y][x + 1].walls.left = false;
                break;
            case 'bottom':
                this.maze[y + 1][x].walls.bottom = false;
                break;
            case 'left':
                this.maze[y][x - 1].walls.right = false;
                break;
        }
    }
    
    render() {
        if (!this.maze) return;
        
        // Throttle rendering for performance
        const now = Date.now();
        if (now - this.lastRenderTime < this.renderThrottle) {
            return;
        }
        this.lastRenderTime = now;
        
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze (use cached version if available)
        this.drawMaze();
        
        // Draw solution path if showing
        if (this.showingSolution && this.solutionPath.length > 0) {
            this.drawSolutionPath();
        }
        
        // Draw player trail if enabled
        if (this.settings.showTrail && this.playerTrail.length > 0) {
            this.drawPlayerTrail();
        }
        
        // Draw player
        this.drawPlayer();
    }
    
    drawMaze() {
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = this.wallThickness;
        
        // Batch wall drawing for better performance
        this.ctx.beginPath();
        
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const cell = this.maze[y][x];
                const pixelX = x * this.cellSize;
                const pixelY = y * this.cellSize;
                
                // Draw walls - batch all moves and lines
                if (cell.walls.top) {
                    this.ctx.moveTo(pixelX, pixelY);
                    this.ctx.lineTo(pixelX + this.cellSize, pixelY);
                }
                if (cell.walls.right) {
                    this.ctx.moveTo(pixelX + this.cellSize, pixelY);
                    this.ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
                }
                if (cell.walls.bottom) {
                    this.ctx.moveTo(pixelX + this.cellSize, pixelY + this.cellSize);
                    this.ctx.lineTo(pixelX, pixelY + this.cellSize);
                }
                if (cell.walls.left) {
                    this.ctx.moveTo(pixelX, pixelY + this.cellSize);
                    this.ctx.lineTo(pixelX, pixelY);
                }
            }
        }
        
        // Single stroke call for all walls
        this.ctx.stroke();
        
        // Draw start indicator
        this.drawStartEnd();
    }
    
    drawStartEnd() {
        // Start (top-left) - green circle
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.arc(
            this.cellSize / 2, 
            this.cellSize / 2, 
            this.cellSize / 4, 
            0, 
            2 * Math.PI
        );
        this.ctx.fill();
        
        // End (bottom-right) - red circle
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.mazeWidth - 0.5) * this.cellSize,
            (this.mazeHeight - 0.5) * this.cellSize,
            this.cellSize / 4,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }
    
    drawPlayerTrail() {
        if (this.playerTrail.length === 0) return;
        
        // Draw breadcrumb trail with fading effect
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; // Light blue with transparency
        
        this.playerTrail.forEach((position, index) => {
            const centerX = (position.x + 0.5) * this.cellSize;
            const centerY = (position.y + 0.5) * this.cellSize;
            const radius = this.cellSize * 0.15; // Small circle
            
            // Create fading effect - older positions are more transparent
            const opacity = Math.max(0.1, 0.3 - (this.playerTrail.length - index) * 0.02);
            this.ctx.fillStyle = `rgba(52, 152, 219, ${opacity})`;
            
            // Draw small circle for trail
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawPlayer() {
        // Draw player as selected emoji character using display position for smooth animation
        const centerX = (this.playerDisplay.x + 0.5) * this.cellSize;
        const centerY = (this.playerDisplay.y + 0.5) * this.cellSize;
        
        // Calculate emoji font size based on cell size
        const fontSize = this.cellSize * 0.8;
        
        // Set up text rendering
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Draw the selected character
        this.ctx.fillText(this.selectedCharacter, centerX, centerY);
        
        // Reset shadow for other drawing operations
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    showSolution() {
        if (!this.maze) {
            this.updateStatus('Generate a maze first!');
            return;
        }
        
        if (this.showingSolution) {
            // Hide solution
            this.showingSolution = false;
            this.solutionPath = [];
            this.updateStatus('Solution hidden');
            document.getElementById('solve').textContent = 'Show Solution';
        } else {
            // Find and show solution
            this.updateStatus('Finding solution...');
            this.solutionPath = this.findSolutionPath();
            
            if (this.solutionPath.length > 0) {
                this.showingSolution = true;
                this.updateStatus(`Solution found! Path length: ${this.solutionPath.length} steps`);
                document.getElementById('solve').textContent = 'Hide Solution';
            } else {
                this.updateStatus('No solution found!');
            }
        }
        
        this.render();
    }
    
    resetGame() {
        this.stopTimer();
        this.player = { x: 0, y: 0 };
        this.playerDisplay = { x: 0, y: 0 };
        this.isAnimating = false;
        this.animationProgress = 0;
        this.gameStarted = false;
        this.gameWon = false;
        this.startTime = null;
        this.solutionPath = [];
        this.showingSolution = false;
        this.playerTrail = []; // Clear trail on reset
        
        // Reset solve button text
        document.getElementById('solve').textContent = 'Show Solution';
        
        if (this.maze) {
            this.render();
            this.updateStatus('Game reset! Use WASD keys to move.');
        } else {
            this.initializeCanvas();
            this.updateStatus('Ready to play - Generate a maze to start!');
        }
        
        this.timer.textContent = '00:00';
    }
    
    startTimer() {
        if (this.timerInterval) return;
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            this.timer.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateStatus(message, type = 'default') {
        this.status.textContent = message;
        
        // Remove existing status classes
        this.status.classList.remove('generating', 'error', 'success');
        
        // Add appropriate class based on type
        if (type !== 'default') {
            this.status.classList.add(type);
        }
    }
    
    setUIEnabled(enabled) {
        const buttons = ['generate', 'solve', 'reset'];
        const selects = ['algorithm', 'size'];
        
        buttons.forEach(id => {
            document.getElementById(id).disabled = !enabled;
        });
        
        selects.forEach(id => {
            document.getElementById(id).disabled = !enabled;
        });
    }
    
    celebrateWin() {
        // Add pulse animation to canvas
        this.canvas.classList.add('pulse');
        
        // Remove animation after 3 seconds
        setTimeout(() => {
            this.canvas.classList.remove('pulse');
        }, 3000);
        
        // Brief flash effect on the finish circle
        this.flashFinish();
    }
    
    flashFinish() {
        let flashCount = 0;
        const maxFlashes = 6;
        
        const flash = () => {
            if (flashCount >= maxFlashes) return;
            
            // Temporarily change finish circle to gold
            const originalRender = this.drawStartEnd.bind(this);
            
            this.drawStartEnd = () => {
                // Start (top-left) - green circle
                this.ctx.fillStyle = '#27ae60';
                this.ctx.beginPath();
                this.ctx.arc(
                    this.cellSize / 2, 
                    this.cellSize / 2, 
                    this.cellSize / 4, 
                    0, 
                    2 * Math.PI
                );
                this.ctx.fill();
                
                // End (bottom-right) - gold circle (flashing)
                this.ctx.fillStyle = flashCount % 2 === 0 ? '#f1c40f' : '#e74c3c';
                this.ctx.beginPath();
                this.ctx.arc(
                    (this.mazeWidth - 0.5) * this.cellSize,
                    (this.mazeHeight - 0.5) * this.cellSize,
                    this.cellSize / 4,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            };
            
            this.render();
            flashCount++;
            
            setTimeout(() => {
                if (flashCount < maxFlashes) {
                    flash();
                } else {
                    // Restore original render function
                    this.drawStartEnd = originalRender;
                    this.render();
                }
            }, 300);
        };
        
        flash();
    }
    
    setupKeyboardControls() {
        // Listen for keydown events on the document
        document.addEventListener('keydown', (e) => {
            if (!this.maze || this.gameWon || this.isAnimating) return;
            
            // Start timer on first movement
            if (!this.gameStarted) {
                this.startTimer();
                this.gameStarted = true;
            }
            
            let newX = this.player.x;
            let newY = this.player.y;
            let moved = false;
            
            // Handle WASD movement
            switch (e.key.toLowerCase()) {
                case 'w': // Up
                case 'arrowup':
                    if (this.canMove(this.player.x, this.player.y, 'up')) {
                        newY--;
                        moved = true;
                    }
                    break;
                case 'a': // Left
                case 'arrowleft':
                    if (this.canMove(this.player.x, this.player.y, 'left')) {
                        newX--;
                        moved = true;
                    }
                    break;
                case 's': // Down
                case 'arrowdown':
                    if (this.canMove(this.player.x, this.player.y, 'down')) {
                        newY++;
                        moved = true;
                    }
                    break;
                case 'd': // Right
                case 'arrowright':
                    if (this.canMove(this.player.x, this.player.y, 'right')) {
                        newX++;
                        moved = true;
                    }
                    break;
                default:
                    return; // Don't prevent default for other keys
            }
            
            if (moved) {
                e.preventDefault(); // Prevent scrolling
                this.animatePlayerTo(newX, newY);
            }
        });
    }
    
    animatePlayerTo(targetX, targetY) {
        if (this.isAnimating) return;
        
        const startX = this.player.x;
        const startY = this.player.y;
        const startTime = Date.now();
        
        // Add current position to trail if trail is enabled
        if (this.settings.showTrail) {
            this.playerTrail.push({ x: startX, y: startY });
        }
        
        this.player.x = targetX;
        this.player.y = targetY;
        this.isAnimating = true;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Smooth easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            this.playerDisplay.x = startX + (targetX - startX) * easeProgress;
            this.playerDisplay.y = startY + (targetY - startY) * easeProgress;
            
            this.render();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.isAnimating = false;
                this.playerDisplay.x = targetX;
                this.playerDisplay.y = targetY;
                
                // Check for win condition
                if (this.player.x === this.mazeWidth - 1 && this.player.y === this.mazeHeight - 1) {
                    this.gameWon = true;
                    this.stopTimer();
                    this.updateStatus('🎉 Congratulations! You completed the maze! 🎉', 'success');
                    this.celebrateWin();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    canMove(x, y, direction) {
        // Check boundaries first
        switch (direction) {
            case 'up':
                if (y <= 0) return false;
                return !this.maze[y][x].walls.top;
            case 'down':
                if (y >= this.mazeHeight - 1) return false;
                return !this.maze[y][x].walls.bottom;
            case 'left':
                if (x <= 0) return false;
                return !this.maze[y][x].walls.left;
            case 'right':
                if (x >= this.mazeWidth - 1) return false;
                return !this.maze[y][x].walls.right;
            default:
                return false;
        }
    }
    
    // ===== MAZE GENERATION ALGORITHMS =====
    
    generateRecursiveBacktracking() {
        // Stack-based depth-first traversal
        const stack = [];
        let current = { x: 0, y: 0 };
        this.maze[current.y][current.x].visited = true;
        
        while (true) {
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);
            
            if (neighbors.length > 0) {
                // Choose random neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Push current cell to stack
                stack.push(current);
                
                // Remove wall between current and next
                this.removeWallBetween(current, next);
                
                // Mark next as visited and make it current
                this.maze[next.y][next.x].visited = true;
                current = next;
            } else if (stack.length > 0) {
                // Backtrack
                current = stack.pop();
            } else {
                // No more cells to visit
                break;
            }
        }
        
        // Reset visited flags
        this.resetVisitedFlags();
    }
    
    generateBinaryTree() {
        // For each cell, randomly carve either north or east
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const neighbors = [];
                
                // Add north neighbor if available
                if (y > 0) neighbors.push({ x: x, y: y - 1, direction: 'top' });
                
                // Add east neighbor if available
                if (x < this.mazeWidth - 1) neighbors.push({ x: x + 1, y: y, direction: 'right' });
                
                // If we have neighbors, randomly pick one to connect to
                if (neighbors.length > 0) {
                    const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                    this.removeWall(x, y, neighbor.direction);
                }
            }
        }
    }
    
    generateEller() {
        // Eller's Algorithm - row-by-row generation with union-find
        const parent = new Array(this.mazeWidth * this.mazeHeight);
        const rank = new Array(this.mazeWidth * this.mazeHeight).fill(0);
        
        // Initialize union-find structure
        for (let i = 0; i < parent.length; i++) {
            parent[i] = i;
        }
        
        const find = (x) => {
            if (parent[x] !== x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        };
        
        const union = (x, y) => {
            const rootX = find(x);
            const rootY = find(y);
            
            if (rootX !== rootY) {
                if (rank[rootX] < rank[rootY]) {
                    parent[rootX] = rootY;
                } else if (rank[rootX] > rank[rootY]) {
                    parent[rootY] = rootX;
                } else {
                    parent[rootY] = rootX;
                    rank[rootX]++;
                }
                return true;
            }
            return false;
        };
        
        const getIndex = (x, y) => y * this.mazeWidth + x;
        
        // Process each row
        for (let y = 0; y < this.mazeHeight; y++) {
            // Step 1: Randomly join adjacent cells horizontally
            for (let x = 0; x < this.mazeWidth - 1; x++) {
                const current = getIndex(x, y);
                const right = getIndex(x + 1, y);
                
                // On last row, join all cells that aren't connected
                // On other rows, join randomly (but not if already connected)
                const shouldJoin = (y === this.mazeHeight - 1) ? 
                    find(current) !== find(right) : 
                    find(current) !== find(right) && Math.random() < 0.5;
                
                if (shouldJoin) {
                    union(current, right);
                    this.removeWall(x, y, 'right');
                }
            }
            
            // Step 2: Randomly join cells vertically to next row (except last row)
            if (y < this.mazeHeight - 1) {
                // Group current row cells by their connected component
                const components = new Map();
                
                for (let x = 0; x < this.mazeWidth; x++) {
                    const current = getIndex(x, y);
                    const root = find(current);
                    
                    if (!components.has(root)) {
                        components.set(root, []);
                    }
                    components.get(root).push(x);
                }
                
                // Each component must connect to at least one cell below
                for (const [root, cells] of components) {
                    // Decide how many cells from this component will connect down
                    const connectCount = Math.max(1, Math.floor(Math.random() * cells.length) + 1);
                    const shuffled = [...cells].sort(() => Math.random() - 0.5);
                    
                    for (let i = 0; i < connectCount; i++) {
                        const x = shuffled[i];
                        const current = getIndex(x, y);
                        const below = getIndex(x, y + 1);
                        
                        union(current, below);
                        this.removeWall(x, y, 'bottom');
                    }
                }
            }
        }
    }
    
    generatePrim() {
        // Minimum spanning tree approach
        const walls = [];
        const inMaze = new Array(this.mazeHeight).fill(null).map(() => new Array(this.mazeWidth).fill(false));
        
        // Start with random cell
        const startX = Math.floor(Math.random() * this.mazeWidth);
        const startY = Math.floor(Math.random() * this.mazeHeight);
        inMaze[startY][startX] = true;
        
        // Add walls of starting cell
        this.addWallsToList(startX, startY, walls, inMaze);
        
        while (walls.length > 0) {
            // Pick random wall
            const wallIndex = Math.floor(Math.random() * walls.length);
            const wall = walls.splice(wallIndex, 1)[0];
            
            const { x, y, direction, neighborX, neighborY } = wall;
            
            // If only one of the cells is in maze, add the other
            if (inMaze[y][x] !== inMaze[neighborY][neighborX]) {
                this.removeWall(x, y, direction);
                
                const newX = inMaze[y][x] ? neighborX : x;
                const newY = inMaze[y][x] ? neighborY : y;
                
                inMaze[newY][newX] = true;
                this.addWallsToList(newX, newY, walls, inMaze);
            }
        }
    }
    
    generateRecursiveDivision() {
        // Start with no walls (all connected)
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                this.maze[y][x].walls = {
                    top: y === 0,
                    right: x === this.mazeWidth - 1,
                    bottom: y === this.mazeHeight - 1,
                    left: x === 0
                };
            }
        }
        
        // Recursively divide the space
        this.divide(0, 0, this.mazeWidth, this.mazeHeight, this.chooseOrientation(this.mazeWidth, this.mazeHeight));
    }
    
    // ===== HELPER METHODS =====
    
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        
        // Check all four directions
        if (y > 0 && !this.maze[y - 1][x].visited) {
            neighbors.push({ x: x, y: y - 1 });
        }
        if (x < this.mazeWidth - 1 && !this.maze[y][x + 1].visited) {
            neighbors.push({ x: x + 1, y: y });
        }
        if (y < this.mazeHeight - 1 && !this.maze[y + 1][x].visited) {
            neighbors.push({ x: x, y: y + 1 });
        }
        if (x > 0 && !this.maze[y][x - 1].visited) {
            neighbors.push({ x: x - 1, y: y });
        }
        
        return neighbors;
    }
    
    removeWallBetween(cell1, cell2) {
        const dx = cell2.x - cell1.x;
        const dy = cell2.y - cell1.y;
        
        if (dx === 1) {
            // Moving right
            this.maze[cell1.y][cell1.x].walls.right = false;
            this.maze[cell2.y][cell2.x].walls.left = false;
        } else if (dx === -1) {
            // Moving left
            this.maze[cell1.y][cell1.x].walls.left = false;
            this.maze[cell2.y][cell2.x].walls.right = false;
        } else if (dy === 1) {
            // Moving down
            this.maze[cell1.y][cell1.x].walls.bottom = false;
            this.maze[cell2.y][cell2.x].walls.top = false;
        } else if (dy === -1) {
            // Moving up
            this.maze[cell1.y][cell1.x].walls.top = false;
            this.maze[cell2.y][cell2.x].walls.bottom = false;
        }
    }
    
    resetVisitedFlags() {
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                this.maze[y][x].visited = false;
            }
        }
    }
    
    addWallsToList(x, y, walls, inMaze) {
        const directions = [
            { dx: 0, dy: -1, dir: 'top' },
            { dx: 1, dy: 0, dir: 'right' },
            { dx: 0, dy: 1, dir: 'bottom' },
            { dx: -1, dy: 0, dir: 'left' }
        ];
        
        directions.forEach(({ dx, dy, dir }) => {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < this.mazeWidth && ny >= 0 && ny < this.mazeHeight && !inMaze[ny][nx]) {
                walls.push({
                    x: x,
                    y: y,
                    direction: dir,
                    neighborX: nx,
                    neighborY: ny
                });
            }
        });
    }
    
    divide(x, y, width, height, orientation) {
        if (width < 2 || height < 2) return;
        
        const horizontal = orientation === 'horizontal';
        
        // Where will we divide?
        const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 1)));
        const wy = y + (horizontal ? Math.floor(Math.random() * (height - 1)) : 0);
        
        // Where will the passage through the wall be?
        const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
        const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));
        
        // What direction will the wall be drawn?
        const dx = horizontal ? 1 : 0;
        const dy = horizontal ? 0 : 1;
        
        // How long will the wall be?
        const length = horizontal ? width : height;
        
        // Draw the wall
        for (let i = 0; i < length; i++) {
            if (wx + i * dx !== px || wy + i * dy !== py) {
                const cellX = wx + i * dx;
                const cellY = wy + i * dy;
                
                if (horizontal) {
                    if (cellY < this.mazeHeight) this.maze[cellY][cellX].walls.bottom = true;
                    if (cellY + 1 < this.mazeHeight) this.maze[cellY + 1][cellX].walls.top = true;
                } else {
                    if (cellX < this.mazeWidth) this.maze[cellY][cellX].walls.right = true;
                    if (cellX + 1 < this.mazeWidth) this.maze[cellY][cellX + 1].walls.left = true;
                }
            }
        }
        
        // Recursively divide the sub-areas
        if (horizontal) {
            this.divide(x, y, width, wy + 1 - y, this.chooseOrientation(width, wy + 1 - y));
            this.divide(x, wy + 1, width, y + height - wy - 1, this.chooseOrientation(width, y + height - wy - 1));
        } else {
            this.divide(x, y, wx + 1 - x, height, this.chooseOrientation(wx + 1 - x, height));
            this.divide(wx + 1, y, x + width - wx - 1, height, this.chooseOrientation(x + width - wx - 1, height));
        }
    }
    
    chooseOrientation(width, height) {
        if (width < height) return 'horizontal';
        if (height < width) return 'vertical';
        return Math.random() < 0.5 ? 'horizontal' : 'vertical';
    }
    
    // ===== SOLUTION FINDING =====
    
    findSolutionPath() {
        // Use BFS to find shortest path from start (0,0) to end (width-1, height-1)
        const queue = [{ x: 0, y: 0, path: [{ x: 0, y: 0 }] }];
        const visited = new Set();
        visited.add('0,0');
        
        const directions = [
            { dx: 0, dy: -1, dir: 'up' },
            { dx: 1, dy: 0, dir: 'right' },
            { dx: 0, dy: 1, dir: 'down' },
            { dx: -1, dy: 0, dir: 'left' }
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check if we reached the end
            if (current.x === this.mazeWidth - 1 && current.y === this.mazeHeight - 1) {
                return current.path;
            }
            
            // Early termination for performance on very large mazes
            if (visited.size > this.mazeWidth * this.mazeHeight * 0.8) {
                console.warn('Pathfinding terminated early to prevent performance issues');
                break;
            }
            
            // Explore neighbors
            for (const { dx, dy, dir } of directions) {
                const newX = current.x + dx;
                const newY = current.y + dy;
                const key = `${newX},${newY}`;
                
                // Check bounds
                if (newX < 0 || newX >= this.mazeWidth || newY < 0 || newY >= this.mazeHeight) {
                    continue;
                }
                
                // Check if already visited
                if (visited.has(key)) {
                    continue;
                }
                
                // Check if we can move in this direction
                if (this.canMove(current.x, current.y, dir)) {
                    visited.add(key);
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }]
                    });
                }
            }
        }
        
        return []; // No path found
    }
    
    drawSolutionPath() {
        if (this.solutionPath.length < 2) return;
        
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw path segments
        this.ctx.beginPath();
        const firstCell = this.solutionPath[0];
        this.ctx.moveTo(
            (firstCell.x + 0.5) * this.cellSize,
            (firstCell.y + 0.5) * this.cellSize
        );
        
        for (let i = 1; i < this.solutionPath.length; i++) {
            const cell = this.solutionPath[i];
            this.ctx.lineTo(
                (cell.x + 0.5) * this.cellSize,
                (cell.y + 0.5) * this.cellSize
            );
        }
        
        this.ctx.stroke();
        
        // Draw path dots for better visibility
        this.ctx.fillStyle = '#f39c12';
        for (const cell of this.solutionPath) {
            this.ctx.beginPath();
            this.ctx.arc(
                (cell.x + 0.5) * this.cellSize,
                (cell.y + 0.5) * this.cellSize,
                3,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
        }
    }
    
    // ===== TESTING METHODS =====
    
    runAutomatedTests() {
        console.log('🧪 Running Maze Game Automated Tests...\n');
        
        const results = {
            algorithmTests: this.testAllAlgorithms(),
            connectivityTests: this.testMazeConnectivity(),
            boundaryTests: this.testMazeBoundaries(),
            performanceTests: this.testPerformance()
        };
        
        this.displayTestResults(results);
        return results;
    }
    
    testAllAlgorithms() {
        const algorithms = ['recursive-backtracking', 'binary-tree', 'eller', 'prim', 'recursive-division'];
        const results = {};
        
        algorithms.forEach(algorithm => {
            console.log(`Testing ${algorithm}...`);
            const originalAlgorithm = document.getElementById('algorithm').value;
            document.getElementById('algorithm').value = algorithm;
            
            try {
                this.initializeMazeStructure();
                
                switch (algorithm) {
                    case 'recursive-backtracking':
                        this.generateRecursiveBacktracking();
                        break;
                    case 'binary-tree':
                        this.generateBinaryTree();
                        break;
                    case 'eller':
                        this.generateEller();
                        break;
                    case 'prim':
                        this.generatePrim();
                        break;
                    case 'recursive-division':
                        this.generateRecursiveDivision();
                        break;
                }
                
                results[algorithm] = {
                    generated: true,
                    valid: this.validateMazeStructure(),
                    hasPath: this.findSolutionPath().length > 0
                };
                
            } catch (error) {
                results[algorithm] = {
                    generated: false,
                    error: error.message
                };
            }
            
            document.getElementById('algorithm').value = originalAlgorithm;
        });
        
        return results;
    }
    
    testMazeConnectivity() {
        const sizes = ['small', 'medium', 'large'];
        const results = {};
        
        const originalSize = document.getElementById('size').value;
        
        sizes.forEach(size => {
            document.getElementById('size').value = size;
            this.resizeCanvas(size);
            
            this.initializeMazeStructure();
            this.generateRecursiveBacktracking(); // Use reliable algorithm
            
            const path = this.findSolutionPath();
            results[size] = {
                hasPath: path.length > 0,
                pathLength: path.length,
                reachableRatio: this.calculateReachableCells() / (this.mazeWidth * this.mazeHeight)
            };
        });
        
        document.getElementById('size').value = originalSize;
        this.resizeCanvas(originalSize);
        
        return results;
    }
    
    testMazeBoundaries() {
        this.initializeMazeStructure();
        this.generateRecursiveBacktracking();
        
        const results = {
            topWalls: true,
            rightWalls: true,
            bottomWalls: true,
            leftWalls: true
        };
        
        // Check top boundary
        for (let x = 0; x < this.mazeWidth; x++) {
            if (!this.maze[0][x].walls.top) {
                results.topWalls = false;
                break;
            }
        }
        
        // Check right boundary
        for (let y = 0; y < this.mazeHeight; y++) {
            if (!this.maze[y][this.mazeWidth - 1].walls.right) {
                results.rightWalls = false;
                break;
            }
        }
        
        // Check bottom boundary
        for (let x = 0; x < this.mazeWidth; x++) {
            if (!this.maze[this.mazeHeight - 1][x].walls.bottom) {
                results.bottomWalls = false;
                break;
            }
        }
        
        // Check left boundary
        for (let y = 0; y < this.mazeHeight; y++) {
            if (!this.maze[y][0].walls.left) {
                results.leftWalls = false;
                break;
            }
        }
        
        return results;
    }
    
    testPerformance() {
        const results = {};
        const sizes = ['small', 'medium', 'large'];
        const originalSize = document.getElementById('size').value;
        
        sizes.forEach(size => {
            document.getElementById('size').value = size;
            this.resizeCanvas(size);
            
            const startTime = performance.now();
            this.initializeMazeStructure();
            this.generateRecursiveBacktracking();
            const endTime = performance.now();
            
            results[size] = {
                generationTime: Math.round(endTime - startTime),
                cellCount: this.mazeWidth * this.mazeHeight,
                timePerCell: (endTime - startTime) / (this.mazeWidth * this.mazeHeight)
            };
        });
        
        document.getElementById('size').value = originalSize;
        this.resizeCanvas(originalSize);
        
        return results;
    }
    
    validateMazeStructure() {
        // Check if maze structure is valid
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const cell = this.maze[y][x];
                
                // Check if cell has all required properties
                if (!cell.walls || typeof cell.walls !== 'object') {
                    return false;
                }
                
                if (typeof cell.walls.top !== 'boolean' ||
                    typeof cell.walls.right !== 'boolean' ||
                    typeof cell.walls.bottom !== 'boolean' ||
                    typeof cell.walls.left !== 'boolean') {
                    return false;
                }
            }
        }
        return true;
    }
    
    calculateReachableCells() {
        const visited = new Set();
        const stack = [{ x: 0, y: 0 }];
        visited.add('0,0');
        
        while (stack.length > 0) {
            const current = stack.pop();
            
            const directions = [
                { dx: 0, dy: -1, dir: 'up' },
                { dx: 1, dy: 0, dir: 'right' },
                { dx: 0, dy: 1, dir: 'down' },
                { dx: -1, dy: 0, dir: 'left' }
            ];
            
            for (const { dx, dy, dir } of directions) {
                const newX = current.x + dx;
                const newY = current.y + dy;
                const key = `${newX},${newY}`;
                
                if (newX >= 0 && newX < this.mazeWidth && 
                    newY >= 0 && newY < this.mazeHeight &&
                    !visited.has(key) && 
                    this.canMove(current.x, current.y, dir)) {
                    visited.add(key);
                    stack.push({ x: newX, y: newY });
                }
            }
        }
        
        return visited.size;
    }
    
    displayTestResults(results) {
        console.log('\n📊 TEST RESULTS SUMMARY\n');
        
        // Algorithm Tests
        console.log('🔧 Algorithm Generation Tests:');
        Object.entries(results.algorithmTests).forEach(([algorithm, result]) => {
            const status = result.generated && result.valid && result.hasPath ? '✅' : '❌';
            console.log(`  ${status} ${algorithm}: Generated=${result.generated}, Valid=${result.valid}, HasPath=${result.hasPath}`);
        });
        
        // Connectivity Tests
        console.log('\n🔗 Connectivity Tests:');
        Object.entries(results.connectivityTests).forEach(([size, result]) => {
            const status = result.hasPath && result.reachableRatio > 0.8 ? '✅' : '❌';
            console.log(`  ${status} ${size}: Path=${result.hasPath}, Length=${result.pathLength}, Reachable=${Math.round(result.reachableRatio * 100)}%`);
        });
        
        // Boundary Tests
        console.log('\n🚧 Boundary Tests:');
        const boundaryStatus = Object.values(results.boundaryTests).every(v => v) ? '✅' : '❌';
        console.log(`  ${boundaryStatus} All boundaries: Top=${results.boundaryTests.topWalls}, Right=${results.boundaryTests.rightWalls}, Bottom=${results.boundaryTests.bottomWalls}, Left=${results.boundaryTests.leftWalls}`);
        
        // Performance Tests
        console.log('\n⚡ Performance Tests:');
        Object.entries(results.performanceTests).forEach(([size, result]) => {
            const status = result.generationTime < 5000 ? '✅' : '❌'; // < 5 seconds
            console.log(`  ${status} ${size}: ${result.generationTime}ms (${result.cellCount} cells, ${result.timePerCell.toFixed(2)}ms/cell)`);
        });
        
        console.log('\n🎯 Test completed! Check console for detailed results.');
    }
    
    debugEller() {
        console.log('🔍 Debugging Eller\'s Algorithm...');
        
        // Generate a small maze for easier debugging
        const originalSize = document.getElementById('size').value;
        document.getElementById('size').value = 'small';
        this.resizeCanvas('small');
        
        this.initializeMazeStructure();
        this.generateEller();
        
        // Check connectivity
        const path = this.findSolutionPath();
        const reachable = this.calculateReachableCells();
        const total = this.mazeWidth * this.mazeHeight;
        
        console.log(`Maze size: ${this.mazeWidth}x${this.mazeHeight}`);
        console.log(`Path found: ${path.length > 0 ? 'YES' : 'NO'}`);
        console.log(`Path length: ${path.length}`);
        console.log(`Reachable cells: ${reachable}/${total} (${Math.round(reachable/total*100)}%)`);
        
        // Restore original size
        document.getElementById('size').value = originalSize;
        this.resizeCanvas(originalSize);
        
        this.render();
        
        if (path.length === 0) {
            console.log('❌ Eller\'s maze is NOT solvable - investigating...');
            this.analyzeConnectivity();
        } else {
            console.log('✅ Eller\'s maze appears solvable');
        }
    }
    
    analyzeConnectivity() {
        // Find all connected components
        const visited = new Array(this.mazeHeight).fill(null).map(() => new Array(this.mazeWidth).fill(false));
        const components = [];
        
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                if (!visited[y][x]) {
                    const component = this.exploreComponent(x, y, visited);
                    components.push(component);
                }
            }
        }
        
        console.log(`Found ${components.length} connected components:`);
        components.forEach((component, i) => {
            const hasStart = component.some(cell => cell.x === 0 && cell.y === 0);
            const hasEnd = component.some(cell => cell.x === this.mazeWidth - 1 && cell.y === this.mazeHeight - 1);
            console.log(`  Component ${i + 1}: ${component.length} cells${hasStart ? ' (has START)' : ''}${hasEnd ? ' (has END)' : ''}`);
        });
    }
    
    exploreComponent(startX, startY, visited) {
        const component = [];
        const stack = [{ x: startX, y: startY }];
        visited[startY][startX] = true;
        
        while (stack.length > 0) {
            const current = stack.pop();
            component.push(current);
            
            const directions = [
                { dx: 0, dy: -1, dir: 'up' },
                { dx: 1, dy: 0, dir: 'right' },
                { dx: 0, dy: 1, dir: 'down' },
                { dx: -1, dy: 0, dir: 'left' }
            ];
            
            for (const { dx, dy, dir } of directions) {
                const newX = current.x + dx;
                const newY = current.y + dy;
                
                if (newX >= 0 && newX < this.mazeWidth && 
                    newY >= 0 && newY < this.mazeHeight &&
                    !visited[newY][newX] && 
                    this.canMove(current.x, current.y, dir)) {
                    visited[newY][newX] = true;
                    stack.push({ x: newX, y: newY });
                }
            }
        }
        
        return component;
    }
    
    // ===== SETTINGS MODAL SYSTEM =====
    
    setupSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeBtn = settingsModal.querySelector('.close-btn');
        const characterPreview = document.getElementById('character-preview');
        
        // Set initial character preview
        characterPreview.textContent = this.selectedCharacter;
        
        // Initialize settings controls
        this.initializeSettingsControls();
        
        // Settings button click
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
            this.populateCharacterGrid('faces'); // Default to faces category
        });
        
        // Close modal
        closeBtn.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });
        
        // Close modal when clicking outside
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });
        
        // Category tab switching
        const tabButtons = settingsModal.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active tab
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Populate character grid for selected category
                const category = btn.dataset.category;
                this.populateCharacterGrid(category);
            });
        });
    }
    
    populateCharacterGrid(category) {
        const characterGrid = document.getElementById('character-grid');
        const characters = this.characterOptions[category];
        
        // Clear existing characters
        characterGrid.innerHTML = '';
        
        // Add character options
        characters.forEach(character => {
            const characterOption = document.createElement('div');
            characterOption.className = 'character-option';
            characterOption.textContent = character;
            
            // Mark current character as selected
            if (character === this.selectedCharacter) {
                characterOption.classList.add('selected');
            }
            
            // Character selection handler
            characterOption.addEventListener('click', () => {
                this.selectCharacter(character);
                
                // Update visual selection
                characterGrid.querySelectorAll('.character-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                characterOption.classList.add('selected');
            });
            
            characterGrid.appendChild(characterOption);
        });
    }
    
    selectCharacter(character) {
        this.selectedCharacter = character;
        
        // Update character preview in modal
        document.getElementById('character-preview').textContent = character;
        
        // Save to localStorage
        localStorage.setItem('mazeGameCharacter', character);
        
        // Redraw game if maze exists
        if (this.maze) {
            this.render();
        }
        
        // Update status
        this.updateStatus(`Character changed to ${character}! 🎉`, 'success');
    }
    
    initializeSettingsControls() {
        // Sound Effects Toggle
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.checked = this.settings.soundEnabled;
        soundToggle.addEventListener('change', () => {
            this.settings.soundEnabled = soundToggle.checked;
            localStorage.setItem('mazeGameSoundEnabled', JSON.stringify(this.settings.soundEnabled));
        });
        
        // Animation Speed Slider
        const animationSpeedSlider = document.getElementById('animation-speed');
        const animationSpeedValue = document.getElementById('animation-speed-value');
        animationSpeedSlider.value = this.settings.animationSpeed;
        animationSpeedValue.textContent = `${this.settings.animationSpeed}ms`;
        
        animationSpeedSlider.addEventListener('input', () => {
            const value = parseInt(animationSpeedSlider.value);
            this.settings.animationSpeed = value;
            this.animationDuration = value;
            animationSpeedValue.textContent = `${value}ms`;
            localStorage.setItem('mazeGameAnimationSpeed', value.toString());
        });
        
        // Generation Delay Slider
        const generationDelaySlider = document.getElementById('generation-delay');
        const generationDelayValue = document.getElementById('generation-delay-value');
        generationDelaySlider.value = this.settings.generationDelay;
        generationDelayValue.textContent = `${this.settings.generationDelay}ms`;
        
        generationDelaySlider.addEventListener('input', () => {
            const value = parseInt(generationDelaySlider.value);
            this.settings.generationDelay = value;
            generationDelayValue.textContent = `${value}ms`;
            localStorage.setItem('mazeGameGenerationDelay', value.toString());
        });
        
        // Show Trail Toggle
        const trailToggle = document.getElementById('trail-toggle');
        trailToggle.checked = this.settings.showTrail;
        trailToggle.addEventListener('change', () => {
            this.settings.showTrail = trailToggle.checked;
            localStorage.setItem('mazeGameShowTrail', JSON.stringify(this.settings.showTrail));
            if (!this.settings.showTrail) {
                this.playerTrail = [];
                if (this.maze) {
                    this.render();
                }
            }
        });
        
        // Reset Settings Button
        const resetSettingsBtn = document.getElementById('reset-settings');
        resetSettingsBtn.addEventListener('click', () => {
            this.resetAllSettings();
        });
    }
    
    resetAllSettings() {
        // Confirm with user
        if (!confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
            return;
        }
        
        // Reset to default values
        this.settings = {
            soundEnabled: true,
            animationSpeed: 200,
            generationDelay: 50,
            showTrail: false
        };
        
        this.selectedCharacter = '❤️';
        this.animationDuration = 200;
        this.playerTrail = [];
        
        // Clear localStorage
        localStorage.removeItem('mazeGameSoundEnabled');
        localStorage.removeItem('mazeGameAnimationSpeed');
        localStorage.removeItem('mazeGameGenerationDelay');
        localStorage.removeItem('mazeGameShowTrail');
        localStorage.removeItem('mazeGameCharacter');
        
        // Update UI controls
        this.initializeSettingsControls();
        
        // Update character preview
        document.getElementById('character-preview').textContent = this.selectedCharacter;
        
        // Redraw game if maze exists
        if (this.maze) {
            this.render();
        }
        
        // Show feedback
        alert('All settings have been reset to default values.');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MazeGame();
});