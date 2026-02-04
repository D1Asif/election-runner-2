// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_SPEED = 5;
const GRAVITY = 0.8;
const JUMP_FORCE = -20; // Increased from -15 for higher jumps
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
let entities = [];
let lastSpawnTime = 0;
let spawnInterval = 2000; // Spawn every 2 seconds
let collisionFeedback = [];
let endGameTimer = 0;
let playerZoom = 1;
let playerAlpha = 1;
let endGamePhase = 'arriving'; // 'arriving', 'standing', 'disappearing', 'complete'

// Player object
let player = {
    x: 100,
    y: 400,
    width: 80,  // Increased from 70 (+15%)
    height: 80, // Increased from 70 (+15%)
    originalWidth: 80,
    originalHeight: 80,
    velocityY: 0,
    isJumping: false,
    speed: GAME_SPEED,
    currentFrame: 0,
    frameTimer: 0,
    frameInterval: 8, // Faster animation for proper running motion
    currentAnimation: 'run'
};

// Sprite images
let playerRunSprite = null;
let playerJumpSprite = null;
let playerStandSprite = null;
let policeSprite = null;
let journalistSprite = null;
let femaleModelSprite = null;
let spritesLoaded = false;

// Sound effects
let femaleInteractionSound = null;
let obstacleSound = null;
let finalSound = null;
let soundsLoaded = false;

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Improve image rendering quality
    ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels
    ctx.imageSmoothingQuality = 'high';
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add input listeners
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch);
    
    // Load sprites
    loadSprites();
    
    // Load sounds
    loadSounds();
    
    // Generate initial buildings for start screen
    generateBuildings();
    
    // Start game loop
    gameLoop();
}

function loadSprites() {
    playerRunSprite = new Image();
    playerJumpSprite = new Image();
    playerStandSprite = new Image();
    policeSprite = new Image();
    journalistSprite = new Image();
    femaleModelSprite = new Image();
    
    let loadedCount = 0;
    const totalSprites = 6;
    
    playerRunSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    playerJumpSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    playerStandSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    policeSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    journalistSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    femaleModelSprite.onload = function() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            spritesLoaded = true;
        }
    };
    
    playerRunSprite.src = 'src/assets/images/player_run_3x3.png';
    playerJumpSprite.src = 'src/assets/images/player_jump_3x3.png';
    playerStandSprite.src = 'src/assets/images/player_stand.png';
    policeSprite.src = 'src/assets/images/police_2x3.png';
    journalistSprite.src = 'src/assets/images/journalist_2x4.png';
    femaleModelSprite.src = 'src/assets/images/female_model_2x4.png';
}

function loadSounds() {
    femaleInteractionSound = new Audio();
    obstacleSound = new Audio();
    finalSound = new Audio();
    
    let loadedCount = 0;
    const totalSounds = 3;
    
    femaleInteractionSound.addEventListener('canplaythrough', function() {
        loadedCount++;
        if (loadedCount === totalSounds) {
            soundsLoaded = true;
        }
    });
    
    obstacleSound.addEventListener('canplaythrough', function() {
        loadedCount++;
        if (loadedCount === totalSounds) {
            soundsLoaded = true;
        }
    });
    
    finalSound.addEventListener('canplaythrough', function() {
        loadedCount++;
        if (loadedCount === totalSounds) {
            soundsLoaded = true;
        }
    });
    
    femaleInteractionSound.src = 'src/assets/sounds/Female_interaction.m4a';
    obstacleSound.src = 'src/assets/sounds/obstacle.m4a';
    finalSound.src = 'src/assets/sounds/final.m4a';
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
    if (gameState === GAME_STATES.END) {
        handleEndScreenClick(e);
    } else {
        handleInput();
    }
}

function handleTouch(e) {
    e.preventDefault();
    if (gameState === GAME_STATES.END) {
        handleEndScreenClick(e.touches[0]);
    } else {
        handleInput();
    }
}

function handleInput() {
    if (gameState === GAME_STATES.START) {
        startGame();
    } else if (gameState === GAME_STATES.GAME) {
        playerJump();
    }
}

