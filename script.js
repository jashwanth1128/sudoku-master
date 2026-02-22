// ========================================
// SUDOKU GAME - JavaScript Logic
// ========================================

class SudokuGame {
    constructor() {
        // Game state
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.selectedCell = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.difficulty = 'easy';
        this.timer = 0;
        this.timerInterval = null;
        this.isGameActive = false;
        
        // Settings
        this.soundEnabled = true;
        this.hintsEnabled = true;
        this.darkMode = false;
        
        // DOM elements
        this.gridElement = document.getElementById('sudoku-grid');
        this.timerElement = document.getElementById('timer');
        this.mistakesElement = document.getElementById('mistakes');
        this.difficultyDisplay = document.getElementById('difficulty-display');
        this.modal = document.getElementById('success-modal');
        
        this.init();
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.createGrid();
        this.attachEventListeners();
        this.newGame();
    }

    // Create the visual grid
    createGrid() {
        this.gridElement.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.tabIndex = 0;
            this.gridElement.appendChild(cell);
        }
    }

    // Attach all event listeners
    attachEventListeners() {
        // Grid cell clicks
        this.gridElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.selectCell(parseInt(e.target.dataset.index));
            }
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (this.selectedCell === null || !this.isGameActive) return;
            
            if (e.key >= '1' && e.key <= '9') {
                this.placeNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.placeNumber(0);
            }
        });

        // Number pad
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.selectedCell !== null && this.isGameActive) {
                    this.placeNumber(parseInt(btn.dataset.num));
                }
            });
        });

        // Control buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('check-btn').addEventListener('click', () => this.checkSolution());
        document.getElementById('solve-btn').addEventListener('click', () => this.solvePuzzle());

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.difficulty);
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Settings toggles
        document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('sound-toggle').addEventListener('click', (e) => this.toggleSound(e.currentTarget));
        document.getElementById('hints-toggle').addEventListener('click', (e) => this.toggleHints(e.currentTarget));

        // Modal
        document.getElementById('modal-new-game').addEventListener('click', () => {
            this.modal.classList.remove('show');
            this.newGame();
        });
    }

    // ========================================
    // GAME LOGIC
    // ========================================
    
    // Start a new game
    newGame() {
        this.mistakes = 0;
        this.timer = 0;
        this.isGameActive = true;
        this.selectedCell = null;
        
        // Generate puzzle
        this.solution = this.generateCompleteSudoku();
        this.board = this.createPuzzle(JSON.parse(JSON.stringify(this.solution)));
        this.initialBoard = JSON.parse(JSON.stringify(this.board));
        
        this.renderBoard();
        this.updateMistakes();
        this.startTimer();
        this.playSound('start');
    }

    // Reset to initial state
    resetGame() {
        this.board = JSON.parse(JSON.stringify(this.initialBoard));
        this.mistakes = 0;
        this.timer = 0;
        this.renderBoard();
        this.updateMistakes();
        this.playSound('reset');
    }

    // Set difficulty level
    setDifficulty(level) {
        this.difficulty = level;
        this.difficultyDisplay.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    }

    // Select a cell
    selectCell(index) {
        if (!this.isGameActive) return;
        
        const cell = this.gridElement.children[index];
        if (cell.classList.contains('prefilled')) return;
        
        this.selectedCell = index;
        this.highlightCells(index);
        this.playSound('select');
    }

    // Place a number in selected cell
    placeNumber(num) {
        if (this.selectedCell === null) return;
        
        const row = Math.floor(this.selectedCell / 9);
        const col = this.selectedCell % 9;
        
        // Check if cell is prefilled
        if (this.initialBoard[row][col] !== 0) return;
        
        // Place or clear number
        this.board[row][col] = num;
        
        // Validate move
        const cell = this.gridElement.children[this.selectedCell];
        cell.textContent = num === 0 ? '' : num;
        
        if (num !== 0) {
            if (this.hintsEnabled && num !== this.solution[row][col]) {
                cell.classList.add('error');
                this.mistakes++;
                this.updateMistakes();
                this.playSound('error');
                
                // Check game over
                if (this.mistakes >= this.maxMistakes) {
                    this.gameOver();
                }
                
                // Remove error highlight after delay
                setTimeout(() => cell.classList.remove('error'), 1000);
            } else {
                cell.classList.remove('error');
                this.playSound('place');
            }
            
            // Check if puzzle is complete
            if (this.isPuzzleComplete()) {
                this.checkSolution();
            }
        } else {
            cell.classList.remove('error');
        }
    }

    // Highlight selected cell, row, column, and 3x3 box
    highlightCells(index) {
        // Clear all highlights
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted');
        });
        
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        // Highlight selected cell
        this.gridElement.children[index].classList.add('selected');
        
        // Highlight row and column
        for (let i = 0; i < 9; i++) {
            this.gridElement.children[row * 9 + i].classList.add('highlighted');
            this.gridElement.children[i * 9 + col].classList.add('highlighted');
        }
        
        // Highlight 3x3 box
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cellIndex = (boxRow + r) * 9 + (boxCol + c);
                this.gridElement.children[cellIndex].classList.add('highlighted');
            }
        }
        
        // Re-add selected class to keep it on top
        this.gridElement.children[index].classList.add('selected');
    }

    // Check if puzzle is complete
    isPuzzleComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) return false;
            }
        }
        return true;
    }

    // Check solution
    checkSolution() {
        if (!this.isGameActive) return;
        
        let isCorrect = true;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] !== this.solution[row][col]) {
                    isCorrect = false;
                    break;
                }
            }
            if (!isCorrect) break;
        }
        
        if (isCorrect && this.isPuzzleComplete()) {
            this.victory();
        } else {
            this.playSound('error');
            alert('The solution is not correct yet. Keep trying!');
        }
    }

    // Solve the puzzle automatically
    solvePuzzle() {
        if (!this.isGameActive) return;
        
        if (confirm('Are you sure you want to see the solution? This will end the current game.')) {
            this.board = JSON.parse(JSON.stringify(this.solution));
            this.renderBoard();
            this.isGameActive = false;
            this.stopTimer();
            this.playSound('solve');
        }
    }

    // Victory
    victory() {
        this.isGameActive = false;
        this.stopTimer();
        this.playSound('victory');
        
        // Show modal
        document.getElementById('final-time').textContent = this.timerElement.textContent;
        document.getElementById('final-mistakes').textContent = this.mistakes;
        this.modal.classList.add('show');
    }

    // Game over
    gameOver() {
        this.isGameActive = false;
        this.stopTimer();
        this.playSound('gameover');
        
        setTimeout(() => {
            if (confirm('Game Over! You made too many mistakes. Start a new game?')) {
                this.newGame();
            }
        }, 500);
    }

    // ========================================
    // SUDOKU GENERATION & SOLVING
    // ========================================
    
    // Generate a complete valid Sudoku
    generateCompleteSudoku() {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    }

    // Fill board using backtracking
    fillBoard(board) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    // Shuffle numbers for randomness
                    this.shuffleArray(numbers);
                    
                    for (let num of numbers) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.fillBoard(board)) {
                                return true;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Create puzzle by removing numbers
    createPuzzle(board) {
        const cellsToRemove = this.getCellsToRemove();
        let removed = 0;
        const attempts = [];
        
        // Create list of all cell positions
        for (let i = 0; i < 81; i++) {
            attempts.push(i);
        }
        this.shuffleArray(attempts);
        
        for (let i = 0; i < attempts.length && removed < cellsToRemove; i++) {
            const index = attempts[i];
            const row = Math.floor(index / 9);
            const col = index % 9;
            const backup = board[row][col];
            
            board[row][col] = 0;
            
            // Ensure puzzle still has unique solution
            const boardCopy = JSON.parse(JSON.stringify(board));
            if (this.hasUniqueSolution(boardCopy)) {
                removed++;
            } else {
                board[row][col] = backup;
            }
        }
        
        return board;
    }

    // Get number of cells to remove based on difficulty
    getCellsToRemove() {
        switch (this.difficulty) {
            case 'easy': return 30;
            case 'medium': return 45;
            case 'hard': return 55;
            default: return 30;
        }
    }

    // Check if puzzle has unique solution
    hasUniqueSolution(board) {
        let solutions = 0;
        
        const solve = (b) => {
            if (solutions > 1) return;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (b[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValid(b, row, col, num)) {
                                b[row][col] = num;
                                solve(b);
                                b[row][col] = 0;
                            }
                        }
                        return;
                    }
                }
            }
            solutions++;
        };
        
        solve(board);
        return solutions === 1;
    }

    // Validate number placement
    isValid(board, row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (board[row][c] === num) return false;
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxRow + r][boxCol + c] === num) return false;
            }
        }
        
        return true;
    }

    // ========================================
    // UI RENDERING
    // ========================================
    
    // Render the board
    renderBoard() {
        const cells = this.gridElement.children;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const index = row * 9 + col;
                const cell = cells[index];
                const value = this.board[row][col];
                
                cell.textContent = value === 0 ? '' : value;
                cell.classList.remove('prefilled', 'selected', 'highlighted', 'error', 'correct');
                
                if (this.initialBoard[row][col] !== 0) {
                    cell.classList.add('prefilled');
                }
            }
        }
    }

    // Update mistakes display
    updateMistakes() {
        this.mistakesElement.textContent = `${this.mistakes}/${this.maxMistakes}`;
        if (this.mistakes >= this.maxMistakes) {
            this.mistakesElement.style.color = 'var(--accent-danger)';
        } else {
            this.mistakesElement.style.color = 'var(--accent-primary)';
        }
    }

    // ========================================
    // TIMER
    // ========================================
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ========================================
    // SETTINGS
    // ========================================
    
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        this.playSound('toggle');
    }

    toggleSound(btn) {
        this.soundEnabled = !this.soundEnabled;
        btn.classList.toggle('active');
        btn.querySelector('.icon').textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    toggleHints(btn) {
        this.hintsEnabled = !this.hintsEnabled;
        btn.classList.toggle('active');
        btn.querySelector('.icon').textContent = this.hintsEnabled ? '💡' : '🚫';
    }

    // ========================================
    // SOUND EFFECTS
    // ========================================
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Simple frequency-based sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const sounds = {
            select: { freq: 400, duration: 0.05 },
            place: { freq: 600, duration: 0.08 },
            error: { freq: 200, duration: 0.15 },
            victory: { freq: 800, duration: 0.3 },
            start: { freq: 500, duration: 0.1 },
            reset: { freq: 450, duration: 0.1 },
            solve: { freq: 700, duration: 0.2 },
            gameover: { freq: 150, duration: 0.3 },
            toggle: { freq: 550, duration: 0.05 }
        };
        
        const sound = sounds[type] || sounds.select;
        
        oscillator.frequency.value = sound.freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// ========================================
// INITIALIZE GAME
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new SudokuGame();
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
