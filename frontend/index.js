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
let currentPiece = getRandomPiece();
let nextPiece = getRandomPiece();

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
    return randomPiece;
}

function drawPiece(piece, offsetX, offsetY) {
    if (!piece) return;
    piece.forEach((row, y) => {
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
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    nextPiece.forEach((row, y) => {
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
        piece.pos.y++;
        if (collide(board, piece)) {
            piece.pos.y--;
            merge(board, piece);
            pieceReset();
            removeRows();
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
    piece.matrix = nextPiece;
    nextPiece = getRandomPiece();
    piece.pos.y = 0;
    piece.pos.x = Math.floor(COLS / 2) - Math.floor(piece.matrix[0].length / 2);
    if (collide(board, piece)) {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
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
    if (!piece || !piece.pos) return;
    if (event.keyCode === 37) {
        piece.pos.x--;
        if (collide(board, piece)) {
            piece.pos.x++;
        }
    } else if (event.keyCode === 39) {
        piece.pos.x++;
        if (collide(board, piece)) {
            piece.pos.x--;
        }
    } else if (event.keyCode === 40) {
        piece.pos.y++;
        if (collide(board, piece)) {
            piece.pos.y--;
            merge(board, piece);
            pieceReset();
            removeRows();
        }
    } else if (event.keyCode === 32) {
        rotatePiece();
    }
});

function rotatePiece() {
    if (!piece || !piece.matrix) return;
    const rotated = piece.matrix[0].map((_, index) =>
        piece.matrix.map(row => row[index])
    ).reverse();
    const pos = piece.pos.x;
    let offset = 1;
    piece.matrix = rotated;
    while (collide(board, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            rotate(piece.matrix, -1);
            piece.pos.x = pos;
            return;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawPiece(currentPiece, currentPiece.pos.x, currentPiece.pos.y);
    drawNextPiece();
}

const piece = {
    pos: { x: 5, y: 0 },
    matrix: currentPiece
};

pieceReset();
updateScore();
update();

// High score submission
window.addEventListener('gameOver', async () => {
    const playerName = prompt("Game Over! Enter your name for the high score:");
    if (playerName) {
        await backend.addHighScore(playerName, score);
        const highScores = await backend.getHighScores();
        console.log("High Scores:", highScores);
    }
});
