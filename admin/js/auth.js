document.addEventListener('DOMContentLoaded', function() {
    // 检查Firebase身份验证状态
    firebase.auth().onAuthStateChanged(function(user) {
        // 如果未登录且不在登录页面，则重定向到登录页
        if (!user && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
            return;
        }
        
        // 显示当前用户名
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement && user) {
            currentUserElement.textContent = user.email || 'admin';
        }
    });
    
    // 退出登录功能
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 使用Firebase登出
            firebase.auth().signOut().then(() => {
                console.log('登出成功');
                // 清除可能存在的会话存储
                sessionStorage.removeItem('loggedIn');
                sessionStorage.removeItem('username');
                // 重定向到登录页
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('登出失败', error);
            });
        });
    }
});
