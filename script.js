// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1200;
canvas.height = 600;

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let health = 100;
let level = 1;
let gameSpeed = 1;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 5,
    color: '#4ade80'
};

// Bullets array
const bullets = [];

// Enemies array
const enemies = [];

// Particles array for effects
const particles = [];

// Input handling
const keys = {};
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// Event Listeners
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        shoot();
    }
});

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

// Game Functions
function startGame() {
    gameState = 'playing';
    score = 0;
    health = 100;
    level = 1;
    gameSpeed = 1;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    updateUI();
    gameLoop();
    enemySpawner();
}

function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    drawGrid();
    
    // Update and draw player
    updatePlayer();
    drawPlayer();
    
    // Update and draw bullets
    updateBullets();
    drawBullets();
    
    // Update and draw enemies
    updateEnemies();
    drawEnemies();
    
    // Update and draw particles
    updateParticles();
    drawParticles();
    
    // Check collisions
    checkCollisions();
    
    // Update UI
    updateUI();
    
    // Check game over
    if (health <= 0) {
        gameOver();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    // Movement
    if (keys['w'] || keys['arrowup']) {
        player.y = Math.max(player.radius, player.y - player.speed);
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y = Math.min(canvas.height - player.radius, player.y + player.speed);
    }
    if (keys['a'] || keys['arrowleft']) {
        player.x = Math.max(player.radius, player.x - player.speed);
    }
    if (keys['d'] || keys['arrowright']) {
        player.x = Math.min(canvas.width - player.radius, player.x + player.speed);
    }
}

function drawPlayer() {
    // Draw player body
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw direction indicator (towards mouse)
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const indicatorLength = player.radius + 10;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(angle) * indicatorLength,
        player.y + Math.sin(angle) * indicatorLength
    );
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    bullets.push({
        x: player.x,
        y: player.y,
        radius: 5,
        speed: 10,
        angle: angle,
        color: '#fbbf24'
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // Remove bullets that are off screen
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function enemySpawner() {
    if (gameState !== 'playing') return;
    
    const spawnRate = Math.max(500, 2000 - (level * 100));
    
    setTimeout(() => {
        if (gameState === 'playing') {
            spawnEnemy();
            enemySpawner();
        }
    }, spawnRate);
}

function spawnEnemy() {
    // Spawn from random edge
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -20;
            break;
        case 1: // Right
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            break;
        case 3: // Left
            x = -20;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        radius: 15 + Math.random() * 10,
        speed: 1 + (level * 0.2) + Math.random() * 0.5,
        color: `hsl(${Math.random() * 60}, 70%, 50%)`,
        health: 1
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed * gameSpeed;
        enemy.y += (dy / distance) * enemy.speed * gameSpeed;
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        // Draw enemy body
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw eyes
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const eyeOffset = enemy.radius * 0.4;
        const eyeSize = enemy.radius * 0.3;
        
        ctx.beginPath();
        ctx.arc(
            enemy.x + Math.cos(angle) * eyeOffset - Math.sin(angle) * eyeOffset * 0.5,
            enemy.y + Math.sin(angle) * eyeOffset + Math.cos(angle) * eyeOffset * 0.5,
            eyeSize, 0, Math.PI * 2
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(
            enemy.x + Math.cos(angle) * eyeOffset + Math.sin(angle) * eyeOffset * 0.5,
            enemy.y + Math.sin(angle) * eyeOffset - Math.cos(angle) * eyeOffset * 0.5,
            eyeSize, 0, Math.PI * 2
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    });
}

function checkCollisions() {
    // Bullet-Enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.radius + enemy.radius) {
                // Hit!
                createParticles(enemy.x, enemy.y, enemy.color);
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                
                // Level up every 100 points
                const newLevel = Math.floor(score / 100) + 1;
                if (newLevel > level) {
                    level = newLevel;
                    gameSpeed = 1 + (level * 0.1);
                }
                break;
            }
        }
    }
    
    // Enemy-Player collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + enemy.radius) {
            // Player hit!
            createParticles(enemy.x, enemy.y, '#ff0000');
            enemies.splice(i, 1);
            health -= 10;
            
            // Flash effect
            canvas.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                canvas.style.filter = 'brightness(1)';
            }, 100);
        }
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            radius: 3 + Math.random() * 3,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            color: color,
            life: 30
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
        particle.radius *= 0.98;
        
        if (particle.life <= 0 || particle.radius < 0.5) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    });
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('health').textContent = health;
    document.getElementById('level').textContent = level;
    
    const healthPercent = Math.max(0, health / 100);
    document.getElementById('healthBar').style.width = (healthPercent * 100) + '%';
    
    // Change health bar color based on health
    const healthBar = document.getElementById('healthBar');
    if (healthPercent > 0.6) {
        healthBar.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
    } else if (healthPercent > 0.3) {
        healthBar.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    } else {
        healthBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Initialize
updateUI();

