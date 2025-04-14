<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 调试日志函数
function log_debug($message) {
    $log_file = __DIR__ . '/../logs/notify_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] {$message}\n";
    error_log($log_message, 3, $log_file);
}

// 清空日志文件，方便测试
file_put_contents(__DIR__ . '/../logs/notify_debug.log', '');

log_debug("通知请求开始处理");
log_debug("请求方法: " . $_SERVER['REQUEST_METHOD']);

// 如果是OPTIONS请求，直接返回200状态码
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

// 验证请求数据
if (empty($data['type']) || empty($data['title']) || empty($data['content'])) {
    log_debug("缺少必要的字段");
    echo json_encode(['success' => false, 'message' => '缺少必要的字段']);
    exit;
}

// 验证管理员权限（简易验证，生产环境应使用更安全的方式）
$expected_token = md5('hoshinoai2024');
log_debug("预期的Token: " . $expected_token);
log_debug("收到的Token: " . (isset($data['admin_token']) ? $data['admin_token'] : '未提供'));

if (empty($data['admin_token']) || $data['admin_token'] !== $expected_token) {
    log_debug("管理员验证失败");
    echo json_encode(['success' => false, 'message' => '管理员验证失败']);
    exit;
}

log_debug("管理员验证成功");

// 引入邮件发送函数
require_once __DIR__ . '/mail_sender.php';

// 数据库连接信息
$dbFile = __DIR__ . '/subscribers.db';
log_debug("数据库文件路径: " . $dbFile);

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    log_debug("数据库连接成功");
    
    // 获取所有订阅者
    $stmt = $db->query('SELECT * FROM subscribers');
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    log_debug("查询到订阅者数量: " . count($subscribers));
    
    if (empty($subscribers)) {
        log_debug("没有订阅用户");
        echo json_encode(['success' => false, 'message' => '没有订阅用户']);
        exit;
    }
    
    // 准备邮件内容
    $subject = 'HoshinoAI游戏平台 - ' . $data['title'];
    $emailBody = getEmailTemplate($data['type'], $data['title'], $data['content']);
    log_debug("邮件主题: " . $subject);
    
    // 记录成功和失败的邮件
    $successCount = 0;
    $failedEmails = [];
    
    // 开始发送邮件
    foreach ($subscribers as $subscriber) {
        log_debug("准备发送邮件到: " . $subscriber['email']);
        $result = sendEmail($subscriber['email'], $subject, $emailBody);
        
        if ($result) {
            $successCount++;
            log_debug("发送成功");
        } else {
            $failedEmails[] = $subscriber['email'];
            log_debug("发送失败");
        }
        
        // 添加短暂延迟，避免邮件服务器限制
        usleep(250000); // 250毫秒
    }
    
    // 记录通知
    $stmt = $db->prepare('INSERT INTO notifications (type, title, content, sent_count, total_count) 
                          VALUES (:type, :title, :content, :sent_count, :total_count)');
    
    $stmt->bindParam(':type', $data['type']);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':content', $data['content']);
    $stmt->bindParam(':sent_count', $successCount);
    $totalCount = count($subscribers);
    $stmt->bindParam(':total_count', $totalCount);
    
    $stmt->execute();
    log_debug("通知记录已保存到数据库");
    
    // 返回结果
    $response = [
        'success' => true,
        'message' => "通知发送完成",
        'data' => [
            'total' => count($subscribers),
            'success' => $successCount,
            'failed' => count($failedEmails),
            'failed_emails' => $failedEmails
        ]
    ];
    log_debug("返回响应: " . json_encode($response));
    echo json_encode($response);
    
} catch (PDOException $e) {
    // 记录错误
    $errorMsg = '数据库错误: ' . $e->getMessage();
    log_debug("错误: " . $errorMsg);
    error_log($errorMsg);
    echo json_encode(['success' => false, 'message' => '服务器错误：' . $e->getMessage()]);
}

/**
 * 获取邮件模板
 */
function getEmailTemplate($type, $title, $content) {
    // 根据不同类型设置图标和文本
    $typeInfo = [
        'new-game' => ['icon' => '🎮', 'text' => '新游戏发布'],
        'game-update' => ['icon' => '🔄', 'text' => '游戏更新'],
        'exclusive' => ['icon' => '👑', 'text' => '独家内容'],
        'feature' => ['icon' => '🚀', 'text' => '新功能上线'],
        'default' => ['icon' => '📣', 'text' => '通知']
    ];
    
    $info = isset($typeInfo[$type]) ? $typeInfo[$type] : $typeInfo['default'];
    $typeIcon = $info['icon'];
    $typeText = $info['text'];
    
    // HTML格式的邮件内容
    return '
        <div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif; color:#333;">
            <div style="background:#776e65; color:white; padding:20px; text-align:center;">
                <h1 style="margin:0;">HoshinoAI 游戏平台</h1>
                <p style="margin:10px 0 0 0;">' . $typeIcon . ' ' . $typeText . '</p>
            </div>
            <div style="background:white; padding:30px; border-radius:0 0 5px 5px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color:#776e65; margin-top:0;">' . htmlspecialchars($title) . '</h2>
                <div style="color:#666; line-height:1.6;">
                    ' . nl2br(htmlspecialchars($content)) . '
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
}
?> 