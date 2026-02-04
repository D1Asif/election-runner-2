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
let buildings = [];
let backgroundOffset = 0;

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
    
    // Generate initial buildings for start screen
    generateBuildings();
    
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
    generateBuildings();
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
    backgroundOffset += player.speed * 2; // Faster building scrolling
    
    if (distance >= TARGET_DISTANCE) {
        gameState = GAME_STATES.END;
    }
}

function generateBuildings() {
    buildings = [];
    const buildingColors = ['#FFD699', '#99CCFF', '#FF9999'];
    const numberOfBuildings = 25;
    
    for (let i = 0; i < numberOfBuildings; i++) {
        const buildingType = Math.floor(Math.random() * 3);
        buildings.push({
            x: i * 180,
            width: 100 + Math.random() * 100,
            height: 180 + Math.random() * 220,
            color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
            type: buildingType,
            windows: generateWindows(),
            hasBalcony: Math.random() > 0.7,
            hasRoof: Math.random() > 0.5
        });
    }
}

function generateWindows() {
    const windows = [];
    const rows = 3 + Math.floor(Math.random() * 4);
    const cols = 2 + Math.floor(Math.random() * 3);
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            windows.push({
                row: row,
                col: col
            });
        }
    }
    return windows;
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw buildings
    drawBuildings();
    
    // Ground
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 450, CANVAS_WIDTH, 150);
    
    // Sidewalk
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 430, CANVAS_WIDTH, 20);
}

function drawBuildings() {
    buildings.forEach(building => {
        // Calculate scrolling position
        let drawX = building.x - backgroundOffset;
        
        // Improved infinite scrolling - handle multiple wraps
        const buildingSpacing = 180;
        const totalBuildingsWidth = buildings.length * buildingSpacing;
        
        // Normalize the position to handle multiple wraps
        while (drawX + building.width < 0) {
            drawX += totalBuildingsWidth;
        }
        while (drawX > CANVAS_WIDTH) {
            drawX -= totalBuildingsWidth;
        }
        
        // Only draw if building is visible
        if (drawX + building.width >= 0 && drawX <= CANVAS_WIDTH) {
            // Draw building shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(drawX + 5, 455 - building.height, building.width, building.height);
            
            // Draw main building
            ctx.fillStyle = building.color;
            ctx.fillRect(drawX, 450 - building.height, building.width, building.height);
            
            // Draw building outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, 450 - building.height, building.width, building.height);
            
            // Calculate window grid properly
            const windowWidth = 18;
            const windowHeight = 25;
            const margin = 15;
            const availableWidth = building.width - (margin * 2);
            const availableHeight = building.height - 60; // Leave space for door and roof
            
            const windowCols = Math.max(2, Math.floor(availableWidth / (windowWidth + 15)));
            const windowRows = Math.max(3, Math.floor(availableHeight / (windowHeight + 15)));
            
            const windowSpacingX = availableWidth / (windowCols + 1);
            const windowSpacingY = availableHeight / (windowRows + 1);
            
            // Draw windows within building bounds
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    const windowX = drawX + margin + windowSpacingX * (col + 1);
                    const windowY = 450 - building.height + 30 + windowSpacingY * (row + 1);
                    
                    // Ensure windows stay within building bounds
                    if (windowX + windowWidth <= drawX + building.width - margin && 
                        windowY + windowHeight <= 450 - 30) {
                        // Window frame
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
                        
                        // Window glass (some windows lit)
                        if (Math.random() > 0.3) {
                            ctx.fillStyle = '#FFFF99';
                            ctx.fillRect(windowX + 2, windowY + 2, windowWidth - 4, windowHeight - 4);
                        }
                    }
                }
            }
            
            // Draw balcony
            if (building.hasBalcony && building.width > 80) {
                ctx.fillStyle = '#8B4513';
                const balconyY = 450 - building.height * 0.6;
                const balconyWidth = Math.min(building.width - 40, 60);
                const balconyX = drawX + (building.width - balconyWidth) / 2;
                ctx.fillRect(balconyX, balconyY, balconyWidth, 8);
                
                // Balcony railing
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(balconyX + i * balconyWidth / 3, balconyY);
                    ctx.lineTo(balconyX + i * balconyWidth / 3, balconyY - 10);
                    ctx.stroke();
                }
            }
            
            // Draw roof
            if (building.hasRoof) {
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(drawX - 10, 450 - building.height);
                ctx.lineTo(drawX + building.width / 2, 450 - building.height - 30);
                ctx.lineTo(drawX + building.width + 10, 450 - building.height);
                ctx.closePath();
                ctx.fill();
            }
            
            // Draw door
            ctx.fillStyle = '#654321';
            const doorWidth = 35;
            const doorHeight = 45;
            const doorX = drawX + (building.width - doorWidth) / 2;
            const doorY = 450 - doorHeight;
            ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
            
            // Door knob
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(doorX + doorWidth - 8, doorY + doorHeight / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
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
