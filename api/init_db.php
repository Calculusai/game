<?php
/**
 * 初始化数据库脚本
 * 创建必要的表结构
 */

// 数据库文件路径
$dbFile = __DIR__ . '/subscribers.db';

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 创建订阅者表
    $db->exec('CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )');
    echo "subscribers表创建成功\n";
    
    // 创建通知历史表
    $db->exec('CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        sent_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )');
    echo "notifications表创建成功\n";
    
    // 创建一些测试数据
    if (isset($_GET['with_test_data'])) {
        // 添加测试订阅者
        $stmt = $db->prepare('INSERT OR IGNORE INTO subscribers (email, name) VALUES (:email, :name)');
        
        $testUsers = [
            ['email' => 'test1@example.com', 'name' => '测试用户1'],
            ['email' => 'test2@example.com', 'name' => '测试用户2'],
            ['email' => '1697391069@qq.com', 'name' => '管理员']
        ];
        
        foreach ($testUsers as $user) {
            $stmt->bindParam(':email', $user['email']);
            $stmt->bindParam(':name', $user['name']);
            $stmt->execute();
        }
        
        echo "测试数据创建成功\n";
    }
    
    echo "数据库初始化完成！";
    
} catch (PDOException $e) {
    die("数据库错误: " . $e->getMessage());
}
?> 