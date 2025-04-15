// 游戏状态
let gameState = {
    board: [],
    solution: [],
    difficulty: 'easy',
    timer: null,
    timeElapsed: 0,
    hintsUsed: 0,
    selectedCell: null,
    isPlaying: false,
    gameStarted: false,
    history: []
};

// DOM 元素
const elements = {
    grid: document.getElementById('sudoku-grid'),
    timer: document.getElementById('timer'),
    difficulty: document.getElementById('difficulty'),
    startGame: document.getElementById('start-game'),
    newGame: document.getElementById('new-game'),
    hint: document.getElementById('hint'),
    check: document.getElementById('check'),
    message: document.getElementById('game-message'),
    messageText: document.getElementById('message-text'),
    retry: document.getElementById('retry'),
    saveScore: document.getElementById('save-score'),
    undoButton: document.getElementById('undo-button'),
    clearButton: document.getElementById('clear-button'),
    numberPanel: document.getElementById('number-panel'),
    showLeaderboard: document.getElementById('show-leaderboard'),
    leaderboardModal: document.getElementById('leaderboard-modal'),
    scoreModal: document.getElementById('score-modal'),
    closeScoreModal: document.getElementById('close-score-modal'),
    baseScore: document.getElementById('base-score'),
    difficultyBonus: document.getElementById('difficulty-bonus'),
    hintsPenalty: document.getElementById('hints-penalty'),
    finalScore: document.getElementById('final-score'),
    retryGame: document.getElementById('retry-game'),
    saveScoreModal: document.getElementById('save-score-modal')
};

// 初始化游戏
function initGame() {
    createGrid();
    setupEventListeners();
    addScoreStyles();
    elements.difficulty.value = gameState.difficulty;
    prepareNewGame();
}

// 创建数独网格
function createGrid() {
    elements.grid.innerHTML = '';
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const index = row * 9 + col;
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = index;
            cell.dataset.row = row;
            cell.dataset.col = col;

            // 为单元格设置交替的背景色
            const boxRow = Math.floor(row / 3);
            const boxCol = Math.floor(col / 3);
            if ((boxRow + boxCol) % 2 === 0) {
                cell.classList.add('highlight-1');
            } else {
                cell.classList.add('highlight-2');
            }

            elements.grid.appendChild(cell);
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 单元格点击和触摸
    elements.grid.addEventListener('click', handleCellClick);
    elements.grid.addEventListener('touchstart', handleCellTouch);

    // 数字键盘按钮
    document.querySelectorAll('.number-btn').forEach(btn => {
        const handleNumberInput = (e) => {
            if (gameState.selectedCell !== null && gameState.gameStarted) {
                const value = e.target.dataset.number;
                setCellValue(gameState.selectedCell, parseInt(value));
                hideNumberPanel();
                e.stopPropagation(); // 阻止冒泡
            }
        };
        btn.addEventListener('click', handleNumberInput);
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止触摸事件的默认行为
            handleNumberInput(e);
        });
    });

    // 清除按钮
    elements.clearButton.addEventListener('click', () => {
        if (gameState.selectedCell !== null && gameState.gameStarted) {
            clearCell(gameState.selectedCell);
        }
    });
    elements.clearButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState.selectedCell !== null && gameState.gameStarted) {
            clearCell(gameState.selectedCell);
        }
    });

    // 开始游戏按钮
    elements.startGame.addEventListener('click', startGame);

    // 新游戏按钮
    elements.newGame.addEventListener('click', prepareNewGame);

    // 提示按钮
    elements.hint.addEventListener('click', () => {
        if (gameState.gameStarted) giveHint(); // 仅在游戏已开始时允许操作
    });

    // 检查按钮
    elements.check.addEventListener('click', () => {
        if (gameState.gameStarted) checkSolution(); // 仅在游戏已开始时允许操作
    });

    // 重试按钮
    elements.retry.addEventListener('click', prepareNewGame);

    // 保存分数按钮
    elements.saveScore.addEventListener('click', saveScore);

    // 撤销按钮
    elements.undoButton.addEventListener('click', () => {
        if (gameState.gameStarted) undoLastMove(); // 仅在游戏已开始时允许操作
    });

    // 排行榜按钮
    elements.showLeaderboard.addEventListener('click', () => {
        LeaderboardModal.show('shudu2025');
    });

    // 难度选择
    elements.difficulty.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        prepareNewGame();
    });

    // 键盘输入
    document.addEventListener('keydown', (e) => {
        if (gameState.gameStarted) handleKeyPress(e); // 仅在游戏已开始时允许操作
    });

    // 点击或触摸空白区域隐藏数字面板
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);

    // 关闭计分模态窗口
    elements.closeScoreModal.addEventListener('click', () => {
        elements.scoreModal.classList.remove('show');
    });

    // 重新开始游戏
    elements.retryGame.addEventListener('click', () => {
        elements.scoreModal.classList.remove('show');
        prepareNewGame();
    });

    // 保存分数
    elements.saveScoreModal.addEventListener('click', () => {
        elements.scoreModal.classList.remove('show');
        saveScore();
    });
}

