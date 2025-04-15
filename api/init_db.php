<?php
/**
 * 初始化用户和订阅系统数据库脚本
 * 仅创建用户和订阅相关的表结构，不影响游戏相关数据
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
    echo "subscribers表检查完成\n";
    
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
    echo "notifications表检查完成\n";
    
    // 创建用户表
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )");
    echo "users表检查完成\n";
    
    // 创建测试数据（仅在指定参数时）
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
    
    echo "用户和订阅系统数据库初始化完成！\n";
    
} catch (PDOException $e) {
    die("数据库错误: " . $e->getMessage());
}
?> 