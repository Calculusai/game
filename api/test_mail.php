<?php
// 引入邮件发送功能
require_once __DIR__ . '/mail_sender.php';

// 测试收件人邮箱（请修改为您的测试邮箱）
$to = '2380037681@qq.com';

// 邮件主题
$subject = 'PHPMailer测试邮件';

// 邮件内容
$body = '
<html>
<head>
    <title>PHPMailer测试邮件</title>
</head>
<body>
    <h1>PHPMailer测试成功</h1>
    <p>这是一封测试邮件，用于验证PHPMailer安装是否正确。</p>
    <p>如果您收到这封邮件，说明PHPMailer配置正确！</p>
    <p>发送时间: ' . date('Y-m-d H:i:s') . '</p>
</body>
</html>
';

// 发送邮件
$result = sendEmail($to, $subject, $body);

// 输出结果
if ($result) {
    echo "测试邮件发送成功！";
} else {
    echo "测试邮件发送失败！";
}
?> 