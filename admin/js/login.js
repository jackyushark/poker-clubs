document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // 使用Firebase身份验证
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 清除之前的消息
        loginMessage.textContent = '正在登录...';
        loginMessage.className = 'login-message';
        
        // 使用Firebase进行身份验证
        firebase.auth().signInWithEmailAndPassword(username, password)
            .then((userCredential) => {
                // 登录成功
                const user = userCredential.user;
                loginMessage.textContent = '登录成功，正在跳转...';
                loginMessage.className = 'login-message success-message';
                
                // 记录用户信息到 sessionStorage (可选)
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('username', user.email || '管理员');
                
                // 设置登录重定向标记，防止循环重定向
                localStorage.setItem('loginRedirectPending', 'true');
                
                // 跳转到管理后台主页
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            })
            .catch((error) => {
                // 处理错误
                let errorMessage = '登录失败';
                
                // 提供更具体的错误消息
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = '邮箱或密码错误';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = '邮箱格式不正确';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = '登录尝试次数过多，请稍后再试';
                }
                
                loginMessage.textContent = errorMessage;
                loginMessage.className = 'login-message error-message';
                console.error('登录错误:', error);
            });
    });

    // 检查是否已经登录
    firebase.auth().onAuthStateChanged(function(user) {
        if (user && !window.location.href.includes('login.html')) {
            // 如果已登录且不在登录页，不做任何操作
            return;
        }
        
        if (user && window.location.href.includes('login.html')) {
            // 如果已登录且在登录页，重定向到首页
            window.location.href = 'index.html';
        }
    });
});
