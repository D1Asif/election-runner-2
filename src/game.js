// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_SPEED = 5;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const TARGET_DISTANCE = 501;

// Game States
const GAME_STATES = {
    START: 'START',
    GAME: 'GAME',
    END: 'END'
};

// Game Variables
let canvas, ctx;
let gameState = GAME_STATES.START;
let distance = 0;
let hearts = 3;
let animationId;

// Player object
let player = {
    x: 100,
    y: 400,
    width: 50,
    height: 50,
    velocityY: 0,
    isJumping: false,
    speed: GAME_SPEED
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add input listeners
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch);
    
    // Start game loop
    gameLoop();
}

function resizeCanvas() {
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    
    let newWidth = maxWidth;
    let newHeight = newWidth / aspectRatio;
    
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    }
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
}

function handleClick(e) {
    e.preventDefault();
    handleInput();
}

function handleTouch(e) {
    e.preventDefault();
    handleInput();
}

function handleInput() {
    if (gameState === GAME_STATES.START) {
        startGame();
    } else if (gameState === GAME_STATES.GAME) {
        playerJump();
    }
}

function startGame() {
    gameState = GAME_STATES.GAME;
    distance = 0;
    hearts = 3;
    resetPlayer();
}

function resetPlayer() {
    player.y = 400;
    player.velocityY = 0;
    player.isJumping = false;
}

function playerJump() {
    if (!player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
    }
}

function updatePlayer() {
    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // Ground collision
    const groundY = 400;
    if (player.y > groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

function updateDistance() {
    distance += player.speed / 60; // Convert to meters (assuming 60 FPS)
    
    if (distance >= TARGET_DISTANCE) {
        gameState = GAME_STATES.END;
    }
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Ground
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 450, CANVAS_WIDTH, 150);
    
    // Sidewalk
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 430, CANVAS_WIDTH, 20);
}

function drawPlayer() {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawStartScreen() {
    drawBackground();
    
    // Draw "Tap to Start" text
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = 'Tap to Start';
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

function drawGameScreen() {
    drawBackground();
    drawPlayer();
    
    // Draw distance
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const distanceText = `${Math.floor(distance)} / ${TARGET_DISTANCE} meters`;
    ctx.strokeText(distanceText, 20, 20);
    ctx.fillText(distanceText, 20, 20);
    
    // Draw hearts
    drawHearts();
}

function drawHearts() {
    ctx.fillStyle = '#FF4C4C';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < hearts; i++) {
        const x = CANVAS_WIDTH - 100 + (i * 30);
        const y = 30;
        
        // Draw simple heart shape
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.bezierCurveTo(x, y, x - 10, y, x - 10, y + 10);
        ctx.bezierCurveTo(x - 10, y + 20, x, y + 30, x, y + 30);
        ctx.bezierCurveTo(x, y + 30, x + 10, y + 20, x + 10, y + 10);
        ctx.bezierCurveTo(x + 10, y, x, y, x, y + 10);
        ctx.fill();
        ctx.stroke();
    }
}

function drawEndScreen() {
    drawBackground();
    
    // Draw "501" text
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.font = 'bold 60px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = '501';
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update and draw based on game state
    switch (gameState) {
        case GAME_STATES.START:
            drawStartScreen();
            break;
            
        case GAME_STATES.GAME:
            updatePlayer();
            updateDistance();
            drawGameScreen();
            break;
            
        case GAME_STATES.END:
            drawEndScreen();
            break;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);
