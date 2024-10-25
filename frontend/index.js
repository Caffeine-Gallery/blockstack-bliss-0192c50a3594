import { backend } from 'declarations/backend';

const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPiece');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLS = 12;
const BLOCK_SIZE = 20;
const COLORS = [
    '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
    '#FF8E0D', '#FFE138', '#3877FF'
];

let board = createBoard();
let score = 0;
let currentPiece = null;
let nextPiece = null;

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function getRandomPiece() {
    const pieces = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1, 1], [0, 1, 0]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]]
    ];
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    randomPiece.colorIndex = Math.floor(Math.random() * COLORS.length);
    return {
        matrix: randomPiece,
        pos: { x: Math.floor(COLS / 2) - Math.floor(randomPiece[0].length / 2), y: 0 },
        colorIndex: randomPiece.colorIndex
    };
}

function drawPiece(piece, offsetX, offsetY) {
    if (!piece || !piece.matrix) return;
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[piece.colorIndex];
                ctx.fillRect((offsetX + x) * BLOCK_SIZE, (offsetY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect((offsetX + x) * BLOCK_SIZE, (offsetY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawNextPiece() {
    if (!nextPiece || !nextPiece.matrix) return;
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    nextPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextPieceCtx.fillStyle = COLORS[nextPiece.colorIndex];
                nextPieceCtx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 10, BLOCK_SIZE, BLOCK_SIZE);
                nextPieceCtx.strokeStyle = '#000';
                nextPieceCtx.strokeRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 10, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > 1000) {
        if (currentPiece) {
            currentPiece.pos.y++;
            if (collide(board, currentPiece)) {
                currentPiece.pos.y--;
                merge(board, currentPiece);
                pieceReset();
                removeRows();
            }
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}

function collide(board, piece) {
    if (!piece || !piece.matrix || !piece.pos) return true;
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] !== 0 &&
                (board[y + piece.pos.y] &&
                board[y + piece.pos.y][x + piece.pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, piece) {
    if (!piece || !piece.matrix || !piece.pos) return;
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

function pieceReset() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    if (collide(board, currentPiece)) {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        // Trigger game over event
        window.dispatchEvent(new Event('gameOver'));
    }
}

function removeRows() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;

        score += rowCount * 10;
        rowCount *= 2;
    }
}

function updateScore() {
    scoreElement.textContent = score;
}

document.addEventListener('keydown', event => {
    if (!currentPiece) return;
    if (event.keyCode === 37) {
        currentPiece.pos.x--;
        if (collide(board, currentPiece)) {
            currentPiece.pos.x++;
        }
    } else if (event.keyCode === 39) {
        currentPiece.pos.x++;
        if (collide(board, currentPiece)) {
            currentPiece.pos.x--;
        }
    } else if (event.keyCode === 40) {
        currentPiece.pos.y++;
        if (collide(board, currentPiece)) {
            currentPiece.pos.y--;
            merge(board, currentPiece);
            pieceReset();
            removeRows();
        }
    } else if (event.keyCode === 32) {
        rotatePiece();
    }
});

function rotatePiece() {
    if (!currentPiece || !currentPiece.matrix) return;
    const rotated = currentPiece.matrix[0].map((_, index) =>
        currentPiece.matrix.map(row => row[index])
    ).reverse();
    const pos = currentPiece.pos.x;
    let offset = 1;
    const originalMatrix = currentPiece.matrix;
    currentPiece.matrix = rotated;
    while (collide(board, currentPiece)) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            currentPiece.matrix = originalMatrix;
            currentPiece.pos.x = pos;
            return;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    if (currentPiece) {
        drawPiece(currentPiece, currentPiece.pos.x, currentPiece.pos.y);
    }
    drawNextPiece();
}

function startGame() {
    board = createBoard();
    score = 0;
    currentPiece = getRandomPiece();
    nextPiece = getRandomPiece();
    updateScore();
    update();
}

startGame();

// High score submission
window.addEventListener('gameOver', async () => {
    const playerName = prompt("Game Over! Enter your name for the high score:");
    if (playerName) {
        await backend.addHighScore(playerName, score);
        const highScores = await backend.getHighScores();
        console.log("High Scores:", highScores);
    }
});
