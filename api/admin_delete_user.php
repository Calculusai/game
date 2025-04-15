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

// 验证用户ID
if (!isset($data['user_id']) || !is_numeric($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '缺少有效的用户ID']);
    exit();
}

$user_id = intval($data['user_id']);

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 开始事务
    $db->beginTransaction();
    
    try {
        // 先删除该用户的所有游戏记录
        $stmt = $db->prepare("DELETE FROM leaderboards WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        // 然后删除用户
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        
        // 检查是否确实删除了用户
        $affected_rows = $stmt->rowCount();
        
        if ($affected_rows > 0) {
            // 提交事务
            $db->commit();
            
            // 返回成功消息
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => '用户及其所有记录已成功删除']);
        } else {
            // 回滚事务
            $db->rollBack();
            
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => '未找到指定用户']);
        }
    } catch (Exception $e) {
        // 出现错误，回滚事务
        $db->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin delete user error: ' . $e->getMessage());
} 