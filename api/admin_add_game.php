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

// 验证游戏数据
if (!isset($data['name']) || !isset($data['slug'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '游戏名称和标识符不能为空']);
    exit();
}

$name = trim($data['name']);
$slug = trim($data['slug']);
$description = isset($data['description']) ? trim($data['description']) : '';

// 检查名称和标识符是否为空
if (empty($name) || empty($slug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '游戏名称和标识符不能为空']);
    exit();
}

// 验证标识符格式（只允许字母、数字和连字符）
if (!preg_match('/^[a-zA-Z0-9\-]+$/', $slug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '标识符格式不正确，只能包含字母、数字和连字符']);
    exit();
}

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 检查是否已存在相同的标识符
    $stmt = $db->prepare("SELECT id FROM games WHERE slug = ?");
    $stmt->execute([$slug]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "标识符 '{$slug}' 已存在，请使用其他标识符"]);
        exit();
    }
    
    // 检查游戏表是否存在，如果不存在则创建
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'")->fetchAll();
    if (empty($tables)) {
        $db->exec("CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            slug VARCHAR(50) NOT NULL UNIQUE
        )");
    }
    
    // 检查排行榜表是否存在，如果不存在则创建
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='leaderboards'")->fetchAll();
    if (empty($tables)) {
        $db->exec("CREATE TABLE IF NOT EXISTS leaderboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (game_id) REFERENCES games (id)
        )");
    }
    
    // 添加游戏
    $stmt = $db->prepare("INSERT INTO games (name, slug, description) VALUES (?, ?, ?)");
    $stmt->execute([$name, $slug, $description]);
    
    // 获取新添加的游戏ID
    $gameId = $db->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => '游戏添加成功',
        'game' => [
            'id' => $gameId,
            'name' => $name,
            'slug' => $slug,
            'description' => $description
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin add game error: ' . $e->getMessage());
} 