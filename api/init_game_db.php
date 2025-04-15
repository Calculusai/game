<?php
/**
 * 初始化游戏和排行榜系统数据库脚本
 * 仅创建游戏和排行榜相关的表结构，不影响用户和订阅数据
 */

// 数据库文件路径
$dbFile = __DIR__ . '/subscribers.db';

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 检查用户表是否存在，如果不存在则创建一个基本的用户表
    // 这是为了保证外键约束能够正常工作
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )");
    
    // 创建游戏表
    $db->exec("CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        slug VARCHAR(50) NOT NULL UNIQUE
    )");
    echo "games表检查完成\n";
    
    // 创建游戏排行榜表
    $db->exec("CREATE TABLE IF NOT EXISTS leaderboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (game_id) REFERENCES games (id)
    )");
    echo "leaderboards表检查完成\n";
    
    // 添加预设游戏：2048
    $stmt = $db->prepare("SELECT id FROM games WHERE slug = '2048'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $stmt = $db->prepare("INSERT INTO games (name, description, slug) VALUES (?, ?, ?)");
        $stmt->execute(['2048', '经典的数字合并游戏，通过滑动将相同的数字合并，努力达到2048！', '2048']);
        echo "2048游戏已添加到数据库\n";
    } else {
        echo "2048游戏已存在于数据库中\n";
    }
    
    echo "游戏和排行榜系统数据库初始化完成！\n";
    
    // 如果是通过Web访问，提供友好的界面
    if (php_sapi_name() !== 'cli') {
        echo '<html><head><title>游戏数据库初始化</title>';
        echo '<style>body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }</style></head>';
        echo '<body><h1>游戏数据库初始化</h1>';
        echo '<p>游戏和排行榜系统数据库初始化已完成！</p>';
        echo '<p><a href="list_games.php">查看所有游戏</a></p>';
        echo '</body></html>';
    }
    
} catch (PDOException $e) {
    die("数据库错误: " . $e->getMessage());
}
?> 