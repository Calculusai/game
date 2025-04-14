/**
 * 管理员通知功能测试函数
 */

// 测试管理员token验证
async function testAdminAuth() {
    try {
        const response = await fetch('/api/send_notification.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'test',
                title: 'Token测试',
                content: '这是一个测试通知，用于验证Token是否正确。',
                admin_token: 'd402cd31e689ebe4b1e6bafed829b44f' // md5('hoshinoai2024')
            })
        });

        const result = await response.json();
        console.log('测试结果:', result);
        return result;
    } catch (error) {
        console.error('测试出错:', error);
        return { success: false, message: error.message };
    }
}

// 记录表单提交内容
function logFormSubmit(formData) {
    console.log('提交表单数据:', {
        type: formData.type,
        title: formData.title,
        content: formData.content,
        from: formData.from || 'default@example.com'
    });
}

// 测试函数
async function runTests() {
    console.log('开始测试管理员通知功能...');
    console.log('1. 测试Token验证...');
    const authResult = await testAdminAuth();

    if (authResult.success) {
        console.log('✅ Token验证成功!');
    } else {
        console.log('❌ Token验证失败:', authResult.message);
    }

    console.log('测试完成!');
}

// 暴露测试函数到全局，以便在控制台调用
window.adminTests = {
    testAuth: testAdminAuth,
    runTests: runTests,
    logForm: logFormSubmit
};
