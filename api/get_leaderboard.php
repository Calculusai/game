<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// 获取游戏slug参数
if (!isset($_GET['game_slug'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少游戏参数']);
    exit();
}

$game_slug = trim($_GET['game_slug']);
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10; // 默认返回前10名

// 限制返回记录数
if ($limit <= 0 || $limit > 100) {
    $limit = 10;
}

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 获取游戏ID
    $stmt = $db->prepare("SELECT id FROM games WHERE slug = ?");
    $stmt->execute([$game_slug]);
    $game = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$game) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '游戏不存在']);
        exit();
    }

    $game_id = $game['id'];

    // 获取排行榜数据 - 每个用户只显示最高分，相同分数取最新一条
    $stmt = $db->prepare("
        SELECT 
            l.id, 
            l.score, 
            l.played_at,
            u.username
        FROM 
            leaderboards l
        JOIN 
            users u ON l.user_id = u.id
        INNER JOIN (
            SELECT 
                user_id, 
                MAX(score) as max_score
            FROM 
                leaderboards
            WHERE 
                game_id = ?
            GROUP BY 
                user_id
        ) as max_scores ON l.user_id = max_scores.user_id AND l.score = max_scores.max_score
        INNER JOIN (
            SELECT 
                user_id, 
                score, 
                MAX(played_at) as latest_time
            FROM 
                leaderboards
            WHERE 
                game_id = ?
            GROUP BY 
                user_id, score
        ) as latest_records ON l.user_id = latest_records.user_id 
            AND l.score = latest_records.score 
            AND l.played_at = latest_records.latest_time
        WHERE 
            l.game_id = ?
        ORDER BY 
            l.score DESC
        LIMIT ?
    ");
    $stmt->execute([$game_id, $game_id, $game_id, $limit]);
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 获取当前用户的最佳分数
    $user_best_score = null;
    
    // 从会话或请求参数中获取用户ID
    $user_id = null;
    session_start();
    
    if (isset($_SESSION['user_id'])) {
        $user_id = $_SESSION['user_id'];
    } else if (isset($_GET['user_id'])) {
        // 允许通过参数获取指定用户ID的最高分
        $user_id = $_GET['user_id'];
    }
    
    if ($user_id) {
        $stmt = $db->prepare("
            SELECT 
                MAX(score) as best_score,
                played_at
            FROM 
                leaderboards
            WHERE 
                user_id = ? AND game_id = ?
        ");
        $stmt->execute([$user_id, $game_id]);
        $user_best_score = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'leaderboard' => $leaderboard,
        'user_best_score' => $user_best_score
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Leaderboard error: ' . $e->getMessage());
} 