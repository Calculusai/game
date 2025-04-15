<?php
/**
 * 获取所有游戏列表
 * 返回JSON格式的游戏数据，用于前端动态加载游戏选项
 */

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

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 检查游戏表是否存在
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'")->fetchAll();
    if (empty($tables)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '游戏表不存在']);
        exit();
    }
    
    // 获取所有游戏
    $stmt = $db->query("SELECT id, name, slug, description FROM games ORDER BY name");
    $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 返回游戏列表
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'games' => $games
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Get games error: ' . $e->getMessage());
}
?> 