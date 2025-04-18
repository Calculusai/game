/**
 * 简洁版2048游戏实现
 */
document.addEventListener('DOMContentLoaded', () => {
    // 游戏核心配置
    const GRID_SIZE = 4;
    const CELL_GAP = 15;

    // DOM元素
    const gameBoard = document.getElementById('game-board');
    const backgroundGrid = document.getElementById('background-grid');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const messageContainer = document.getElementById('game-message');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const saveScoreButton = document.getElementById('save-score');

    // 游戏状态
    let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    let score = 0;
    // 从本地存储中读取最高分，确保在游戏开始前就有值
    let bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
    bestScoreDisplay.textContent = bestScore; // 立即显示本地存储的最高分
    let gameOver = false;
    let gameWon = false;

    // 初始化游戏
    initGame();

    // 绑定事件
    document.getElementById('new-game').addEventListener('click', initGame);
    document.getElementById('retry').addEventListener('click', initGame);
    document.getElementById('home-button').addEventListener('click', goToHomePage);
    document.addEventListener('keydown', handleKeyPress);
    leaderboardButton.addEventListener('click', showLeaderboard);
    saveScoreButton.addEventListener('click', () => saveScore(false));
    setupTouchEvents();

    /**
     * 初始化游戏
     */
    function initGame() {
        // 重置游戏状态
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        score = 0;
        gameOver = false;
        gameWon = false;

        // 清除方块
        clearTiles();

        // 创建背景格子
        createBackgroundGrid();

        // 更新尺寸
        updateTileSize();

        // 获取用户最高分并初始化显示
        getUserBestScore().then(() => {
            // 确保最高分显示已更新
            bestScoreDisplay.textContent = bestScore;

            // 更新当前分数显示
            scoreDisplay.textContent = score;

            // 添加初始方块
            addRandomTile();
            addRandomTile();
        });

        // 重置保存分数按钮
        saveScoreButton.disabled = false;
        saveScoreButton.textContent = '保存分数';

        // 隐藏游戏消息
        messageContainer.classList.remove('show');
    }

    /**
     * 获取用户最高分
     * @returns {Promise} 返回一个Promise，在获取完成后解析
     */
    function getUserBestScore() {
        // 首先设置本地存储的最高分
        bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        bestScoreDisplay.textContent = bestScore;

        // 检查用户是否登录
        const userData = localStorage.getItem('user_data');

        if (!userData) {
            return Promise.resolve(); // 如果用户未登录，立即解析Promise
        }

        const user = JSON.parse(userData);

        // 获取用户在2048游戏的最高分
        return fetch(`/api/get_leaderboard.php?game_slug=2048&user_id=${user.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.user_best_score && data.user_best_score.best_score) {
                    // 设置用户最高分
                    const userBestScore = parseInt(data.user_best_score.best_score);
                    if (userBestScore > bestScore) {
                        bestScore = userBestScore;
                        localStorage.setItem('bestScore', bestScore);
                        bestScoreDisplay.textContent = bestScore;
                    }
                }
            })
            .catch(error => {
                console.error('获取用户最高分错误:', error);
            });
    }

    /**
     * 清除所有方块
     */
    function clearTiles() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
    }

    /**
     * 创建背景网格
     */
    function createBackgroundGrid() {
        backgroundGrid.innerHTML = '';
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            backgroundGrid.appendChild(cell);
        }
    }

    /**
     * 计算方块尺寸
     */
    function updateTileSize() {
        const boardSize = gameBoard.clientWidth - (CELL_GAP * 2);
        const cellSize = (boardSize - ((GRID_SIZE - 1) * CELL_GAP)) / GRID_SIZE;

        // 设置CSS变量
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
        document.documentElement.style.setProperty('--cell-gap', `${CELL_GAP}px`);
    }

    /**
     * 添加随机方块
     */
    function addRandomTile() {
        const emptyCells = [];

        // 找出所有空位置
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        // 如果有空位置，随机添加一个方块
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[row][col] = Math.random() < 0.9 ? 2 : 4;

            // 获取单元格尺寸并为新方块添加动画
            const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
            const cellGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

            // 创建新方块元素
            const tile = document.createElement('div');
            tile.className = `tile tile-${grid[row][col]} tile-new`;
            tile.textContent = grid[row][col];

            // 计算位置
            const x = CELL_GAP + col * (cellSize + cellGap);
            const y = CELL_GAP + row * (cellSize + cellGap);

            // 设置样式
            tile.style.width = `${cellSize}px`;
            tile.style.height = `${cellSize}px`;
            tile.style.left = `${x}px`;
            tile.style.top = `${y}px`;

            // 添加到游戏板
            gameBoard.appendChild(tile);

            // 移除动画类
            setTimeout(() => {
                tile.classList.remove('tile-new');
            }, 300);
        }
    }

    /**
     * 渲染网格
     */
    function renderGrid() {
        // 清除现有方块
        clearTiles();

        // 获取单元格尺寸
        const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        const cellGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

        // 渲染每个方块
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = grid[row][col];

                if (value !== 0) {
                    // 创建方块元素
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    tile.textContent = value;

                    // 计算位置 - 确保在网格单元格的中心
                    const x = CELL_GAP + col * (cellSize + cellGap);
                    const y = CELL_GAP + row * (cellSize + cellGap);

                    // 设置样式
                    tile.style.width = `${cellSize}px`;
                    tile.style.height = `${cellSize}px`;
                    tile.style.left = `${x}px`;
                    tile.style.top = `${y}px`;

                    // 添加到游戏板
                    gameBoard.appendChild(tile);
                }
            }
        }
    }

    /**
     * 处理一行的向左移动
     */
    function moveOneRowLeft(row) {
        // 保存原始行以检查是否有移动
        const originalRow = [...row];

        // 标记哪些位置发生了合并，用于添加动画效果
        const mergedPositions = Array(GRID_SIZE).fill(false);

        // 获取非零元素
        const nonZeros = row.filter(val => val !== 0);

        // 合并相同数字
        for (let i = 0; i < nonZeros.length - 1; i++) {
            if (nonZeros[i] === nonZeros[i + 1]) {
                nonZeros[i] *= 2;
                score += nonZeros[i];
                nonZeros[i + 1] = 0;

                // 标记这个位置发生了合并
                let position = nonZeros.slice(0, i).filter(val => val !== 0).length;
                mergedPositions[position] = true;
            }
        }

        // 移除合并后的零
        const mergedRow = nonZeros.filter(val => val !== 0);

        // 填充零到原始长度
        while (mergedRow.length < GRID_SIZE) {
            mergedRow.push(0);
        }

        // 更新行
        for (let i = 0; i < GRID_SIZE; i++) {
            row[i] = mergedRow[i];
        }

        // 返回移动信息
        return {
            moved: JSON.stringify(originalRow) !== JSON.stringify(row),
            mergedPositions: mergedPositions
        };
    }

    /**
     * 向左移动
     */
    function moveLeft() {
        let moved = false;
        // 存储合并位置信息
        const allMergedPositions = [];

        for (let row = 0; row < GRID_SIZE; row++) {
            // 处理每一行
            const result = moveOneRowLeft(grid[row]);

            // 更新是否有移动
            if (result.moved) {
                moved = true;
            }

            // 保存这一行的合并位置信息
            allMergedPositions.push({
                rowIndex: row,
                positions: result.mergedPositions
            });
        }

        return {
            moved: moved,
            mergedPositions: allMergedPositions
        };
    }

    /**
     * 向右移动
     */
    function moveRight() {
        let moved = false;
        // 存储合并位置信息
        const allMergedPositions = [];

        for (let row = 0; row < GRID_SIZE; row++) {
            // 反转行
            grid[row].reverse();

            // 使用向左移动的逻辑
            const result = moveOneRowLeft(grid[row]);

            // 再次反转回来
            grid[row].reverse();

            // 反转合并位置信息
            result.mergedPositions.reverse();

            // 更新是否有移动
            if (result.moved) {
                moved = true;
            }

            // 保存这一行的合并位置信息
            allMergedPositions.push({
                rowIndex: row,
                positions: result.mergedPositions
            });
        }

        return {
            moved: moved,
            mergedPositions: allMergedPositions
        };
    }

    /**
     * 向上移动
     */
    function moveUp() {
        let moved = false;
        // 存储合并位置信息
        const allMergedPositions = [];

        // 处理每一列
        for (let col = 0; col < GRID_SIZE; col++) {
            // 提取列
            const column = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                column.push(grid[row][col]);
            }

            // 使用向左移动的逻辑处理列
            const result = moveOneRowLeft(column);

            // 如果有移动，更新网格
            if (result.moved) {
                moved = true;
                // 更新列到网格
                for (let row = 0; row < GRID_SIZE; row++) {
                    grid[row][col] = column[row];
                }
            }

            // 保存这一列的合并位置信息
            for (let row = 0; row < GRID_SIZE; row++) {
                if (result.mergedPositions[row]) {
                    allMergedPositions.push({
                        rowIndex: row,
                        colIndex: col
                    });
                }
            }
        }

        return {
            moved: moved,
            mergedPositions: allMergedPositions
        };
    }

    /**
     * 向下移动
     */
    function moveDown() {
        let moved = false;
        // 存储合并位置信息
        const allMergedPositions = [];

        // 处理每一列
        for (let col = 0; col < GRID_SIZE; col++) {
            // 提取列并反转
            const column = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                column.push(grid[row][col]);
            }
            column.reverse();

            // 使用向左移动的逻辑
            const result = moveOneRowLeft(column);

            // 再次反转
            column.reverse();
            // 反转合并位置信息
            result.mergedPositions.reverse();

            // 如果有移动，更新网格
            if (result.moved) {
                moved = true;
                // 更新列到网格
                for (let row = 0; row < GRID_SIZE; row++) {
                    grid[row][col] = column[row];
                }
            }

            // 保存这一列的合并位置信息
            for (let row = 0; row < GRID_SIZE; row++) {
                if (result.mergedPositions[row]) {
                    allMergedPositions.push({
                        rowIndex: row,
                        colIndex: col
                    });
                }
            }
        }

        return {
            moved: moved,
            mergedPositions: allMergedPositions
        };
    }

    /**
     * 移动方块
     */
    function move(direction) {
        // 保存移动前的状态
        const previousState = JSON.stringify(grid);
        let moveResult = { moved: false, mergedPositions: [] };

        // 根据方向处理移动
        switch (direction) {
            case 'left':
                moveResult = moveLeft();
                break;
            case 'right':
                moveResult = moveRight();
                break;
            case 'up':
                moveResult = moveUp();
                break;
            case 'down':
                moveResult = moveDown();
                break;
        }

        // 如果有移动，添加新方块并更新
        if (moveResult.moved) {
            // 清除现有方块，重新渲染
            clearTiles();
            renderGridWithMergeEffect(moveResult.mergedPositions, direction);

            // 添加新方块
            setTimeout(() => {
                addRandomTile();
                updateScore();
                checkGameStatus();
            }, 400); // 等待合并动画完成
        }
    }

    /**
     * 渲染网格并添加合并效果
     */
    function renderGridWithMergeEffect(mergedPositions, direction) {
        // 获取单元格尺寸
        const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        const cellGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

        // 渲染每个方块
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = grid[row][col];

                if (value !== 0) {
                    // 创建方块元素
                    const tile = document.createElement('div');

                    // 检查这个位置是否发生了合并
                    let merged = false;

                    if (direction === 'left' || direction === 'right') {
                        // 水平方向的合并
                        mergedPositions.forEach(info => {
                            if (info.rowIndex === row && info.positions[col]) {
                                merged = true;
                            }
                        });
                    } else {
                        // 垂直方向的合并
                        mergedPositions.forEach(info => {
                            if (info.rowIndex === row && info.colIndex === col) {
                                merged = true;
                            }
                        });
                    }

                    // 添加合并效果类
                    tile.className = `tile tile-${value}${merged ? ' tile-merged' : ''}`;
                    tile.textContent = value;

                    // 计算位置
                    const x = CELL_GAP + col * (cellSize + cellGap);
                    const y = CELL_GAP + row * (cellSize + cellGap);

                    // 设置样式
                    tile.style.width = `${cellSize}px`;
                    tile.style.height = `${cellSize}px`;
                    tile.style.left = `${x}px`;
                    tile.style.top = `${y}px`;

                    // 添加到游戏板
                    gameBoard.appendChild(tile);
                }
            }
        }
    }

    /**
     * 键盘事件处理
     */
    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                move('right');
                break;
            case 'ArrowUp':
                event.preventDefault();
                move('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                move('down');
                break;
        }
    }

    /**
     * 设置触摸事件
     */
    function setupTouchEvents() {
        let startX, startY;
        let isInGameArea = false;
        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();

        document.addEventListener('touchstart', (e) => {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;

            // 检查触摸是否在游戏板区域内
            isInGameArea = touchX >= boardRect.left && touchX <= boardRect.right &&
                touchY >= boardRect.top && touchY <= boardRect.bottom;

            if (isInGameArea) {
                startX = touchX;
                startY = touchY;
                e.preventDefault(); // 阻止默认行为，避免页面滚动
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isInGameArea) return;
            e.preventDefault(); // 在游戏区域内阻止默认滚动行为
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!isInGameArea || !startX || !startY) {
                isInGameArea = false;
                return;
            }

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            e.preventDefault(); // 阻止默认行为

            const diffX = endX - startX;
            const diffY = endY - startY;

            // 判断滑动方向
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (diffX > 5) move('right');
                else if (diffX < -5) move('left');
            } else {
                // 垂直滑动
                if (diffY > 5) move('down');
                else if (diffY < -5) move('up');
            }

            // 重置状态
            startX = null;
            startY = null;
            isInGameArea = false;
        }, { passive: false });
    }

    /**
     * 更新得分显示
     */
    function updateScore() {
        // 更新当前分数显示
        scoreDisplay.textContent = score;

        // 先确保bestScore值正确
        const storedBestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        if (storedBestScore > bestScore) {
            bestScore = storedBestScore;
        }

        // 更新最高分
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
        }

        // 总是更新最高分显示
        bestScoreDisplay.textContent = bestScore;

        // 如果是登录用户，并且已经超过了之前的最高分，提示保存
        if (score > bestScore && localStorage.getItem('user_data') && !gameOver) {
            saveScoreButton.disabled = false;
            saveScoreButton.textContent = '保存新纪录';
        }
    }

    /**
     * 检查游戏状态
     */
    function checkGameStatus() {
        // 检查是否胜利 (达到2048)
        let won = false;
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (grid[y][x] === 2048 && !gameWon) {
                    gameWon = true;
                    won = true;
                    break;
                }
            }
            if (won) break;
        }

        if (won) {
            showMessage("恭喜你，达到2048！");
            // 游戏胜利，自动保存分数
            saveScore(true);
            return;
        }

        // 检查是否还有空格子
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (grid[y][x] === 0) {
                    return; // 仍有空格子，游戏继续
                }
            }
        }

        // 检查是否有相邻的相同数字
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 3; x++) {
                if (grid[y][x] === grid[y][x + 1]) {
                    return; // 有水平相邻相同数字，游戏继续
                }
            }
        }

        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 3; y++) {
                if (grid[y][x] === grid[y + 1][x]) {
                    return; // 有垂直相邻相同数字，游戏继续
                }
            }
        }

        // 如果没有空格子且没有可合并的方块，游戏结束
        gameOver = true;
        showMessage("游戏结束！");

        // 游戏结束，自动保存分数
        saveScore(true);
    }

    /**
     * 显示消息
     */
    function showMessage(text) {
        document.getElementById('message-text').textContent = text;
        messageContainer.classList.add('show');
    }

    /**
     * 返回首页
     */
    function goToHomePage() {
        window.location.href = '/';
    }

    /**
     * 显示排行榜
     */
    function showLeaderboard() {
        // 使用排行榜模态框API
        LeaderboardModal.show('2048');
    }

    /**
     * 隐藏排行榜
     */
    function hideLeaderboard() {
        // 使用排行榜模态框API
        LeaderboardModal.hide();
    }

    /**
     * 显示登录模态框
     */
    function showLoginModal() {
        // 使用登录模态框API
        LoginModal.show(() => {
            // 登录成功回调
            saveScore(false);
        });
    }

    /**
     * 隐藏登录模态框
     */
    function hideLoginModal() {
        // 使用登录模态框API
        LoginModal.hide();
    }

    /**
     * 处理登录
     */
    function handleLogin() {
        // 使用登录模态框API，此函数不再需要
    }

    /**
     * 保存分数
     * @param {boolean} autoSave 是否自动保存
     */
    function saveScore(autoSave = false) {
        // 检查游戏是否已结束
        if (!gameOver && !gameWon && !autoSave) {
            showMessage('游戏尚未结束，无法保存分数');
            return;
        }

        // 检查用户是否登录
        if (!LoginModal.isLoggedIn()) {
            // 显示登录模态框
            showLoginModal();
            return;
        }

        const userId = LoginModal.getUserId();

        // 禁用保存按钮并更改文本
        saveScoreButton.disabled = true;
        saveScoreButton.textContent = '保存中...';

        // 发送分数到后端API
        fetch('/api/submit_score.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_slug: '2048',
                score: score,
                user_id: userId
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    saveScoreButton.textContent = '分数已保存';

                    // 显示排行榜
                    showLeaderboard();
                } else {
                    saveScoreButton.textContent = '保存失败';
                    saveScoreButton.disabled = false;
                    showMessage(data.message || '保存分数失败');
                }
            })
            .catch(error => {
                console.error('保存分数错误:', error);
                saveScoreButton.textContent = '保存失败';
                saveScoreButton.disabled = false;
                showMessage('网络错误，请稍后再试');
            });
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        updateTileSize();
        renderGrid();
    });
});