function handleEndScreenClick(eventData) {
    if (!window.endScreenButtons) return;
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (eventData.clientX - rect.left) * scaleX;
    const clickY = (eventData.clientY - rect.top) * scaleY;
    
    // Check Play Again button
    const playAgainBtn = window.endScreenButtons.playAgain;
    if (clickX >= playAgainBtn.x && clickX <= playAgainBtn.x + playAgainBtn.width &&
        clickY >= playAgainBtn.y && clickY <= playAgainBtn.y + playAgainBtn.height) {
        resetGame();
        return;
    }
    
    // Check Website button
    const websiteBtn = window.endScreenButtons.website;
    if (clickX >= websiteBtn.x && clickX <= websiteBtn.x + websiteBtn.width &&
        clickY >= websiteBtn.y && clickY <= websiteBtn.y + websiteBtn.height) {
        window.open('https://google.com', '_blank');
        return;
    }
}

function startGame() {
    gameState = GAME_STATES.GAME;
    distance = 0;
    hearts = 3;
    resetPlayer();
    generateBuildings();
    entities = [];
    lastSpawnTime = 0;
    collisionFeedback = [];
}

function resetPlayer() {
    player.x = 100;
    player.y = 400;
    player.velocityY = 0;
    player.isJumping = false;
    player.currentAnimation = 'run';
    player.currentFrame = 0;
    player.frameTimer = 0;
    player.width = player.originalWidth;
    player.height = player.originalHeight;
}

function playerJump() {
    if (!player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
        player.currentAnimation = 'jump';
        player.currentFrame = 0;
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
        player.currentAnimation = 'run';
        player.currentFrame = 0;
    }
    
    // Update animation
    updatePlayerAnimation();
}

function updatePlayerAnimation() {
    player.frameTimer++;
    
    if (player.frameTimer >= player.frameInterval) {
        player.frameTimer = 0;
        player.currentFrame++;
        
        // For running animation, use first 6 frames (first 2 rows) for better running motion
        if (player.currentAnimation === 'run') {
            if (player.currentFrame >= 6) {
                player.currentFrame = 0;
            }
        } else {
            // For jumping animation, use all 9 frames
            const totalFrames = 9;
            if (player.currentFrame >= totalFrames) {
                player.currentFrame = 0;
            }
        }
    }
}

function updateDistance() {
    distance += player.speed / 60; // Convert to meters (assuming 60 FPS)
    backgroundOffset += player.speed * 2; // Faster building scrolling
    
    // Spawn entities
    spawnEntities();
    
    // Update entities
    updateEntities();
    
    // Check collisions
    checkCollisions();
    
    // Update collision feedback
    updateCollisionFeedback();
    
    if (distance >= TARGET_DISTANCE && gameState === GAME_STATES.GAME) {
        // Start end game sequence instead of changing game state
        generateEndHouse();
        gameState = GAME_STATES.END;
        endGameTimer = 0;
        endGamePhase = 'arriving';
        player.currentAnimation = 'stand';
        player.currentFrame = 0;
        
        // Play final destination sound
        if (soundsLoaded) {
            finalSound.currentTime = 0;
            finalSound.play().catch(e => console.log('Final sound play failed:', e));
        }
    }
    
    // Update end game animation
    if (gameState === GAME_STATES.END) {
        updateEndGameAnimation();
    }
}

function updateEndGameAnimation() {
    endGameTimer++;
    
    // Move player towards the 501 house
    const targetX = 250; // Position in front of the house
    const targetY = 350; // Higher position for better visibility
    
    switch(endGamePhase) {
        case 'arriving':
            // Move player to position
            const dx = targetX - player.x;
            const dy = targetY - player.y;
            
            if (Math.abs(dx) > 2) {
                player.x += dx * 0.1;
            } else {
                player.x = targetX;
            }
            
            if (Math.abs(dy) > 2) {
                player.y += dy * 0.1;
            } else {
                player.y = targetY;
            }
            
            // Make player larger when standing
            player.width = player.originalWidth * 1.5; // 50% larger
            player.height = player.originalHeight * 1.5;
            
            // Check if arrived
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
                endGamePhase = 'standing';
                endGameTimer = 0;
            }
            break;
            
        case 'standing':
            // Zoom effect (additional zoom on top of larger size)
            if (endGameTimer < 60) {
                playerZoom = 1 + (endGameTimer / 60) * 0.3; // Zoom to 1.3x
            } else {
                endGamePhase = 'disappearing';
                endGameTimer = 0;
            }
            break;
            
        case 'disappearing':
            // Fade out effect
            if (endGameTimer < 60) {
                playerAlpha = 1 - (endGameTimer / 60); // Fade to 0
                playerZoom = 1.3 + (endGameTimer / 60) * 0.4; // Zoom to 1.7x
            } else {
                playerAlpha = 0;
                endGamePhase = 'complete';
            }
            break;
            
        case 'complete':
            // Player is gone, show end screen UI
            endGameTimer++; // Continue counting to trigger fallback UI
            break;
    }
}

