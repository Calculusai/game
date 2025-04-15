<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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

// 确保所有必要的参数都存在
if (!isset($data['game_slug']) || !isset($data['score'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少必要参数']);
    exit();
}

// 启动会话
session_start();

// 检查用户是否已登录
if (!isset($_SESSION['user_id']) && !isset($data['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit();
}

// 优先使用会话中的用户ID，如果没有则使用请求参数中的用户ID
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : $data['user_id'];
$game_slug = trim($data['game_slug']);
$score = intval($data['score']);

// 验证分数是否有效
if ($score < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '分数无效']);
    exit();
}

// 检查是否是重复提交
if (isset($_SESSION['last_score_submission'])) {
    $lastSubmission = $_SESSION['last_score_submission'];
    // 如果5秒内提交相同游戏和分数，视为重复提交
    if (time() - $lastSubmission['time'] < 5 && 
        $lastSubmission['game_slug'] === $game_slug && 
        $lastSubmission['score'] === $score) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => '请勿频繁提交相同分数']);
        exit();
    }
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

    // 检查当天是否已经提交过相同分数
    $today = date('Y-m-d');
    $stmt = $db->prepare("
        SELECT id FROM leaderboards 
        WHERE user_id = ? AND game_id = ? AND score = ? 
        AND date(played_at) = date(?)
    ");
    $stmt->execute([$user_id, $game_id, $score, $today]);
    
    if ($stmt->fetch()) {
        // 当天已提交过相同分数，返回成功但不创建新记录
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => '今日已记录该分数']);
        
        // 更新最后提交记录
        $_SESSION['last_score_submission'] = [
            'time' => time(),
            'game_slug' => $game_slug,
            'score' => $score
        ];
        
        exit();
    }

    // 获取用户当前最高分
    $stmt = $db->prepare("
        SELECT MAX(score) as best_score 
        FROM leaderboards 
        WHERE user_id = ? AND game_id = ?
    ");
    $stmt->execute([$user_id, $game_id]);
    $best = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 只有比当前最高分高，或者没有记录时才插入
    if (!$best || !$best['best_score'] || $score > $best['best_score']) {
        // 插入新的分数记录
        $stmt = $db->prepare("INSERT INTO leaderboards (user_id, game_id, score, played_at) VALUES (?, ?, ?, datetime('now'))");
        $stmt->execute([$user_id, $game_id, $score]);
        
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => '新纪录已保存']);
    } else {
        // 分数不高于最高分时，只在当天没有记录的情况下插入
        $stmt = $db->prepare("
            SELECT id FROM leaderboards 
            WHERE user_id = ? AND game_id = ? AND date(played_at) = date('now')
        ");
        $stmt->execute([$user_id, $game_id]);
        
        if (!$stmt->fetch()) {
            // 当天没有记录，插入这次的分数
            $stmt = $db->prepare("INSERT INTO leaderboards (user_id, game_id, score, played_at) VALUES (?, ?, ?, datetime('now'))");
            $stmt->execute([$user_id, $game_id, $score]);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => '今日分数已保存']);
        } else {
            // 当天已有记录，且分数不高于最高分，不插入新记录
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => '分数已记录，未超过最高分']);
        }
    }
    
    // 更新最后提交记录
    $_SESSION['last_score_submission'] = [
        'time' => time(),
        'game_slug' => $game_slug,
        'score' => $score
    ];

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Score submission error: ' . $e->getMessage());
} 