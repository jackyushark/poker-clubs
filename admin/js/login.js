document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // 简单的登录验证逻辑
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 在实际应用中，这里应该使用安全的后端验证
        // 这里仅做演示，使用一个固定的管理员账号
        if (username === 'admin' && password === 'admin123') {
            loginMessage.textContent = '登录成功，正在跳转...';
            loginMessage.className = 'login-message success-message';
            
            // 登录成功后，将登录状态存储到sessionStorage
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('username', username);
            
            // 跳转到管理后台主页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            loginMessage.textContent = '用户名或密码错误';
            loginMessage.className = 'login-message error-message';
        }
    });

    // 检查是否已经登录
    if (sessionStorage.getItem('loggedIn') === 'true') {
        window.location.href = 'index.html';
    }
});