function spawnEntities() {
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime > spawnInterval) {
        const entityType = Math.floor(Math.random() * 3);
        const entity = createEntity(entityType);
        entities.push(entity);
        lastSpawnTime = currentTime;
        
        // Vary spawn interval
        spawnInterval = 1500 + Math.random() * 2000;
    }
}

function createEntity(type) {
    const baseY = 380; // Adjusted base Y position for entities
    const entityData = {
        x: CANVAS_WIDTH + 50,
        y: baseY,
        speed: GAME_SPEED,
        type: type,
        color: '#FFFFFF',
        effect: 0,
        currentFrame: 0,
        frameTimer: 0,
        frameInterval: 15 // Entity animation speed
    };
    
    switch(type) {
        case 0: // Police - 3x2 grid, taller sprite
            entityData.color = '#0066CC';
            entityData.effect = -1;
            entityData.width = 80;
            entityData.height = 100;
            entityData.yOffset = 0; // Increased to keep feet firmly on ground
            entityData.gridCols = 3;
            entityData.gridRows = 2;
            break;
        case 1: // Journalist - 4x2 grid, medium height
            entityData.color = '#CC6600';
            entityData.effect = -1;
            entityData.width = 70;
            entityData.height = 90;
            entityData.yOffset = 0; // Increased to prevent floating
            entityData.gridCols = 4;
            entityData.gridRows = 2;
            break;
        case 2: // Female Model - 4x2 grid, shorter sprite
            entityData.color = '#FF66CC';
            entityData.effect = +1;
            entityData.width = 75;
            entityData.height = 85;
            entityData.yOffset = 0; // Increased to keep feet on ground
            entityData.gridCols = 4;
            entityData.gridRows = 2;
            break;
    }
    
    return entityData;
}

function updateEntities() {
    entities = entities.filter(entity => {
        entity.x -= entity.speed;
        
        // Update entity animation
        entity.frameTimer++;
        if (entity.frameTimer >= entity.frameInterval) {
            entity.frameTimer = 0;
            entity.currentFrame++;
            
            // Calculate total frames based on entity type grid
            const totalFrames = entity.gridCols * entity.gridRows;
            
            if (entity.currentFrame >= totalFrames) {
                entity.currentFrame = 0;
            }
        }
        
        return entity.x + entity.width > -50;
    });
}

