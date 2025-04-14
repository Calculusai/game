<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 如果是OPTIONS请求，直接返回200状态码
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 调试日志函数
function log_debug($message) {
    $log_file = __DIR__ . '/../logs/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] {$message}\n";
    error_log($log_message, 3, $log_file);
}

// 清空日志文件，方便测试
file_put_contents(__DIR__ . '/../logs/debug.log', '');

log_debug("订阅请求开始处理");
log_debug("请求方法: " . $_SERVER['REQUEST_METHOD']);

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    log_debug("非POST请求: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
    exit;
}

// 获取POST数据
$postData = file_get_contents('php://input');
log_debug("接收到的原始数据: " . $postData);
$data = json_decode($postData, true);
log_debug("解析后的数据: " . print_r($data, true));

// 验证邮箱
if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    log_debug("邮箱验证失败: " . (isset($data['email']) ? $data['email'] : '空'));
    echo json_encode(['success' => false, 'message' => '请提供有效的电子邮箱']);
    exit;
}

// 验证名称（可选）
$name = !empty($data['name']) ? $data['name'] : '订阅用户';
log_debug("用户名: " . $name);

// 验证隐私政策
if (empty($data['privacy']) || $data['privacy'] !== true) {
    log_debug("隐私政策未同意");
    echo json_encode(['success' => false, 'message' => '请同意隐私政策']);
    exit;
}

// 数据库连接信息
$dbFile = __DIR__ . '/subscribers.db';
log_debug("数据库文件路径: " . $dbFile);

// 创建SQLite数据库
try {
    log_debug("尝试连接数据库");
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    log_debug("数据库连接成功");
    
    // 创建表（如果不存在）
    $db->exec('CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )');
    log_debug("确保数据表存在");
    
    // 检查邮箱是否已存在
    $stmt = $db->prepare('SELECT email FROM subscribers WHERE email = :email');
    $stmt->bindParam(':email', $data['email']);
    $stmt->execute();
    
    if ($stmt->fetch()) {
        log_debug("邮箱已存在: " . $data['email']);
        echo json_encode(['success' => false, 'message' => '该邮箱已订阅']);
        exit;
    }
    
    // 插入新订阅者
    log_debug("准备插入新订阅者");
    $stmt = $db->prepare('INSERT INTO subscribers (email, name) VALUES (:email, :name)');
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':name', $name);
    $stmt->execute();
    log_debug("订阅者数据插入成功");
    
    // 发送欢迎邮件
    log_debug("准备发送欢迎邮件");
    sendWelcomeEmail($data['email'], $name);
    
    log_debug("订阅流程完成，返回成功响应");
    echo json_encode(['success' => true, 'message' => '订阅成功']);
    
} catch (PDOException $e) {
    // 记录错误
    $errorMsg = '数据库错误: ' . $e->getMessage();
    log_debug("错误: " . $errorMsg);
    error_log($errorMsg);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
}

/**
 * 发送欢迎邮件
 */
function sendWelcomeEmail($email, $name) {
    global $log_debug;
    log_debug("开始发送欢迎邮件给: " . $email);
    // 引入邮件发送函数
    require_once __DIR__ . '/mail_sender.php';
    
    $subject = 'HoshinoAI游戏平台 - 订阅确认';
    
    $emailBody = '
        <div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif; color:#333;">
            <div style="background:#776e65; color:white; padding:20px; text-align:center;">
                <h1 style="margin:0;">HoshinoAI 游戏平台</h1>
                <p style="margin:10px 0 0 0;">🎮 订阅确认</p>
            </div>
            <div style="background:white; padding:30px; border-radius:0 0 5px 5px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color:#776e65; margin-top:0;">感谢您的订阅！</h2>
                <div style="color:#666; line-height:1.6;">
                    <p>尊敬的 ' . htmlspecialchars($name) . '：</p>
                    <p>感谢您订阅HoshinoAI游戏平台的通知。从现在开始，您将收到我们关于：</p>
                    <ul>
                        <li>新游戏发布</li>
                        <li>游戏更新</li>
                        <li>独家内容</li>
                        <li>新功能上线</li>
                    </ul>
                    <p>的第一手消息！</p>
                </div>
                <div style="margin-top:30px; text-align:center;">
                    <a href="https://game.hoshinoai.xin" style="background:#776e65; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; display:inline-block;">访问游戏平台</a>
                </div>
                <div style="margin-top:30px; padding-top:20px; border-top:1px solid #eee; font-size:12px; color:#999; text-align:center;">
                    <p>您收到此邮件是因为您订阅了 HoshinoAI 游戏平台的通知。</p>
                    <p>如果您想取消订阅，请回复此邮件并在主题中注明"取消订阅"。</p>
                </div>
            </div>
        </div>
    ';
    
    // 调用发送邮件函数
    log_debug("调用邮件发送函数");
    $result = sendEmail($email, $subject, $emailBody);
    log_debug("欢迎邮件发送结果: " . ($result ? "成功" : "失败"));
    return $result;
}
?> 