<?php
/**
 * 列出所有游戏
 */

// 数据库文件路径
$dbFile = __DIR__ . '/subscribers.db';

// 判断是否通过命令行调用
$isCommandLine = (php_sapi_name() === 'cli');

// 处理删除游戏请求
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    try {
        $db = new PDO('sqlite:' . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 获取要删除的游戏信息（用于显示确认消息）
        $stmt = $db->prepare("SELECT name FROM games WHERE id = ?");
        $stmt->execute([$_GET['delete']]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 如果确认删除
        if (isset($_GET['confirm']) && $_GET['confirm'] === 'yes') {
            // 先删除该游戏的排行榜数据
            $stmt = $db->prepare("DELETE FROM leaderboards WHERE game_id = ?");
            $stmt->execute([$_GET['delete']]);
            
            // 然后删除游戏
            $stmt = $db->prepare("DELETE FROM games WHERE id = ?");
            $stmt->execute([$_GET['delete']]);
            
            // 重定向回列表页
            header('Location: list_games.php?msg=删除成功');
            exit;
        }
    } catch (PDOException $e) {
        $error = "删除游戏时出错: " . $e->getMessage();
    }
}

// 处理添加游戏请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_game'])) {
    try {
        $db = new PDO('sqlite:' . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 验证输入
        $name = trim($_POST['name']);
        $slug = trim($_POST['slug']);
        $description = trim($_POST['description']);
        
        if (empty($name) || empty($slug)) {
            throw new Exception("游戏名称和标识符不能为空");
        }
        
        // 检查标识符是否已存在
        $stmt = $db->prepare("SELECT id FROM games WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            throw new Exception("标识符'{$slug}'已存在，请使用其他标识符");
        }
        
        // 插入新游戏
        $stmt = $db->prepare("INSERT INTO games (name, slug, description) VALUES (?, ?, ?)");
        $stmt->execute([$name, $slug, $description]);
        
        // 重定向回列表页
        header('Location: list_games.php?msg=添加成功');
        exit;
    } catch (Exception $e) {
        $error = "添加游戏时出错: " . $e->getMessage();
    }
}

try {
    // 连接到SQLite数据库
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 检查游戏表是否存在
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'")->fetchAll();
    if (empty($tables)) {
        $message = "游戏表不存在，请先创建游戏！";
        if ($isCommandLine) {
            die($message . "\n");
        } else {
            die($message);
        }
    }
    
    // 获取所有游戏
    $stmt = $db->query("SELECT id, name, slug, description FROM games ORDER BY id");
    $games = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 输出结果
    if ($isCommandLine) {
        // 命令行输出
        if (empty($games)) {
            echo "没有找到游戏记录\n";
        } else {
            echo "ID\t游戏名称\t标识符\t描述\n";
            echo "--------------------------------------\n";
            foreach ($games as $game) {
                echo "{$game['id']}\t{$game['name']}\t{$game['slug']}\t{$game['description']}\n";
            }
            echo "共 " . count($games) . " 款游戏\n";
        }
    } else {
        // Web页面输出
        echo '<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>游戏管理 - H.AiGame</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .actions {
            margin-top: 20px;
        }
        .btn {
            display: inline-block;
            margin-right: 10px;
            padding: 8px 16px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .btn-danger {
            background-color: #dc3545;
        }
        .btn-danger:hover {
            background-color: #c82333;
        }
        .btn-success {
            background-color: #28a745;
        }
        .btn-success:hover {
            background-color: #218838;
        }
        .empty-message {
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 4px;
            text-align: center;
            margin: 20px 0;
        }
        .form-container {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-control {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .alert {
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .alert-success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .alert-danger {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .confirmation-box {
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: center;
        }
        .confirmation-box p {
            margin-bottom: 10px;
        }
        .confirmation-actions {
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>游戏管理系统</h1>';

        // 显示消息
        if (isset($_GET['msg'])) {
            echo '<div class="alert alert-success">' . htmlspecialchars($_GET['msg']) . '</div>';
        }
        
        // 显示错误
        if (isset($error)) {
            echo '<div class="alert alert-danger">' . htmlspecialchars($error) . '</div>';
        }
        
        // 显示删除确认
        if (isset($_GET['delete']) && !isset($_GET['confirm']) && isset($game['name'])) {
            echo '<div class="confirmation-box">
                <p>您确定要删除游戏 <strong>' . htmlspecialchars($game['name']) . '</strong> 吗？此操作将同时删除该游戏的所有排行榜数据，且无法恢复！</p>
                <div class="confirmation-actions">
                    <a href="list_games.php?delete=' . htmlspecialchars($_GET['delete']) . '&confirm=yes" class="btn btn-danger">确认删除</a>
                    <a href="list_games.php" class="btn">取消</a>
                </div>
            </div>';
        }
        
        // 添加游戏表单
        echo '<div class="form-container">
            <h2>添加新游戏</h2>
            <form method="post" action="list_games.php">
                <div class="form-group">
                    <label for="name">游戏名称:</label>
                    <input type="text" id="name" name="name" class="form-control" required placeholder="例如：2048">
                </div>
                <div class="form-group">
                    <label for="slug">游戏标识符:</label>
                    <input type="text" id="slug" name="slug" class="form-control" required placeholder="例如：2048（只能包含字母、数字和连字符）">
                    <small style="color: #6c757d;">标识符用于URL和API请求，建议使用小写字母、数字和连字符</small>
                </div>
                <div class="form-group">
                    <label for="description">游戏描述:</label>
                    <textarea id="description" name="description" class="form-control" rows="3" placeholder="游戏的简短描述"></textarea>
                </div>
                <button type="submit" name="add_game" class="btn btn-success">添加游戏</button>
            </form>
        </div>';

        // 游戏列表
        if (empty($games)) {
            echo '<div class="empty-message">没有找到游戏记录</div>';
        } else {
            echo '<h2>游戏列表</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>游戏名称</th>
                        <th>标识符</th>
                        <th>描述</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>';

            foreach ($games as $game) {
                echo '<tr>
                    <td>' . htmlspecialchars($game['id']) . '</td>
                    <td>' . htmlspecialchars($game['name']) . '</td>
                    <td>' . htmlspecialchars($game['slug']) . '</td>
                    <td>' . htmlspecialchars($game['description']) . '</td>
                    <td>
                        <a href="list_games.php?delete=' . htmlspecialchars($game['id']) . '" class="btn btn-danger btn-sm">删除</a>
                    </td>
                </tr>';
            }

            echo '</tbody>
            </table>
            <p>共 ' . count($games) . ' 款游戏</p>';
        }

        echo '<div class="actions">
            <a href="init_game_db.php" class="btn">初始化游戏数据库</a>
            <a href="../user/leaderboard.html" class="btn">查看排行榜</a>
            <a href="/" class="btn">返回首页</a>
        </div>
    </body>
</html>';
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