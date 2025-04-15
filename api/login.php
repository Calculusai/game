<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
    exit();
}

// 获取并验证输入数据
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少必要参数']);
    exit();
}

$username = trim($data['username']);
$password = trim($data['password']);

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取用户信息
    $stmt = $db->prepare("SELECT id, username, password, email FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => '用户名或密码错误']);
        exit();
    }

    // 更新最后登录时间
    $stmt = $db->prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?");
    $stmt->execute([$user['id']]);

    // 生成简单的会话令牌（在实际环境中，应该使用更安全的方法）
    $token = bin2hex(random_bytes(32));
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['token'] = $token;

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => '登录成功', 
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'token' => $token
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Login error: ' . $e->getMessage());
} 