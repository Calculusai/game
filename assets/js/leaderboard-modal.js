/**
 * 排行榜模态窗口API
 * 提供通用的排行榜显示功能，可在任何游戏中调用
 */

const LeaderboardModal = {
    // 存储当前游戏的slug
    currentGameSlug: null,

    // 初始化函数
    init: function (gameSlug) {
        // 保存游戏slug
        this.currentGameSlug = gameSlug;

        // 如果已经存在排行榜模态框，则不重复创建
        if (document.getElementById('leaderboard-modal')) {
            this._loadLeaderboardData(gameSlug);
            return;
        }

        // 创建HTML结构
        const modalHTML = `
        <div class="modal" id="leaderboard-modal">
            <div class="modal-content">
                <span class="close-button" id="close-leaderboard">&times;</span>
                <h2>排行榜</h2>
                <div class="leaderboard-tabs">
                    <button class="tab-button active" data-period="today">今日榜</button>
                    <button class="tab-button" data-period="all">总榜</button>
                </div>
                <div class="user-score-container">
                    <div id="user-best-score">
                        <span>您的最高分：</span>
                        <span id="user-score-value">未登录</span>
                    </div>
                </div>
                <div class="leaderboard-container">
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>用户</th>
                                <th>分数</th>
                                <th>日期</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-data">
                            <tr>
                                <td colspan="4" class="loading-message">加载中...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="leaderboard-footer">
                    <button type="button" id="play-again" class="btn-primary">再玩一次</button>
                </div>
            </div>
        </div>
        `;

        // 添加CSS样式，如果还没有加载
        if (!document.getElementById('leaderboard-modal-styles')) {
            const styles = `
            /* 排行榜模态框样式 */
            #leaderboard-modal .modal-content {
                background-color: #fffef6;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                border: 1px solid #f0eee0;
                max-width: 650px;
                width: 90%;
                position: relative;
                margin: auto;
            }
            
            #leaderboard-modal h2 {
                color: #7a6a53;
                text-align: center;
                font-size: 28px;
                margin-bottom: 25px;
                font-weight: 500;
            }
            
            #leaderboard-modal .leaderboard-tabs {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #e0ddd0;
                padding-bottom: 10px;
            }
            
            #leaderboard-modal .tab-button {
                padding: 8px 20px;
                margin: 0 10px;
                border: none;
                background: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 16px;
                color: #7a6a53;
                transition: all 0.3s;
            }
            
            #leaderboard-modal .tab-button.active {
                background-color: #24293e;
                color: white;
            }
            
            #leaderboard-modal .tab-button:hover:not(.active) {
                background-color: #f0eee0;
            }
            
            #leaderboard-modal .user-score-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
                font-size: 16px;
                color: #5a5a5a;
            }
            
            #leaderboard-modal #user-score-value {
                font-weight: bold;
                color: #24293e;
                margin-left: 5px;
            }
            
            #leaderboard-modal .leaderboard-container {
                margin-bottom: 20px;
                max-height: 300px;
                overflow-y: auto;
                border-radius: 10px;
                border: 1px solid #e0ddd0;
            }
            
            #leaderboard-modal .leaderboard-table {
                width: 100%;
                border-collapse: collapse;
                background-color: #fffdf2;
            }
            
            #leaderboard-modal .leaderboard-table th {
                background-color: #f5f3e5;
                padding: 12px;
                text-align: center;
                font-weight: 500;
                color: #7a6a53;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            #leaderboard-modal .leaderboard-table td {
                padding: 10px;
                text-align: center;
                border-top: 1px solid #f0eee0;
                color: #5a5a5a;
            }
            
            #leaderboard-modal .leaderboard-table tr:hover td {
                background-color: #f9f7e8;
            }
            
            #leaderboard-modal .loading-message {
                padding: 20px;
                text-align: center;
                color: #888;
            }
            
            #leaderboard-modal .leaderboard-table .highlight-row {
                background-color: #fff8e1;
                font-weight: 500;
            }
            
            #leaderboard-modal .leaderboard-footer {
                display: flex;
                justify-content: center;
            }
            
            #leaderboard-modal .btn-primary {
                padding: 14px 30px;
                background-color: #24293e;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            #leaderboard-modal .btn-primary:hover {
                background-color: #333d59;
            }
            
            #leaderboard-modal .close-button {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 22px;
                color: #aaa;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            #leaderboard-modal .close-button:hover {
                color: #666;
            }
            
            /* 适配小屏幕 */
            @media (max-width: 576px) {
                #leaderboard-modal .tab-button {
                    padding: 6px 12px;
                    font-size: 14px;
                }
                
                #leaderboard-modal .leaderboard-table {
                    font-size: 14px;
                }
                
                #leaderboard-modal .leaderboard-table th,
                #leaderboard-modal .leaderboard-table td {
                    padding: 8px 5px;
                }
            }
            `;

            const styleElement = document.createElement('style');
            styleElement.id = 'leaderboard-modal-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }

        // 将模态框添加到DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // 设置事件监听器
        this._setupEventListeners();

        // 加载排行榜数据
        this._loadLeaderboardData(gameSlug);
    },

    // 设置事件监听器
    _setupEventListeners: function () {
        const closeButton = document.getElementById('close-leaderboard');
        const playAgainButton = document.getElementById('play-again');
        const tabButtons = document.querySelectorAll('.tab-button');
        const leaderboardModal = document.getElementById('leaderboard-modal');

        // 关闭按钮
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide();
            });
        }

        // 再玩一次按钮
        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.hide();

                // 触发事件通知游戏
                const event = new CustomEvent('leaderboard-play-again');
                document.dispatchEvent(event);
            });
        }

        // 标签切换按钮
        if (tabButtons) {
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // 移除所有标签的激活状态
                    tabButtons.forEach(btn => btn.classList.remove('active'));

                    // 添加当前标签的激活状态
                    e.target.classList.add('active');

                    // 加载排行榜数据
                    const period = e.target.dataset.period;
                    this._loadLeaderboardData(this.currentGameSlug, period);
                });
            });
        }
    },

    // 加载排行榜数据
    _loadLeaderboardData: function (gameSlug, period = 'today') {
        if (!gameSlug) {
            return;
        }

        const leaderboardData = document.getElementById('leaderboard-data');
        const userScoreValue = document.getElementById('user-score-value');

        if (leaderboardData) {
            // 显示加载中
            leaderboardData.innerHTML = '<tr><td colspan="4" class="loading-message">加载中...</td></tr>';
        }

        // 获取用户ID，如果有登录
        const userId = localStorage.getItem('user_id');

        // 构建请求URL
        let url = `/api/get_leaderboard.php?game_slug=${encodeURIComponent(gameSlug)}`;
        if (userId) {
            url += `&user_id=${encodeURIComponent(userId)}`;
        }
        if (period === 'today') {
            url += '&period=today';
        }

        // 发送请求获取排行榜数据
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 更新用户分数
                    if (userScoreValue) {
                        if (data.user_best_score && data.user_best_score.best_score) {
                            userScoreValue.textContent = data.user_best_score.best_score;
                        } else if (userId) {
                            userScoreValue.textContent = '暂无分数';
                        } else {
                            userScoreValue.textContent = '未登录';
                        }
                    }

                    // 渲染排行榜
                    if (leaderboardData) {
                        if (data.leaderboard && data.leaderboard.length > 0) {
                            let html = '';
                            data.leaderboard.forEach((item, index) => {
                                const isCurrentUser = userId && item.user_id === parseInt(userId);
                                const rowClass = isCurrentUser ? 'highlight-row' : '';

                                html += `<tr class="${rowClass}">
                                    <td>${index + 1}</td>
                                    <td>${this._escapeHtml(item.username)}</td>
                                    <td>${item.score}</td>
                                    <td>${this._formatDate(item.played_at)}</td>
                                </tr>`;
                            });
                            leaderboardData.innerHTML = html;
                        } else {
                            leaderboardData.innerHTML = '<tr><td colspan="4" class="loading-message">暂无数据</td></tr>';
                        }
                    }
                } else {
                    if (leaderboardData) {
                        leaderboardData.innerHTML = '<tr><td colspan="4" class="loading-message">加载失败</td></tr>';
                    }
                }
            })
            .catch(error => {
                console.error('获取排行榜失败:', error);
                if (leaderboardData) {
                    leaderboardData.innerHTML = '<tr><td colspan="4" class="loading-message">加载失败</td></tr>';
                }
            });
    },

    // HTML转义，防止XSS攻击
    _escapeHtml: function (text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // 格式化日期
    _formatDate: function (dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        // 是否是今天
        if (date >= today) {
            return '今天 ' + this._formatTime(date);
        }

        // 是否是昨天
        if (date >= yesterday) {
            return '昨天 ' + this._formatTime(date);
        }

        // 其他日期
        return `${date.getFullYear()}-${this._padZero(date.getMonth() + 1)}-${this._padZero(date.getDate())} ${this._formatTime(date)}`;
    },

    // 格式化时间
    _formatTime: function (date) {
        return `${this._padZero(date.getHours())}:${this._padZero(date.getMinutes())}`;
    },

    // 补零
    _padZero: function (num) {
        return num < 10 ? '0' + num : num;
    },

    // 显示排行榜模态框
    show: function (gameSlug) {
        if (gameSlug) {
            this.init(gameSlug);
        }

        const leaderboardModal = document.getElementById('leaderboard-modal');
        if (leaderboardModal) {
            leaderboardModal.style.display = 'flex';
        }
    },

    // 隐藏排行榜模态框
    hide: function () {
        const leaderboardModal = document.getElementById('leaderboard-modal');
        if (leaderboardModal) {
            leaderboardModal.style.display = 'none';
        }
    }
};

// 暴露全局API
window.LeaderboardModal = LeaderboardModal; 