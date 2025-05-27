/*
//board setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

//images
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage;

//tilemap characters meaning:
// 'X' = wall
// ' ' = food
// 'O' = skipped cell (no draw / logic processing)
// 'P' = Pacman start
// 'b', 'o', 'p', 'r' = ghosts (blue, orange, pink, red)
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function () {
    board = document.getElementById("board");
    //board.height = boardHeight;
    //board.width = boardWidth;
    //context = board.getContext("2d");
    const scale = Math.min(window.innerWidth / boardWidth, 1); // Responsive scale
    board.width = boardWidth * scale;
    board.height = boardHeight * scale;
    context = board.getContext("2d");
    context.scale(scale, scale); // Important: scale drawing logic


    loadImages();
    loadMap();

    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }

    update();
    document.addEventListener("keyup", movePacman);
};

function loadImages() {
    wallImage = new Image(); wallImage.src = "./wall.png";
    blueGhostImage = new Image(); blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./redGhost.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image(); pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tileChar = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileChar === 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileChar === ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4)); // small food dot
            }
        }
    }
}

function update() {
    if (gameOver) return;

    move();
    draw();
    setTimeout(update, 50); // 20 FPS
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);

    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);

    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }

    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    context.fillStyle = "aqua";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    context.fillStyle = "white";
    context.font = "14px sans-serif";
    context.fillText(gameOver ? "Game Over: " + score : `x${lives}  ${score}`, tileSize / 2, tileSize / 2);
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives === 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }

        if (ghost.y === tileSize * 9 && ghost.direction !== 'U' && ghost.direction !== 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    if (foods.size === 0) {
        loadMap();
        resetPositions();
    }
}

function movePacman(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        update();
        return;
    }

    if (["ArrowUp", "KeyW"].includes(e.code)) pacman.updateDirection('U');
    else if (["ArrowDown", "KeyS"].includes(e.code)) pacman.updateDirection('D');
    else if (["ArrowLeft", "KeyA"].includes(e.code)) pacman.updateDirection('L');
    else if (["ArrowRight", "KeyD"].includes(e.code)) pacman.updateDirection('R');

    if (pacman.direction === 'U') pacman.image = pacmanUpImage;
    else if (pacman.direction === 'D') pacman.image = pacmanDownImage;
    else if (pacman.direction === 'L') pacman.image = pacmanLeftImage;
    else if (pacman.direction === 'R') pacman.image = pacmanRightImage;
}

function collision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction === 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize / 4;
        } else if (this.direction === 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize / 4;
        } else if (this.direction === 'L') {
            this.velocityX = -tileSize / 4;
            this.velocityY = 0;
        } else if (this.direction === 'R') {
            this.velocityX = tileSize / 4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}*/
//board setup
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

//images
let blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage;
let pacmanUpImage, pacmanDownImage, pacmanLeftImage, pacmanRightImage;
let wallImage;

//tilemap characters meaning:
// 'X' = wall
// ' ' = food
// 'P' = Pacman start
// 'b', 'o', 'p', 'r' = ghosts (blue, orange, pink, red)
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X            X    X",
    "XXXX XXXX XXXX XXXX",
    "X           X     X",
    "XXXX X XXrXX X XXXX",
    "X       bpo       X",
    "XXXX X XXXXX X XXXX",
    "X    X       X    X",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    loadImages();
    loadMap();

    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }

    update();
    document.addEventListener("keyup", movePacman);
};

function loadImages() {
    wallImage = new Image(); wallImage.src = "./wall.png";
    blueGhostImage = new Image(); blueGhostImage.src = "./blueGhost.png";
    orangeGhostImage = new Image(); orangeGhostImage.src = "./orangeGhost.png";
    pinkGhostImage = new Image(); pinkGhostImage.src = "./pinkGhost.png";
    redGhostImage = new Image(); redGhostImage.src = "./redGhost.png";
    pacmanUpImage = new Image(); pacmanUpImage.src = "./pacmanUp.png";
    pacmanDownImage = new Image(); pacmanDownImage.src = "./pacmanDown.png";
    pacmanLeftImage = new Image(); pacmanLeftImage.src = "./pacmanLeft.png";
    pacmanRightImage = new Image(); pacmanRightImage.src = "./pacmanRight.png";
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tileChar = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileChar === 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            } else if (tileChar === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileChar === ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }
}

function update() {
    if (gameOver) return;
    move();
    draw();
    setTimeout(update, 50);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);

    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    context.fillStyle = "aqua";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }
    context.fillStyle = "white";
    context.font = "14px sans-serif";
    context.fillText(gameOver ? "Game Over: " + score : `x${lives}  ${score}`, tileSize / 2, tileSize / 2);
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives === 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    foods.delete(foodEaten);

    if (foods.size === 0) {
        loadMap();
        resetPositions();
    }
}

function movePacman(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        update();
        return;
    }

    if (["ArrowUp", "KeyW"].includes(e.code)) pacman.updateDirection('U');
    else if (["ArrowDown", "KeyS"].includes(e.code)) pacman.updateDirection('D');
    else if (["ArrowLeft", "KeyA"].includes(e.code)) pacman.updateDirection('L');
    else if (["ArrowRight", "KeyD"].includes(e.code)) pacman.updateDirection('R');

    if (pacman.direction === 'U') pacman.image = pacmanUpImage;
    else if (pacman.direction === 'D') pacman.image = pacmanDownImage;
    else if (pacman.direction === 'L') pacman.image = pacmanLeftImage;
    else if (pacman.direction === 'R') pacman.image = pacmanRightImage;
}

function collision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        ghost.updateDirection(directions[Math.floor(Math.random() * 4)]);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction === 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize / 4;
        } else if (this.direction === 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize / 4;
        } else if (this.direction === 'L') {
            this.velocityX = -tileSize / 4;
            this.velocityY = 0;
        } else if (this.direction === 'R') {
            this.velocityX = tileSize / 4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}
