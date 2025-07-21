// Game variables
let canvas, ctx;
let snake = [];
let direction = { x: 0, y: 0 };
let food = {};
let score = 0;
let highScore = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop;

// Game settings
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const GAME_SPEED = 150;

// Colors
const COLORS = {
    snake: '#4CAF50',
    snakeHead: '#45a049',
    food: '#ff6b6b',
    background: '#2a2a3a',
    grid: '#3a3a4a'
};

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('gameBoard');
    ctx = canvas.getContext('2d');
    
    // Load high score from localStorage
    highScore = localStorage.getItem('snakeHighScore') || 0;
    document.getElementById('highScore').textContent = highScore;
    
    setupEventListeners();
    drawGrid();
    showStartScreen();
});

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Prevent arrow key scrolling
    window.addEventListener("keydown", function(e) {
        if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, false);
    
    // Touch controls for mobile
    let touchStartX, touchStartY;
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (!touchStartX || !touchStartY) return;
        
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;
        
        let deltaX = touchEndX - touchStartX;
        let deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 30) changeDirection('right');
            else if (deltaX < -30) changeDirection('left');
        } else {
            // Vertical swipe
            if (deltaY > 30) changeDirection('down');
            else if (deltaY < -30) changeDirection('up');
        }
        
        touchStartX = null;
        touchStartY = null;
    });
}

function handleKeyPress(e) {
    if (!gameRunning && e.code === 'Space') {
        startGame();
        return;
    }
    
    if (gameRunning && e.code === 'Space') {
        togglePause();
        return;
    }
    
    // Movement controls
    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            changeDirection('up');
            break;
        case 'arrowdown':
        case 's':
            changeDirection('down');
            break;
        case 'arrowleft':
        case 'a':
            changeDirection('left');
            break;
        case 'arrowright':
        case 'd':
            changeDirection('right');
            break;
        case 'p':
            if (gameRunning) togglePause();
            break;
        case 'r':
            resetGame();
            break;
    }
}

function changeDirection(newDirection) {
    if (!gameRunning || gamePaused) return;
    
    const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    // Prevent reversing into itself
    const currentDirection = getCurrentDirection();
    if (opposites[newDirection] === currentDirection) return;
    
    switch(newDirection) {
        case 'up':
            direction = { x: 0, y: -GRID_SIZE };
            break;
        case 'down':
            direction = { x: 0, y: GRID_SIZE };
            break;
        case 'left':
            direction = { x: -GRID_SIZE, y: 0 };
            break;
        case 'right':
            direction = { x: GRID_SIZE, y: 0 };
            break;
    }
}

function getCurrentDirection() {
    if (direction.x === 0 && direction.y === -GRID_SIZE) return 'up';
    if (direction.x === 0 && direction.y === GRID_SIZE) return 'down';
    if (direction.x === -GRID_SIZE && direction.y === 0) return 'left';
    if (direction.x === GRID_SIZE && direction.y === 0) return 'right';
    return null;
}

function startGame() {
    // Reset game state
    snake = [
        { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }
    ];
    direction = { x: GRID_SIZE, y: 0 }; // Start moving right
    score = 0;
    gameRunning = true;
    gamePaused = false;
    
    // Hide overlays
    hideOverlays();
    
    // Generate first food
    generateFood();
    
    // Update UI
    updateScore();
    
    // Start game loop
    gameLoop = setInterval(update, GAME_SPEED);
}

function update() {
    if (!gameRunning || gamePaused) return;
    
    // Move snake
    moveSnake();
    
    // Check collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Check food collision
    if (checkFoodCollision()) {
        eatFood();
        generateFood();
        updateScore();
    }
    
    // Draw everything
    draw();
}

function moveSnake() {
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    snake.unshift(head);
    
    // Remove tail if no food was eaten
    if (!checkFoodCollision()) {
        snake.pop();
    }
}

function checkCollisions() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= CANVAS_SIZE || 
        head.y < 0 || head.y >= CANVAS_SIZE) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function checkFoodCollision() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

function eatFood() {
    score += 10;
    
    // Add visual feedback
    document.querySelector('.score-display').classList.add('pulse');
    setTimeout(() => {
        document.querySelector('.score-display').classList.remove('pulse');
    }, 500);
}

function generateFood() {
    let validPosition = false;
    
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE,
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE
        };
        
        // Make sure food doesn't spawn on snake
        validPosition = !snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw grid
    drawGrid();
    
    // Draw food with glow effect
    drawFood();
    
    // Draw snake
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw head with gradient
            const gradient = ctx.createRadialGradient(
                segment.x + GRID_SIZE/2, segment.y + GRID_SIZE/2, 0,
                segment.x + GRID_SIZE/2, segment.y + GRID_SIZE/2, GRID_SIZE/2
            );
            gradient.addColorStop(0, COLORS.snakeHead);
            gradient.addColorStop(1, COLORS.snake);
            ctx.fillStyle = gradient;
        } else {
            // Draw body
            ctx.fillStyle = COLORS.snake;
        }
        
        ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        // Add some shine
        if (index === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(segment.x + 3, segment.y + 3, GRID_SIZE - 10, GRID_SIZE - 10);
        }
    });
}

function drawFood() {
    // Draw food with pulsing glow effect
    const time = Date.now() * 0.005;
    const glowSize = 2 + Math.sin(time) * 1;
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.food;
    
    // Main food
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(food.x + 2, food.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(food.x + 4, food.y + 4, GRID_SIZE - 12, GRID_SIZE - 12);
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('overlayTitle').textContent = score > 0 ? 'Game Over!' : 'Game Over!';
    document.getElementById('overlayMessage').innerHTML = 
        score === highScore && score > 0 ? 
        `🎉 New High Score: <span>${score}</span>!` : 
        `Your Score: <span>${score}</span>`;
    
    document.getElementById('gameOverlay').classList.remove('hidden');
    document.getElementById('gameOverlay').classList.add('fade-in');
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(gameLoop);
        // Could add pause overlay here
    } else {
        gameLoop = setInterval(update, GAME_SPEED);
    }
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(gameLoop);
    
    // Reset display
    drawGrid();
    hideOverlays();
    showStartScreen();
}

function showStartScreen() {
    document.getElementById('startOverlay').classList.remove('hidden');
}

function hideOverlays() {
    document.getElementById('gameOverlay').classList.add('hidden');
    document.getElementById('startOverlay').classList.add('hidden');
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

// Initialize the game when the page loads
window.addEventListener('load', function() {
    // Add some initial animations
    document.querySelector('.container').classList.add('fade-in');
});