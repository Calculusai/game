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

// 验证管理员令牌
$correct_token = 'd402cd31e689ebe4b1e6bafed829b44f'; // md5('hoshinoai2024')

if (!isset($data['admin_token']) || $data['admin_token'] !== $correct_token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '未授权，管理员令牌无效']);
    exit();
}

// 验证游戏ID
if (!isset($data['game_id']) || !is_numeric($data['game_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少有效的游戏ID']);
    exit();
}

$game_id = intval($data['game_id']);

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 开始事务
    $db->beginTransaction();
    
    try {
        // 检查游戏是否存在
        $stmt = $db->prepare("SELECT name FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$game) {
            // 游戏不存在
            $db->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => '未找到指定游戏']);
            exit();
        }
        
        // 先删除该游戏的排行榜数据
        $stmt = $db->prepare("DELETE FROM leaderboards WHERE game_id = ?");
        $stmt->execute([$game_id]);
        $leaderboard_count = $stmt->rowCount();
        
        // 然后删除游戏
        $stmt = $db->prepare("DELETE FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        
        // 提交事务
        $db->commit();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "游戏 '{$game['name']}' 已成功删除，同时删除了 {$leaderboard_count} 条排行榜记录"
        ]);
    } catch (Exception $e) {
        // 出现错误，回滚事务
        $db->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin delete game error: ' . $e->getMessage());
} 