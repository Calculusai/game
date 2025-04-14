/**
 * 简洁版2048游戏实现
 */
document.addEventListener('DOMContentLoaded', () => {
    // 游戏核心配置
    const GRID_SIZE = 4;
    const CELL_GAP = 15;

    // 游戏状态
    let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('bestScore')) || 0;

    // DOM元素
    const gameBoard = document.getElementById('game-board');
    const backgroundGrid = document.getElementById('background-grid');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const messageContainer = document.getElementById('game-message');

    // 初始化游戏
    initGame();

    // 绑定事件
    document.getElementById('new-game').addEventListener('click', initGame);
    document.getElementById('retry').addEventListener('click', initGame);
    document.getElementById('home-button').addEventListener('click', goToHomePage);
    document.addEventListener('keydown', handleKeyPress);
    setupTouchEvents();

    /**
     * 初始化游戏
     */
    function initGame() {
        // 重置游戏状态
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        score = 0;
        updateScore();
        messageContainer.classList.remove('show');

        // 清除方块
        clearTiles();

        // 创建背景格子
        createBackgroundGrid();

        // 更新尺寸
        updateTileSize();

        // 添加初始方块
        addRandomTile();
        addRandomTile();
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
     * 更新分数显示
     */
    function updateScore() {
        scoreDisplay.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore);
            bestScoreDisplay.textContent = bestScore;
        }
    }

    /**
     * 检查游戏状态
     */
    function checkGameStatus() {
        // 检查是否达到2048
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 2048) {
                    showMessage('恭喜获胜！');
                    return;
                }
            }
        }

        // 检查是否还有空格子
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) return;
            }
        }

        // 检查是否还能移动
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE - 1; col++) {
                if (grid[row][col] === grid[row][col + 1]) return;
            }
        }

        for (let col = 0; col < GRID_SIZE; col++) {
            for (let row = 0; row < GRID_SIZE - 1; row++) {
                if (grid[row][col] === grid[row + 1][col]) return;
            }
        }

        // 游戏结束
        showMessage('游戏结束！');
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
        // 跳转到首页
        window.location.href = "/index.html";
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        updateTileSize();
        renderGrid();
    });
});