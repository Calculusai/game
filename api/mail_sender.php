<?php
/**
 * 邮件发送功能
 * 使用PHPMailer库发送HTML邮件
 */

// 引入PHPMailer库（请确保已安装）
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// 如果使用Composer管理依赖
// require 'vendor/autoload.php';

// 手动引入PHPMailer类（如果没有使用Composer）
require_once __DIR__ . '/phpmailer/src/Exception.php';
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';

/**
 * 日志记录函数
 */
function mail_log($message) {
    $log_file = __DIR__ . '/../logs/mail_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[{$timestamp}] {$message}\n";
    error_log($log_message, 3, $log_file);
}

// 清空日志文件，方便测试
file_put_contents(__DIR__ . '/../logs/mail_debug.log', '');

/**
 * 发送HTML邮件
 * 
 * @param string $to 收件人邮箱
 * @param string $subject 邮件主题
 * @param string $body HTML邮件内容
 * @param array $attachments 附件列表 [可选]
 * @return bool 发送成功返回true，失败返回false
 */
function sendEmail($to, $subject, $body, $attachments = []) {
    mail_log("开始发送邮件给: " . $to . ", 主题: " . $subject);
    
    // 邮件发送配置
    $config = [
        'smtp_host' => 'smtp.qq.com',           // SMTP服务器
        'smtp_port' => 465,                     // SMTP端口
        'smtp_secure' => 'ssl',                 // 加密方式：ssl或tls
        'smtp_username' => '1697391069@qq.com', // 发件人邮箱
        'smtp_password' => 'iowhiddbzophbccg', // QQ邮箱授权码（请替换为您的授权码）
        'from_name' => 'HoshinoAI游戏平台',     // 发件人名称
    ];
    
    // 创建PHPMailer实例
    $mail = new PHPMailer(true);
    
    try {
        // 服务器配置
        $mail->SMTPDebug = 0;                      // 调试模式：0=关闭，1=客户端，2=客户端和服务器
        $mail->isSMTP();                           // 使用SMTP协议
        $mail->Host       = $config['smtp_host'];  // SMTP服务器
        $mail->SMTPAuth   = true;                  // 启用SMTP认证
        $mail->Username   = $config['smtp_username']; // 发件人邮箱
        $mail->Password   = $config['smtp_password']; // SMTP密码/授权码
        $mail->SMTPSecure = $config['smtp_secure'];// 启用TLS/SSL加密
        $mail->Port       = $config['smtp_port'];  // SMTP端口
        $mail->CharSet    = 'UTF-8';               // 设置字符集

        mail_log("SMTP配置完成");
        
        // 发件人和收件人
        $mail->setFrom($config['smtp_username'], $config['from_name']);
        $mail->addAddress($to);                    // 收件人

        // 邮件内容
        $mail->isHTML(true);                       // 设置邮件格式为HTML
        $mail->Subject = $subject;                 // 邮件主题
        $mail->Body    = $body;                    // HTML内容
        $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $body)); // 纯文本内容

        // 添加附件
        if (!empty($attachments)) {
            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $mail->addAttachment($attachment);
                    mail_log("添加附件: " . $attachment);
                } else {
                    mail_log("附件不存在: " . $attachment);
                }
            }
        }

        // 发送邮件
        $mail->send();
        mail_log("邮件发送成功");
        return true;
    } catch (Exception $e) {
        // 记录错误日志
        mail_log("邮件发送失败: " . $mail->ErrorInfo);
        return false;
    }
}
?> 