// 处理单元格触摸
function handleCellTouch(e) {
    e.preventDefault(); // 防止触摸事件的默认行为
    handleCellClick(e);
}

// 处理文档点击，用于隐藏数字面板
function handleDocumentClick(e) {
    // 如果点击的不是数字按钮并且不是选中的单元格
    if (!e.target.closest('.number-btn') && !e.target.closest('.cell.selected')) {
        hideNumberPanel();
    }
}

// 显示数字面板
function showNumberPanel(cellElement) {
    // 获取单元格位置
    const rect = cellElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 计算面板的理想位置
    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;

    // 获取数字面板的尺寸
    const panelWidth = 200; // 估计的数字面板宽度
    const panelHeight = 200; // 估计的数字面板高度

    // 确保面板不会超出屏幕边界
    x = Math.min(Math.max(panelWidth / 2, x), windowWidth - panelWidth / 2);
    y = Math.min(Math.max(panelHeight / 2, y), windowHeight - panelHeight / 2);

    // 设置数字面板位置
    elements.numberPanel.style.left = `${x}px`;
    elements.numberPanel.style.top = `${y}px`;

    // 显示数字面板
    elements.numberPanel.classList.add('show');
}

// 隐藏数字面板
function hideNumberPanel() {
    elements.numberPanel.classList.remove('show');
}

// 撤销上一步操作
function undoLastMove() {
    if (!gameState.gameStarted || gameState.history.length === 0) return;

    const lastMove = gameState.history.pop();
    const cell = document.querySelector(`.cell[data-index="${lastMove.index}"]`);

    // 恢复之前的值
    gameState.board[lastMove.index] = lastMove.prevValue;

    // 更新UI
    clearHighlightedCells();

    if (lastMove.prevValue === 0) {
        cell.textContent = '';
    } else {
        cell.textContent = lastMove.prevValue;
    }

    // 重新选中单元格
    gameState.selectedCell = lastMove.index;
    cell.classList.add('selected');

    // 高亮相同数字
    highlightSameNumbers(cell.textContent);

    // 移除错误标记
    cell.classList.remove('error');

    // 禁用撤销按钮（如果没有更多历史）
    if (gameState.history.length === 0) {
        elements.undoButton.disabled = true;
    }
}

// 准备新游戏（不自动开始计时）
function prepareNewGame() {
    // 停止当前计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }

    gameState.difficulty = elements.difficulty.value;

    resetGameState();
    generatePuzzle();
    updateDisplay();

    // 重置计时器显示
    elements.timer.textContent = '00:00';

    // 设置游戏为未开始状态
    gameState.gameStarted = false;
    gameState.isPlaying = false;

    // 显示开始游戏按钮，隐藏新游戏按钮
    elements.startGame.style.display = 'inline-block';

    // 禁用游戏相关按钮
    elements.hint.disabled = true;
    elements.check.disabled = true;
    elements.undoButton.disabled = true;
    elements.clearButton.disabled = true;

    // 隐藏游戏消息
    elements.message.style.display = 'none';

    // 显示提示信息
    showMessage('点击"开始游戏"按钮开始');
}

