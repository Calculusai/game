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

// 验证记录ID
if (!isset($data['record_id']) || !is_numeric($data['record_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少有效的记录ID']);
    exit();
}

$record_id = intval($data['record_id']);

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 删除指定记录
    $stmt = $db->prepare("DELETE FROM leaderboards WHERE id = ?");
    $stmt->execute([$record_id]);
    
    // 检查是否确实删除了记录
    $affected_rows = $stmt->rowCount();
    
    if ($affected_rows > 0) {
        // 返回成功消息
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => '游戏记录已成功删除']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => '未找到指定记录']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin delete record error: ' . $e->getMessage());
} 