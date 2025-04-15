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

// 获取并解析POST数据
$data = json_decode(file_get_contents('php://input'), true);

// 验证管理员令牌（应该使用更安全的方式）
$correct_token = 'd402cd31e689ebe4b1e6bafed829b44f'; // md5('hoshinoai2024')

if (!isset($data['admin_token']) || $data['admin_token'] !== $correct_token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '未授权，管理员令牌无效']);
    exit();
}

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取总用户数
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $total_users = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 获取总游戏数
    $stmt = $db->query("SELECT COUNT(*) as count FROM games");
    $total_games = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 获取总记录数
    $stmt = $db->query("SELECT COUNT(*) as count FROM leaderboards");
    $total_records = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 获取今日活跃用户数（今天有游戏记录的用户）
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT user_id) as count 
        FROM leaderboards 
        WHERE DATE(played_at) = DATE('now')
    ");
    $stmt->execute();
    $today_active_users = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 返回统计数据
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'total_users' => $total_users,
        'total_games' => $total_games,
        'total_records' => $total_records,
        'today_active_users' => $today_active_users
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin dashboard stats error: ' . $e->getMessage());
} 