function checkCollisions() {
    entities.forEach((entity, index) => {
        if (isColliding(player, entity)) {
            handleCollision(entity);
            entities.splice(index, 1);
        }
    });
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function handleCollision(entity) {
    hearts += entity.effect;
    
    // Clamp hearts between 0 and 3
    hearts = Math.max(0, Math.min(3, hearts));
    
    // Play appropriate sound effect
    if (soundsLoaded) {
        if (entity.type === 2) { // Female Model
            // Reset and play female interaction sound
            femaleInteractionSound.currentTime = 0;
            femaleInteractionSound.play().catch(e => console.log('Sound play failed:', e));
        } else { // Police or Journalist
            // Reset and play obstacle sound
            obstacleSound.currentTime = 0;
            obstacleSound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    // Add collision feedback
    collisionFeedback.push({
        x: player.x + player.width / 2,
        y: player.y - 20,
        text: entity.effect > 0 ? '+1' : '-1',
        color: entity.effect > 0 ? '#00FF00' : '#FF0000',
        timer: 60
    });
    
    // Check game over
    if (hearts <= 0) {
        resetGame();
    }
}

function resetGame() {
    gameState = GAME_STATES.START;
    distance = 0;
    hearts = 3;
    resetPlayer();
    entities = [];
    collisionFeedback = [];
    
    // Reset end game variables
    endGameTimer = 0;
    playerZoom = 1;
    playerAlpha = 1;
    endGamePhase = 'arriving';
}

function updateCollisionFeedback() {
    collisionFeedback = collisionFeedback.filter(feedback => {
        feedback.y -= 1;
        feedback.timer--;
        return feedback.timer > 0;
    });
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

function generateEndHouse() {
    // Clear existing buildings and create only the 501 house
    buildings = [];
    
    const endHouse = {
        x: 400, // Center position
        width: 200,
        height: 120, // 1 story house
        color: '#FFD700', // Distinct gold color
        type: 'end',
        windows: [],
        hasBalcony: false,
        hasRoof: true,
        isEndHouse: true
    };
    
    buildings.push(endHouse);
    
    // Stop background scrolling
    backgroundOffset = 0;
}

function drawBuildings() {
    buildings.forEach(building => {
        let drawX = building.x;
        
        // Only apply scrolling to regular buildings, not the end house
        if (!building.isEndHouse) {
            // Calculate scrolling position
            drawX = building.x - backgroundOffset;
            
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
        }
        
        // Only draw if building is visible
        if (drawX + building.width >= 0 && drawX <= CANVAS_WIDTH) {
            if (building.isEndHouse) {
                drawEndHouse(building, drawX);
            } else {
                drawRegularBuilding(building, drawX);
            }
        }
    });
}

function drawEndHouse(building, drawX) {
    // Draw building shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(drawX + 5, 455 - building.height, building.width, building.height);
    
    // Draw main building with distinct color
    ctx.fillStyle = building.color;
    ctx.fillRect(drawX, 450 - building.height, building.width, building.height);
    
    // Draw building outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(drawX, 450 - building.height, building.width, building.height);
    
    // Draw "501" on the house in big font with more space from door
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.font = 'bold 72px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textX = drawX + building.width / 2;
    const textY = 450 - building.height + 40; // More space from top, away from door
    
    ctx.strokeText('501', textX, textY);
    ctx.fillText('501', textX, textY);
    
    // Draw door (positioned lower to give more space for 501 text)
    ctx.fillStyle = '#654321';
    const doorWidth = 40;
    const doorHeight = 50;
    const doorX = drawX + (building.width - doorWidth) / 2;
    const doorY = 450 - doorHeight - 10; // Moved down 10px for more space
    ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
    
    // Draw roof
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(drawX - 15, 450 - building.height);
    ctx.lineTo(drawX + building.width / 2, 450 - building.height - 40);
    ctx.lineTo(drawX + building.width + 15, 450 - building.height);
    ctx.closePath();
    ctx.fill();
}

function drawRegularBuilding(building, drawX) {
    // Original building drawing logic (moved from drawBuildings)
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

function drawPlayer() {
    if (!spritesLoaded) {
        // Fallback to rectangle if sprites not loaded
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        return;
    }
    
    // Apply zoom and alpha effects for end game
    if (gameState === GAME_STATES.END && (playerAlpha < 1 || playerZoom !== 1)) {
        ctx.save();
        ctx.globalAlpha = playerAlpha;
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.scale(playerZoom, playerZoom);
        ctx.translate(-(player.x + player.width/2), -(player.y + player.height/2));
    }
    
    // Disable image smoothing for crisp rendering
    ctx.imageSmoothingEnabled = false;
    
    // Select appropriate sprite based on animation state
    let currentSprite;
    if (player.currentAnimation === 'jump') {
        currentSprite = playerJumpSprite;
    } else if (player.currentAnimation === 'stand') {
        currentSprite = playerStandSprite;
    } else {
        currentSprite = playerRunSprite;
    }
    
    if (currentSprite && currentSprite.complete) {
        if (player.currentAnimation === 'stand') {
            // Draw standing sprite (single frame) with rounded position
            const drawX = Math.round(player.x);
            const drawY = Math.round(player.y);
            ctx.drawImage(
                currentSprite,
                0, 0, currentSprite.width, currentSprite.height,
                drawX, drawY, Math.round(player.width), Math.round(player.height)
            );
        } else {
            // Calculate frame position in 3x3 grid for run/jump
            const gridCols = 3;
            const gridRows = 3;
            const frameWidth = currentSprite.width / gridCols;
            const frameHeight = currentSprite.height / gridRows;
            
            let col, row;
            
            if (player.currentAnimation === 'run') {
                // For running, use first 6 frames (first 2 rows)
                col = player.currentFrame % 3; // 0,1,2,0,1,2...
                row = Math.floor(player.currentFrame / 3); // 0,0,0,1,1,1...
            } else {
                // For jumping, use all 9 frames normally
                col = player.currentFrame % gridCols;
                row = Math.floor(player.currentFrame / gridCols);
            }
            
            const sourceX = col * frameWidth;
            const sourceY = row * frameHeight;
            
            // Draw the sprite frame with rounded position
            const drawX = Math.round(player.x);
            const drawY = Math.round(player.y);
            ctx.drawImage(
                currentSprite,
                sourceX, sourceY, frameWidth, frameHeight,
                drawX, drawY, Math.round(player.width), Math.round(player.height)
            );
        }
    } else {
        // Fallback to rectangle if sprite not ready
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Restore context if we applied effects
    if (gameState === GAME_STATES.END && (playerAlpha < 1 || playerZoom !== 1)) {
        ctx.restore();
    }
}

function drawEntities() {
    entities.forEach(entity => {
        if (!spritesLoaded) {
            // Fallback to rectangle if sprites not loaded
            ctx.fillStyle = entity.color;
            ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Comic Sans MS';
            ctx.textAlign = 'center';
            
            switch(entity.type) {
                case 0: // Police
                    ctx.fillText('P', entity.x + entity.width/2, entity.y + entity.height/2);
                    break;
                case 1: // Journalist
                    ctx.fillText('J', entity.x + entity.width/2, entity.y + entity.height/2);
                    break;
                case 2: // Female Model
                    ctx.fillText('F', entity.x + entity.width/2, entity.y + entity.height/2);
                    break;
            }
            return;
        }
        
        // Select appropriate sprite based on entity type
        let currentSprite = null;
        switch(entity.type) {
            case 0: // Police
                currentSprite = policeSprite;
                break;
            case 1: // Journalist
                currentSprite = journalistSprite;
                break;
            case 2: // Female Model
                currentSprite = femaleModelSprite;
                break;
        }
        
        if (currentSprite && currentSprite.complete) {
            // Calculate frame position based on entity type
            const gridCols = entity.gridCols;
            const gridRows = entity.gridRows;
            const frameWidth = currentSprite.width / gridCols;
            const frameHeight = currentSprite.height / gridRows;
            
            const col = entity.currentFrame % gridCols;
            const row = Math.floor(entity.currentFrame / gridCols);
            
            const sourceX = col * frameWidth;
            const sourceY = row * frameHeight;
            
            // Adjust Y position to keep feet on ground
            const drawY = entity.y - entity.yOffset;
            
            // Round positions to prevent sub-pixel rendering (causes blur)
            const drawX = Math.round(entity.x);
            const roundedDrawY = Math.round(drawY);
            
            // Draw the sprite frame with crisp rendering
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                currentSprite,
                sourceX, sourceY, frameWidth, frameHeight,
                drawX, roundedDrawY, entity.width, entity.height
            );
        } else {
            // Fallback to rectangle if sprite not ready
            ctx.fillStyle = entity.color;
            ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
        }
    });
}

function drawCollisionFeedback() {
    collisionFeedback.forEach(feedback => {
        ctx.fillStyle = feedback.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.textAlign = 'center';
        
        ctx.strokeText(feedback.text, feedback.x, feedback.y);
        ctx.fillText(feedback.text, feedback.x, feedback.y);
    });
}

function drawStartScreen() {
    drawBackground();
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw main title
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.font = 'bold 36px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('রিসোর্ট মাওলানা', CANVAS_WIDTH / 2, 80);
    ctx.fillText('রিসোর্ট মাওলানা', CANVAS_WIDTH / 2, 80);
    
    // Draw character cards
    const cardWidth = 180;
    const cardHeight = 200;
    const cardSpacing = 20;
    const totalWidth = 3 * cardWidth + 2 * cardSpacing;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const cardY = 140;
    
    // Police Card
    drawCharacterCard(startX, cardY, cardWidth, cardHeight, policeSprite, 'পুলিশ', '#FF4444', '  -');
    
    // Journalist Card  
    drawCharacterCard(startX + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, journalistSprite, 'সাংবাদিক', '#FF4444', '  -');
    
    // Female Model Card
    drawCharacterCard(startX + 2 * (cardWidth + cardSpacing), cardY, cardWidth, cardHeight, femaleModelSprite, 'নারী', '#44FF44', '  +');
    
    // Draw instruction text
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('পুলিশ ও সাংবাদিক এড়িয়ে চলুন • নারী সংগ্রহ করুন', CANVAS_WIDTH / 2, 380);
    
    // Draw "Tap to Start" button
    const buttonY = 450;
    const buttonWidth = 300;
    const buttonHeight = 60;
    const buttonX = (CANVAS_WIDTH - buttonWidth) / 2;
    
    // Button background
    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('শুরু করতে ট্যাপ করুন', CANVAS_WIDTH / 2, buttonY + buttonHeight / 2);
}

function drawCharacterCard(x, y, width, height, sprite, name, color, heartEffect) {
    // Card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    
    // Character image area
    const imageAreaY = y + 10;
    const imageAreaHeight = 100;
    const imageSize = 80;
    const imageX = x + (width - imageSize) / 2;
    const imageY = imageAreaY + (imageAreaHeight - imageSize) / 2;
    
    // Draw character image
    if (sprite && sprite.complete) {
        // Calculate correct frame size based on sprite grid
        let frameWidth, frameHeight;
        
        if (sprite === policeSprite) {
            // Police: 3x2 grid
            frameWidth = sprite.width / 3;
            frameHeight = sprite.height / 2;
        } else if (sprite === journalistSprite || sprite === femaleModelSprite) {
            // Journalist/Model: 4x2 grid
            frameWidth = sprite.width / 4;
            frameHeight = sprite.height / 2;
        }
        
        // Draw first frame
        ctx.drawImage(sprite, 0, 0, frameWidth, frameHeight, imageX, imageY, imageSize, imageSize);
    } else {
        // Fallback
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(imageX, imageY, imageSize, imageSize);
        ctx.fillStyle = '#666666';
        ctx.font = '12px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('লোড হচ্ছে...', imageX + imageSize/2, imageY + imageSize/2);
    }
    
    // Character name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width/2, y + 130);
    
    // Heart effect
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillText(heartEffect + '১', x + width/2, y + 160);
    
    // Heart emoji instead of custom shape
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('💖', x + width/2 - 20, y + 160);
}

// function drawHeartIcon(x, y, size, color) {
//     ctx.fillStyle = color;
//     ctx.beginPath();
    
//     // Create a more perfect heart shape using proper bezier curves
//     const width = size;
//     const height = size;
    
//     // Start from top center of heart
//     ctx.moveTo(x, y + height * 0.3);
    
//     // Left side curve
//     ctx.bezierCurveTo(
//         x - width * 0.5, y - height * 0.1,  // Control point 1
//         x - width * 0.5, y + height * 0.3,  // Control point 2  
//         x, y + height * 0.6                 // End point
//     );
    
//     // Right side curve
//     ctx.bezierCurveTo(
//         x + width * 0.5, y + height * 0.3,  // Control point 1
//         x + width * 0.5, y - height * 0.1,  // Control point 2
//         x, y + height * 0.3                 // End point (back to start)
//     );
    
//     ctx.closePath();
//     ctx.fill();
// }

function drawGameScreen() {
    drawBackground();
    drawEntities();
    drawPlayer();
    drawCollisionFeedback();
    
    // Draw distance
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const distanceText = `${Math.floor(distance)} / ${TARGET_DISTANCE} মিটার`;
    ctx.strokeText(distanceText, 20, 20);
    ctx.fillText(distanceText, 20, 20);
    
    // Draw hearts
    drawHearts();
}

function drawHearts() {
    ctx.font = '25px Comic Sans MS';
    
    for (let i = 0; i < hearts; i++) {
        const x = CANVAS_WIDTH - 100 + (i * 30);
        const y = 20;
        
        // Draw heart emoji
        ctx.fillText('💖', x, y);
    }
}

function drawEndScreenUI() {
    // Congratulations message at top (no overlay)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.font = 'bold 36px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('অভিনন্দন!', CANVAS_WIDTH / 2, 80);
    ctx.fillText('অভিনন্দন!', CANVAS_WIDTH / 2, 80);
    
    ctx.font = 'bold 28px Comic Sans MS';
    ctx.fillText('গন্তব্যে পৌঁছেছেন 🔥', CANVAS_WIDTH / 2, 130);
    
    // Draw buttons with heartbeat animation
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonSpacing = 30;
    const buttonY = 480; // Lower position for better visibility
    const totalButtonWidth = 2 * buttonWidth + buttonSpacing;
    const firstButtonX = (CANVAS_WIDTH - totalButtonWidth) / 2;
    
    // Calculate heartbeat animation scale
    const time = Date.now() / 1000;
    const heartbeatScale = 1 + Math.sin(time * 3) * 0.08; // 8% scale variation
    
    // Play Again button with animation
    const playAgainX = firstButtonX;
    ctx.save();
    ctx.translate(playAgainX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.scale(heartbeatScale, heartbeatScale);
    ctx.translate(-(playAgainX + buttonWidth/2), -(buttonY + buttonHeight/2));
    
    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(playAgainX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(playAgainX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('আবার খেলুন', playAgainX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.restore();
    
    // Go Back to Website button with animation
    const websiteX = firstButtonX + buttonWidth + buttonSpacing;
    ctx.save();
    ctx.translate(websiteX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.scale(heartbeatScale, heartbeatScale);
    ctx.translate(-(websiteX + buttonWidth/2), -(buttonY + buttonHeight/2));
    
    ctx.fillStyle = '#2196F3';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(websiteX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(websiteX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ওয়েবসাইট', websiteX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.restore();
    
    // Store button positions for click detection
    if (!window.endScreenButtons) {
        window.endScreenButtons = {};
    }
    window.endScreenButtons.playAgain = {
        x: playAgainX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
    window.endScreenButtons.website = {
        x: websiteX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
}

function drawEndScreen() {
    drawBackground();
    
    // Draw semi-transparent overlay at top only
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 200);
    
    // Congratulations message at top
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.strokeText('অভিনন্দন!', CANVAS_WIDTH / 2, 50);
    ctx.fillText('অভিনন্দন!', CANVAS_WIDTH / 2, 50);
    
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillText('গন্তব্যে পৌঁছেছেন 🔥', CANVAS_WIDTH / 2, 90);
    
    // Draw buttons with heartbeat animation
    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const buttonY = 520; // Below the building
    const totalButtonWidth = 2 * buttonWidth + buttonSpacing;
    const firstButtonX = (CANVAS_WIDTH - totalButtonWidth) / 2;
    
    // Calculate heartbeat animation scale
    const time = Date.now() / 1000;
    const heartbeatScale = 1 + Math.sin(time * 3) * 0.05; // 5% scale variation
    
    // Play Again button with animation
    const playAgainX = firstButtonX;
    ctx.save();
    ctx.translate(playAgainX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.scale(heartbeatScale, heartbeatScale);
    ctx.translate(-(playAgainX + buttonWidth/2), -(buttonY + buttonHeight/2));
    
    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(playAgainX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(playAgainX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('আবার খেলুন', playAgainX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.restore();
    
    // Go Back to Website button with animation
    const websiteX = firstButtonX + buttonWidth + buttonSpacing;
    ctx.save();
    ctx.translate(websiteX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.scale(heartbeatScale, heartbeatScale);
    ctx.translate(-(websiteX + buttonWidth/2), -(buttonY + buttonHeight/2));
    
    ctx.fillStyle = '#2196F3';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(websiteX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(websiteX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ওয়েবসাইটে ফিরে যান', websiteX + buttonWidth/2, buttonY + buttonHeight/2);
    ctx.restore();
    
    // Store button positions for click detection
    if (!window.endScreenButtons) {
        window.endScreenButtons = {};
    }
    window.endScreenButtons.playAgain = {
        x: playAgainX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
    window.endScreenButtons.website = {
        x: websiteX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
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
            // Continue drawing game scene with end game animation
            drawGameScreen();
            
            // Always draw end screen UI in END state - no delay
            drawEndScreenUI();
            break;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);