// 开始游戏（启动计时器）
function startGame() {
    if (gameState.gameStarted) return; // 防止重复点击

    gameState.gameStarted = true;
    gameState.isPlaying = true;

    // 隐藏开始游戏按钮，显示新游戏按钮
    elements.startGame.style.display = 'none';

    // 启用游戏相关按钮
    elements.hint.disabled = false;
    elements.check.disabled = false;
    elements.clearButton.disabled = false;
    // 撤销按钮仍保持禁用状态，因为还没有历史记录

    // 开始计时
    startTimer();

    // 显示游戏开始提示
    showMessage('游戏开始！');
}

// 重置游戏状态
function resetGameState() {
    gameState.board = Array(81).fill(0);
    gameState.solution = [];
    gameState.timeElapsed = 0;
    gameState.hintsUsed = 0;
    gameState.selectedCell = null;
    gameState.isPlaying = true;
    gameState.history = [];
    updateTimerDisplay();
}

// 生成数独谜题
function generatePuzzle() {
    // 生成完整解
    generateSolution();

    // 保存解决方案
    gameState.solution = [...gameState.board];

    // 根据难度移除数字
    const cellsToRemove = getCellsToRemove();
    const indices = Array.from({ length: 81 }, (_, i) => i);
    shuffleArray(indices);

    for (let i = 0; i < cellsToRemove; i++) {
        gameState.board[indices[i]] = 0;
    }
}

// 生成完整解
function generateSolution() {
    // 初始化空板
    gameState.board = Array(81).fill(0);

    // 使用回溯算法填充数独
    solveSudoku();
}

// 使用回溯算法解数独
function solveSudoku() {
    const emptyCell = findEmptyCell();
    if (!emptyCell) return true;

    const [row, col] = emptyCell;
    const index = row * 9 + col;
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);

    for (const num of numbers) {
        if (isValidPlacement(row, col, num)) {
            gameState.board[index] = num;

            if (solveSudoku()) {
                return true;
            }

            gameState.board[index] = 0;
        }
    }

    return false;
}

// 根据难度获取要移除的单元格数量
function getCellsToRemove() {
    switch (gameState.difficulty) {
        case 'easy': return 30;
        case 'medium': return 45;
        case 'hard': return 55;
        default: return 45;
    }
}

// 处理单元格点击
function handleCellClick(e) {
    if (!gameState.gameStarted) {
        // 如果游戏尚未开始，显示提示信息
        showMessage('请点击"开始游戏"按钮开始游戏');
        return;
    }

    if (!gameState.isPlaying) return;

    const cell = e.target.closest('.cell');
    if (!cell || cell.classList.contains('fixed')) return;

    // 隐藏之前显示的数字面板
    hideNumberPanel();

    // 取消之前选中的单元格
    clearHighlightedCells();

    // 选中新单元格
    gameState.selectedCell = parseInt(cell.dataset.index);
    cell.classList.add('selected');

    // 高亮相同数字
    highlightSameNumbers(cell.textContent);

    // 显示数字面板（仅当单元格为空或不是固定值时）
    if (!cell.classList.contains('fixed')) {
        showNumberPanel(cell);
    }
}

// 清除所有高亮单元格
function clearHighlightedCells() {
    document.querySelectorAll('.cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
}

// 高亮相同数字
function highlightSameNumbers(num) {
    if (!num || num === '') return;

    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.textContent === num) {
            cell.classList.add('selected');
        }
    });
}

// 设置单元格值
function setCellValue(index, value) {
    if (!gameState.gameStarted) return;
    if (value < 1 || value > 9) return;

    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell.classList.contains('fixed')) return;

    // 保存历史记录
    gameState.history.push({
        index: index,
        prevValue: gameState.board[index],
        newValue: value
    });

    // 启用撤销按钮
    elements.undoButton.disabled = false;

    // 清除之前的高亮
    clearHighlightedCells();

    gameState.board[index] = value;
    cell.textContent = value;
    cell.classList.remove('error');

    // 重新选中单元格
    cell.classList.add('selected');

    // 高亮相同数字
    highlightSameNumbers(value.toString());

    // 检查是否完成
    if (isBoardFull()) {
        if (checkSolution(true)) {
            endGame(true);
        }
    }
}

