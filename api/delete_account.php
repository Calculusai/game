<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 如果是OPTIONS请求，直接返回200状态码
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '仅支持POST请求']);
    exit;
}

// 获取POST数据
$postData = file_get_contents('php://input');
$data = json_decode($postData, true);

// 验证请求数据
if (empty($data['user_id']) || empty($data['username']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => '缺少必要的字段']);
    exit;
}

// 连接到用户数据库
try {
    $db = new PDO('sqlite:' . __DIR__ . '/subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 验证用户凭据
    $stmt = $db->prepare('SELECT id, password FROM users WHERE id = ? AND username = ?');
    $stmt->execute([$data['user_id'], $data['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => '用户不存在']);
        exit;
    }
    
    // 验证密码
    if (!password_verify($data['password'], $user['password'])) {
        echo json_encode(['success' => false, 'message' => '密码不正确']);
        exit;
    }
    
    // 开始事务，确保数据一致性
    $db->beginTransaction();
    
    try {
        // 从排行榜中删除用户数据
        $stmt = $db->prepare('DELETE FROM leaderboards WHERE user_id = ?');
        $stmt->execute([$data['user_id']]);
        
        // 删除用户数据
        $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$data['user_id']]);
        
        // 提交事务
        $db->commit();
        
        // 记录日志
        $logFile = __DIR__ . '/../logs/account_deletion.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] 用户 {$data['username']}(ID:{$data['user_id']}) 已注销账号\n";
        error_log($logMessage, 3, $logFile);
        
        echo json_encode(['success' => true, 'message' => '账号已成功注销']);
    } catch (Exception $e) {
        // 回滚事务
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    // 记录错误
    error_log('数据库错误: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
} catch (Exception $e) {
    // 记录其他错误
    error_log('系统错误: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => '操作失败，请稍后再试']);
}
?> 