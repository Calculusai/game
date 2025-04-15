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

// 分页参数
$page = isset($data['page']) ? intval($data['page']) : 1;
$per_page = 10; // 每页显示的记录数
$offset = ($page - 1) * $per_page;

// 搜索参数
$search = isset($data['search']) ? trim($data['search']) : '';

try {
    // 连接数据库
    $db = new PDO('sqlite:subscribers.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 准备查询条件
    $where_clause = '';
    $params = [];

    if (!empty($search)) {
        $where_clause = "WHERE username LIKE ? OR email LIKE ?";
        $search_term = "%{$search}%";
        $params = [$search_term, $search_term];
    }

    // 获取总记录数
    $count_sql = "SELECT COUNT(*) as count FROM users {$where_clause}";
    $stmt = $db->prepare($count_sql);
    if (!empty($params)) {
        $stmt->execute($params);
    } else {
        $stmt->execute();
    }
    $total_records = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $total_pages = ceil($total_records / $per_page);

    // 获取用户列表
    $sql = "SELECT id, username, email, created_at, last_login FROM users {$where_clause} ORDER BY id DESC LIMIT ? OFFSET ?";
    $stmt = $db->prepare($sql);

    // 绑定参数
    $index = 1;
    foreach ($params as $param) {
        $stmt->bindValue($index++, $param);
    }
    $stmt->bindValue($index++, $per_page, PDO::PARAM_INT);
    $stmt->bindValue($index++, $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 返回用户列表和分页信息
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'users' => $users,
        'pagination' => [
            'total_records' => $total_records,
            'total_pages' => $total_pages,
            'current_page' => $page,
            'per_page' => $per_page
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误，请稍后再试']);
    // 记录错误日志
    error_log('Admin get users error: ' . $e->getMessage());
} 