// 清除单元格
function clearCell(index) {
    if (!gameState.gameStarted) return;

    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell.classList.contains('fixed')) return;

    // 只有当单元格有值时才保存历史
    if (gameState.board[index] !== 0) {
        // 保存历史记录
        gameState.history.push({
            index: index,
            prevValue: gameState.board[index],
            newValue: 0
        });

        // 启用撤销按钮
        elements.undoButton.disabled = false;
    }

    // 清除高亮
    clearHighlightedCells();

    gameState.board[index] = 0;
    cell.textContent = '';
    cell.classList.remove('error');

    // 重新选中单元格
    cell.classList.add('selected');

    // 如果有数字面板，重新显示
    showNumberPanel(cell);
}

// 处理键盘输入
function handleKeyPress(e) {
    if (!gameState.gameStarted || gameState.selectedCell === null) return;

    if (e.key >= '1' && e.key <= '9') {
        setCellValue(gameState.selectedCell, parseInt(e.key));
        hideNumberPanel();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        clearCell(gameState.selectedCell);
    } else if (e.key === 'ArrowUp' && gameState.selectedCell >= 9) {
        selectCell(gameState.selectedCell - 9);
    } else if (e.key === 'ArrowDown' && gameState.selectedCell < 72) {
        selectCell(gameState.selectedCell + 9);
    } else if (e.key === 'ArrowLeft' && gameState.selectedCell % 9 > 0) {
        selectCell(gameState.selectedCell - 1);
    } else if (e.key === 'ArrowRight' && gameState.selectedCell % 9 < 8) {
        selectCell(gameState.selectedCell + 1);
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Z 或 Command+Z 撤销
        undoLastMove();
    } else if (e.key === 'Escape') {
        // Esc 键隐藏数字面板
        hideNumberPanel();
    }
}

// 选择单元格
function selectCell(index) {
    // 隐藏数字面板
    hideNumberPanel();

    // 清除所有高亮
    clearHighlightedCells();

    // 选中新单元格
    gameState.selectedCell = index;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add('selected');

    // 高亮相同数字
    highlightSameNumbers(cell.textContent);

    // 如果单元格为空，显示数字面板
    if (gameState.board[index] === 0 && !cell.classList.contains('fixed')) {
        showNumberPanel(cell);
    }
}

