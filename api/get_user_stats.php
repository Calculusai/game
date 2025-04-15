<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '仅支持GET请求']);
    exit();
}

// 启动会话
session_start();

// 检查用户是否已登录
if (!isset($_SESSION['user_id']) && !isset($_GET['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit();
}

// 优先使用会话中的用户ID，如果没有则使用请求参数中的用户ID
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : $_GET['user_id'];

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 查询用户的游戏统计数据
    $stmt = $db->prepare("
        SELECT 
            g.name as game_name,
            g.slug as game_slug,
            MAX(l.score) as best_score,
            MAX(l.played_at) as last_played,
            COUNT(DISTINCT DATE(l.played_at)) as total_games
        FROM 
            leaderboards l
        JOIN 
            games g ON l.game_id = g.id
        WHERE 
            l.user_id = ?
        GROUP BY 
            g.id
        ORDER BY 
            last_played DESC
    ");
    $stmt->execute([$user_id]);
    $game_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 获取用户注册日期
    $stmt = $db->prepare("SELECT created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $register_date = $user ? $user['created_at'] : null;

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'game_stats' => $game_stats,
        'register_date' => $register_date
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('User stats error: ' . $e->getMessage());
} 