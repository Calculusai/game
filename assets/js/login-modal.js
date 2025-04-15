/**
 * 登录模态窗口API
 * 提供通用的登录功能，可在任何游戏中调用
 */

const LoginModal = {
    // 存储登录成功后的回调函数
    callbacks: [],

    // 初始化函数
    init: function () {
        // 如果已经存在登录模态框，则不重复创建
        if (document.getElementById('login-modal')) {
            return;
        }

        // 创建HTML结构
        const modalHTML = `
        <div class="modal" id="login-modal">
            <div class="modal-content">
                <span class="close-button" id="close-login">&times;</span>
                <h2>用户登录</h2>
                <div id="login-alert" class="alert alert-danger" style="display:none;">缺少必要参数</div>
                <div class="form-group">
                    <label for="login-username">用户名</label>
                    <div class="input-wrapper">
                        <input type="text" id="login-username" name="username" placeholder="请输入用户名" required>
                        <span class="input-status"></span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="login-password">密码</label>
                    <div class="input-wrapper">
                        <input type="password" id="login-password" name="password" placeholder="请输入密码" required>
                        <span class="input-status"></span>
                    </div>
                </div>
                <div class="form-group">
                    <button type="button" id="login-submit" class="btn-primary">登录</button>
                </div>
                <div class="login-links">
                    <span>还没有账号？</span>
                    <a href="/user/register.html">立即注册</a>
                </div>
            </div>
        </div>
        `;

        // 添加CSS样式，如果还没有加载
        if (!document.getElementById('login-modal-styles')) {
            const styles = `
            /* 模态框基础样式 */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            /* 登录模态框特殊样式 */
            #login-modal .modal-content {
                background-color: #fffef6;
                border-radius: 20px;
                padding: 30px;
                box-shadow: none;
                border: 1px solid #f0eee0;
                max-width: 420px;
                width: 90%;
                position: relative;
                margin: auto;
            }
            
            #login-modal h2 {
                color: #7a6a53;
                text-align: center;
                font-size: 28px;
                margin-bottom: 25px;
                font-weight: 500;
            }
            
            #login-modal .form-group {
                margin-bottom: 25px;
            }
            
            #login-modal .form-group label {
                display: block;
                color: #5a5a5a;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            #login-modal .input-wrapper {
                position: relative;
                width: 100%;
            }
            
            #login-modal .form-group input {
                width: 100%;
                padding: 12px 15px;
                border: 1px solid #e0ddd0;
                border-radius: 8px;
                background-color: #fffdf2;
                font-size: 16px;
                transition: all 0.3s;
            }
            
            #login-modal .form-group input:focus {
                outline: none;
                border-color: #c0b798;
                box-shadow: 0 0 0 2px rgba(192, 183, 152, 0.2);
            }
            
            #login-modal .input-status {
                position: absolute;
                top: 50%;
                right: 15px;
                transform: translateY(-50%);
                width: 18px;
                height: 18px;
                background-image: url("/assets/images/lock.png");
                background-size: contain;
                background-repeat: no-repeat;
            }
            
            #login-modal .btn-primary {
                width: 100%;
                padding: 14px;
                background-color: #24293e;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            #login-modal .btn-primary:hover {
                background-color: #333d59;
            }
            
            #login-modal .login-links {
                text-align: center;
                margin-top: 20px;
                font-size: 14px;
                color: #666;
            }
            
            #login-modal .login-links a {
                color: #7a6a53;
                text-decoration: none;
                font-weight: 500;
                margin-left: 5px;
            }
            
            #login-modal .login-links a:hover {
                text-decoration: underline;
            }
            
            #login-modal .close-button {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 22px;
                color: #aaa;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            #login-modal .close-button:hover {
                color: #666;
            }
            
            #login-modal .alert-danger {
                background-color: #fff5f5;
                border: 1px solid #ffeeee;
                color: #d35a5a;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
                text-align: center;
            }
            `;

            const styleElement = document.createElement('style');
            styleElement.id = 'login-modal-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }

        // 将模态框添加到DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // 设置事件监听器
        this._setupEventListeners();
    },

    // 设置事件监听器
    _setupEventListeners: function () {
        const closeButton = document.getElementById('close-login');
        const loginSubmit = document.getElementById('login-submit');
        const loginModal = document.getElementById('login-modal');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        // 关闭按钮
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide();
            });
        }

        // 登录按钮
        if (loginSubmit) {
            loginSubmit.addEventListener('click', () => {
                this._handleLogin();
            });
        }

        // 用户名输入框验证
        if (usernameInput) {
            usernameInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                const statusIcon = e.target.parentNode.querySelector('.input-status');

                if (value) {
                    usernameInput.style.borderColor = '#26e07f';
                    statusIcon.style.backgroundImage = 'url("/assets/images/ok.png")';
                } else {
                    usernameInput.style.borderColor = '#e0ddd0';
                    statusIcon.style.backgroundImage = 'url("/assets/images/lock.png")';
                }

                // 隐藏警告信息
                if (value && passwordInput.value) {
                    document.getElementById('login-alert').style.display = 'none';
                }
            });
        }

        // 密码输入框验证
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                const value = e.target.value;
                const statusIcon = e.target.parentNode.querySelector('.input-status');

                if (value) {
                    passwordInput.style.borderColor = '#26e07f';
                    statusIcon.style.backgroundImage = 'url("/assets/images/ok.png")';
                } else {
                    passwordInput.style.borderColor = '#e0ddd0';
                    statusIcon.style.backgroundImage = 'url("/assets/images/lock.png")';
                }

                // 隐藏警告信息
                if (value && usernameInput.value.trim()) {
                    document.getElementById('login-alert').style.display = 'none';
                }
            });
        }

        // 按下回车键提交
        if (usernameInput && passwordInput) {
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this._handleLogin();
                    }
                });
            });
        }

        // 点击外部区域关闭模态框
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hide();
            }
        });
    },

    // 处理登录逻辑
    _handleLogin: function () {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const alertElement = document.getElementById('login-alert');
        const usernameField = document.getElementById('login-username');
        const passwordField = document.getElementById('login-password');

        // 重置所有错误状态
        alertElement.style.display = 'none';
        usernameField.style.borderColor = '#e0ddd0';
        passwordField.style.borderColor = '#e0ddd0';

        // 字段验证
        let hasError = false;
        if (!username) {
            usernameField.style.borderColor = '#ff6b6b';
            hasError = true;
        }

        if (!password) {
            passwordField.style.borderColor = '#ff6b6b';
            hasError = true;
        }

        if (hasError) {
            alertElement.textContent = '请输入用户名和密码';
            alertElement.style.display = 'block';
            return;
        }

        // 显示加载状态
        const submitButton = document.getElementById('login-submit');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = '登录中...';
        submitButton.disabled = true;

        // 发送登录请求 - 修改为JSON格式
        fetch('/api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
            .then(response => response.json())
            .then(data => {
                // 恢复按钮状态
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                if (data.success) {
                    // 保存用户信息 - 使用与全局登录一致的格式
                    localStorage.setItem('user_id', data.user.id);
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('user_data', JSON.stringify({
                        id: data.user.id,
                        username: data.user.username,
                        email: data.user.email,
                        token: data.user.token
                    }));

                    // 关闭模态框
                    this.hide();

                    // 执行所有注册的回调函数
                    this.callbacks.forEach(callback => callback(data));

                    // 清空回调列表
                    this.callbacks = [];
                } else {
                    // 显示错误消息
                    alertElement.textContent = data.message || '登录失败';
                    alertElement.style.display = 'block';

                    // 标记错误字段
                    if (data.message && data.message.includes('用户名')) {
                        usernameField.style.borderColor = '#ff6b6b';
                    }
                    if (data.message && data.message.includes('密码')) {
                        passwordField.style.borderColor = '#ff6b6b';
                    }
                }
            })
            .catch(error => {
                console.error('登录请求出错:', error);
                alertElement.textContent = '登录请求失败，请稍后再试';
                alertElement.style.display = 'block';

                // 恢复按钮状态
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            });
    },

    // 显示登录模态框
    show: function (callback) {
        this.init();

        // 如果有回调函数，添加到回调列表
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }

        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'flex';

            // 清空之前的输入和警告
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const alertElement = document.getElementById('login-alert');

            // 重置输入框和状态
            usernameInput.value = '';
            passwordInput.value = '';
            alertElement.style.display = 'none';

            // 重置输入框边框颜色
            usernameInput.style.borderColor = '#e0ddd0';
            passwordInput.style.borderColor = '#e0ddd0';

            // 重置状态图标
            usernameInput.parentNode.querySelector('.input-status').style.backgroundImage = 'url("/assets/images/lock.png")';
            passwordInput.parentNode.querySelector('.input-status').style.backgroundImage = 'url("/assets/images/lock.png")';

            // 聚焦用户名输入框
            setTimeout(() => {
                usernameInput.focus();
            }, 100);
        }
    },

    // 隐藏登录模态框
    hide: function () {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    },

    // 检查用户是否已登录
    isLoggedIn: function () {
        return localStorage.getItem('user_id') !== null;
    },

    // 获取当前用户ID
    getUserId: function () {
        return localStorage.getItem('user_id');
    },

    // 获取用户名
    getUsername: function () {
        return localStorage.getItem('username');
    },

    // 退出登录
    logout: function () {
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
    }
};

// 暴露全局API
window.LoginModal = LoginModal; 