// 提供提示
function giveHint() {
    if (!gameState.gameStarted) return;
    if (gameState.hintsUsed >= 999) {
        showMessage('提示次数已用完！');
        return;
    }

    const emptyCells = [];
    for (let i = 0; i < 81; i++) {
        if (gameState.board[i] === 0) {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length === 0) return;

    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const cell = document.querySelector(`.cell[data-index="${randomIndex}"]`);

    // 隐藏数字面板
    hideNumberPanel();

    // 清除高亮
    clearHighlightedCells();

    // 保存历史记录（如果需要撤销提示）
    gameState.history.push({
        index: randomIndex,
        prevValue: 0,
        newValue: gameState.solution[randomIndex],
        isHint: true
    });

    // 启用撤销按钮
    elements.undoButton.disabled = false;

    gameState.board[randomIndex] = gameState.solution[randomIndex];
    cell.textContent = gameState.solution[randomIndex];
    cell.classList.add('fixed');

    // 高亮提示单元格和相同数字
    cell.classList.add('selected');
    highlightSameNumbers(cell.textContent);

    gameState.hintsUsed++;
    showMessage(`已使用 ${gameState.hintsUsed}/3 次提示`);

    // 检查是否完成
    if (isBoardFull()) {
        if (checkSolution(true)) {
            endGame(true);
        }
    }
}

// 检查解答
function checkSolution(silent = false) {
    // 隐藏数字面板
    hideNumberPanel();

    let isValid = true;

    // 检查所有单元格
    for (let i = 0; i < 81; i++) {
        if (gameState.board[i] === 0) {
            isValid = false;
            continue;
        }

        const row = Math.floor(i / 9);
        const col = i % 9;
        const value = gameState.board[i];

        // 临时清除当前值以检查是否有冲突
        gameState.board[i] = 0;
        const valid = isValidPlacement(row, col, value);
        gameState.board[i] = value;

        const cell = document.querySelector(`.cell[data-index="${i}"]`);

        if (!valid) {
            if (!silent) cell.classList.add('error');
            isValid = false;
        } else {
            if (!silent) cell.classList.remove('error');
        }
    }

    if (!silent) {
        if (isValid && isBoardFull()) {
            showMessage('恭喜！数独已完成！');
            endGame(true);
        } else if (isValid) {
            showMessage('目前填写正确，继续加油！');
        } else {
            showMessage('有错误，请检查！');
        }
    }

    return isValid;
}

// 更新显示
function updateDisplay() {
    for (let i = 0; i < 81; i++) {
        const cell = document.querySelector(`.cell[data-index="${i}"]`);
        cell.classList.remove('fixed', 'selected', 'error');

        // 保留背景颜色类
        const row = Math.floor(i / 9);
        const col = i % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        if ((boxRow + boxCol) % 2 === 0) {
            cell.classList.add('highlight-1');
        } else {
            cell.classList.add('highlight-2');
        }

        if (gameState.board[i] !== 0) {
            cell.textContent = gameState.board[i];
            cell.classList.add('fixed');
        } else {
            cell.textContent = '';
        }
    }
}

// 计时器相关
function startTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timeElapsed = 0;
    gameState.timer = setInterval(() => {
        gameState.timeElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeElapsed / 60);
    const seconds = gameState.timeElapsed % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 游戏结束
function endGame(isWin) {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);

    if (isWin) {
        showScoreDetails(); // 显示计分模态窗口

        // 如果用户已登录，自动保存分数
        if (isLoggedIn()) {
            setTimeout(() => {
                saveScore();
            }, 1000);
        }
    }
}

// 检查用户是否登录
function isLoggedIn() {
    return localStorage.getItem('user_id') !== null;
}

// 显示消息
function showMessage(text) {
    elements.messageText.textContent = text;
    elements.messageText.classList.add('show');

    setTimeout(() => {
        elements.messageText.classList.remove('show');
    }, 3000);
}

// 保存分数
function saveScore() {
    const userId = LoginModal.getUserId();
    if (!userId) {
        // 显示登录模态框，并设置登录成功后的回调
        LoginModal.show(() => {
            // 登录成功后重新尝试保存分数
            saveScore();
        });
        return;
    }

    // 计算最终分数
    const finalScore = calculateFinalScore();

    // 发送分数到后端API
    fetch('/api/submit_score.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            game_slug: 'shudu2025',
            score: finalScore,
            user_id: userId,
            difficulty: gameState.difficulty
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('分数保存成功！');
                // 显示排行榜
                loadLeaderboard();
                // 显示排行榜模态框
                LeaderboardModal.show('shudu2025');
            } else {
                showMessage('分数保存失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('保存分数出错:', error);
            showMessage('保存分数时发生错误');
        });
}

// 计算最终分数
function calculateFinalScore() {
    // 基础分数计算：10000 - 完成时间(秒)，确保基础分至少为3000分
    let baseScore = Math.max(10000 - gameState.timeElapsed, 3000);

    // 根据难度调整分数（难度越高，分数越高，表现越好）
    let difficultyMultiplier;
    switch (gameState.difficulty) {
        case 'easy':
            difficultyMultiplier = 1.0; // 简单难度，基础乘数
            break;
        case 'medium':
            difficultyMultiplier = 1.5; // 中等难度，提高50%
            break;
        case 'hard':
            difficultyMultiplier = 2.0; // 困难难度，提高100%
            break;
        default:
            difficultyMultiplier = 1.0;
    }

    // 应用难度系数
    let score = Math.round(baseScore * difficultyMultiplier);

    // 根据使用的提示次数减少奖励（每使用一次提示减少15%的分数）
    if (gameState.hintsUsed > 0) {
        const hintPenalty = Math.min(gameState.hintsUsed * 0.15, 0.9); // 最多减少90%
        score = Math.round(score * (1 - hintPenalty));
    }

    // 确保最低分为500分
    return Math.max(score, 500);
}

// 显示计分详情
function showScoreDetails() {
    // 计算基础分数（基于用时）
    const timeInSeconds = gameState.timeElapsed;
    const baseScore = Math.max(10000 - Math.floor(timeInSeconds * 2), 1000);

    // 计算难度奖励
    let difficultyMultiplier = 1.0;
    switch (gameState.difficulty) {
        case 'hard':
            difficultyMultiplier = 2.0;
            break;
        case 'medium':
            difficultyMultiplier = 1.5;
            break;
        case 'easy':
            difficultyMultiplier = 1.0;
            break;
    }

    // 计算提示扣除
    const hintsPenalty = gameState.hintsUsed * 30; // 每个提示扣除30%
    const finalPenalty = Math.min(hintsPenalty, 90); // 最多扣除90%

    // 计算最终分数
    const finalScore = Math.round(baseScore * difficultyMultiplier * (1 - finalPenalty / 100));

    // 更新显示
    elements.baseScore.textContent = baseScore + ' 分';
    elements.difficultyBonus.textContent = '×' + difficultyMultiplier.toFixed(1);
    elements.hintsPenalty.textContent = '-' + finalPenalty + '%';
    elements.finalScore.textContent = finalScore + ' 分';

    // 显示模态窗口
    elements.scoreModal.classList.add('show');

    // 保存分数到游戏状态
    gameState.finalScore = finalScore;
}

// 加载排行榜
function loadLeaderboard() {
    // 直接使用API，这个函数不再需要
    LeaderboardModal.show('shudu2025');
}

// 工具函数
function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return '简单';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return difficulty;
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function findEmptyCell() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const index = row * 9 + col;
            if (gameState.board[index] === 0) {
                return [row, col];
            }
        }
    }
    return null;
}

