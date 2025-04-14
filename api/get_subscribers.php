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
    
    // 获取所有订阅者
    $stmt = $db->query('SELECT * FROM subscribers ORDER BY id DESC');
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 返回结果
    echo json_encode([
        'success' => true,
        'subscribers' => $subscribers
    ]);
    
} catch (PDOException $e) {
    // 记录错误
    error_log('数据库错误: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => '获取订阅者数据失败: ' . $e->getMessage()
    ]);
}
?> 