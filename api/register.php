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

if (!isset($data['username']) || !isset($data['password']) || !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少必要参数']);
    exit();
}

$username = trim($data['username']);
$password = trim($data['password']);
$email = trim($data['email']);

// 验证用户名
if (empty($username) || strlen($username) < 3 || strlen($username) > 20) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '用户名长度应在3-20个字符之间']);
    exit();
}

// 验证密码
if (empty($password) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '密码长度应不少于6个字符']);
    exit();
}

// 验证邮箱
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '邮箱格式不正确']);
    exit();
}

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 检查用户名是否已存在
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '用户名已存在']);
        exit();
    }

    // 检查邮箱是否已存在
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '邮箱已被注册']);
        exit();
    }

    // 密码哈希处理
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // 插入用户数据
    $stmt = $db->prepare("INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, datetime('now'))");
    $stmt->execute([$username, $hashed_password, $email]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => '注册成功']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Registration error: ' . $e->getMessage());
} 