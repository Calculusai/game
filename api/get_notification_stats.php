<?php
// 设置响应头
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// 数据库连接信息
$dbFile = __DIR__ . '/subscribers.db';

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 获取通知总数
    $totalStmt = $db->query('SELECT COUNT(*) as count FROM notifications');
    $totalCount = $totalStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // 获取成功发送的邮件总数
    $sentStmt = $db->query('SELECT SUM(sent_count) as sent_count FROM notifications');
    $sentCount = $sentStmt->fetch(PDO::FETCH_ASSOC)['sent_count'];
    
    // 获取最近的5条通知
    $recentStmt = $db->query('SELECT * FROM notifications ORDER BY id DESC LIMIT 5');
    $recentNotifications = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 返回结果
    echo json_encode([
        'success' => true,
        'total_count' => (int)$totalCount,
        'sent_count' => (int)$sentCount,
        'recent_notifications' => $recentNotifications
    ]);
    
} catch (PDOException $e) {
    // 记录错误
    error_log('数据库错误: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => '获取通知统计数据失败: ' . $e->getMessage()
    ]);
}
?> 