function isValidPlacement(row, col, num) {
    // 检查行
    for (let i = 0; i < 9; i++) {
        if (gameState.board[row * 9 + i] === num) return false;
    }

    // 检查列
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i * 9 + col] === num) return false;
    }

    // 检查 3x3 子网格
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (gameState.board[(startRow + i) * 9 + startCol + j] === num) return false;
        }
    }

    return true;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function isBoardFull() {
    return !gameState.board.includes(0);
}

// 模态框操作
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    initGame();

    // 为再玩一次按钮添加事件
    document.addEventListener('leaderboard-play-again', () => {
        startNewGame();
    });

    // 排行榜按钮点击事件，改为使用API
    elements.showLeaderboard.addEventListener('click', () => {
        LeaderboardModal.show('shudu2025');
    });
});

// 更新用户界面
function updateUserUI() {
    // 这个函数可以在需要时实现，用于根据登录状态更新UI
}

// 添加计分详情的样式
function addScoreStyles() {
    // 检查是否已添加样式
    if (document.getElementById('score-details-styles')) {
        return;
    }

    const styles = `
    .score-details {
        background-color: rgba(255, 255, 250, 0.95);
        border-radius: 10px;
        padding: 15px;
        margin-top: 15px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        text-align: left;
    }
    
    .score-details h3 {
        color: #24293e;
        text-align: center;
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 18px;
    }
    
    .score-details table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .score-details table tr td {
        padding: 8px 5px;
        border-bottom: 1px solid #eee;
    }
    
    .score-details table tr:last-child td {
        border-bottom: none;
    }
    
    .score-details table tr td:first-child {
        font-weight: 500;
        color: #555;
    }
    
    .score-details table tr td:last-child {
        text-align: right;
        font-weight: 500;
    }
    
    .score-details .final-score {
        font-weight: bold;
        color: #24293e;
        font-size: 1.1em;
    }
    
    .score-details .score-note {
        font-size: 12px;
        color: #777;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 0;
        font-style: italic;
    }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'score-details-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

// 点击模态窗口外部时关闭
window.addEventListener('click', (e) => {
    if (e.target === elements.scoreModal) {
        elements.scoreModal.classList.remove('show');
    }
}); 