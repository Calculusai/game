<?php
/**
 * 添加新游戏到数据库
 * 可以通过Web或命令行方式调用
 * 
 * Web方式: add_game.php?name=游戏名&slug=游戏标识符&desc=游戏描述
 * 命令行: php add_game.php 游戏名 游戏标识符 游戏描述
 */

// 数据库文件路径
$dbFile = __DIR__ . '/subscribers.db';

// 判断是否通过命令行调用
$isCommandLine = (php_sapi_name() === 'cli');

// 获取游戏信息
if ($isCommandLine) {
    // 命令行模式
    if ($argc < 3) {
        die("用法: php add_game.php <游戏名称> <游戏标识符> [游戏描述]\n");
    }
    
    $gameName = $argv[1];
    $gameSlug = $argv[2];
    $gameDesc = isset($argv[3]) ? $argv[3] : '';
} else {
    // Web模式
    $gameName = isset($_GET['name']) ? trim($_GET['name']) : null;
    $gameSlug = isset($_GET['slug']) ? trim($_GET['slug']) : null;
    $gameDesc = isset($_GET['desc']) ? trim($_GET['desc']) : '';
    
    if (!$gameName || !$gameSlug) {
        die('请提供游戏名称和标识符 (使用 ?name=游戏名&slug=游戏标识符&desc=游戏描述)');
    }
}

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 检查游戏表是否存在
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'")->fetchAll();
    if (empty($tables)) {
        // 游戏表不存在，先创建
        $db->exec("CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            slug VARCHAR(50) NOT NULL UNIQUE
        )");
        
        echo $isCommandLine ? "游戏表已创建\n" : "游戏表已创建<br>";
    }
    
    // 检查排行榜表是否存在
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='leaderboards'")->fetchAll();
    if (empty($tables)) {
        // 排行榜表不存在，先创建
        $db->exec("CREATE TABLE IF NOT EXISTS leaderboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (game_id) REFERENCES games (id)
        )");
        
        echo $isCommandLine ? "排行榜表已创建\n" : "排行榜表已创建<br>";
    }
    
    // 检查游戏是否已存在
    $stmt = $db->prepare("SELECT id FROM games WHERE slug = ?");
    $stmt->execute([$gameSlug]);
    $existingGame = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingGame) {
        // 游戏已存在，更新信息
        $stmt = $db->prepare("UPDATE games SET name = ?, description = ? WHERE slug = ?");
        $stmt->execute([$gameName, $gameDesc, $gameSlug]);
        
        $message = "游戏 '{$gameName}' 已更新！";
    } else {
        // 添加新游戏
        $stmt = $db->prepare("INSERT INTO games (name, description, slug) VALUES (?, ?, ?)");
        $stmt->execute([$gameName, $gameDesc, $gameSlug]);
        
        $message = "游戏 '{$gameName}' 添加成功！";
    }
    
    // 输出结果
    if ($isCommandLine) {
        echo $message . "\n";
    } else {
        echo '<html><head><title>添加游戏</title><style>body { font-family: Arial, sans-serif; margin: 20px; }</style></head>';
        echo '<body><h1>添加游戏</h1>';
        echo '<p>' . $message . '</p>';
        echo '<p><a href="list_games.php">查看所有游戏</a></p>';
        echo '</body></html>';
    }
    
} catch (PDOException $e) {
    $errorMsg = "数据库错误: " . $e->getMessage();
    if ($isCommandLine) {
        die($errorMsg . "\n");
    } else {
        die($errorMsg);
    }
}
?> 