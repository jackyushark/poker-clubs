document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    
    // 如果未登录且不在登录页面，则重定向到登录页
    if (!isLoggedIn && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    // 显示当前用户名
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = sessionStorage.getItem('username') || 'admin';
    }
    
    // 退出登录功能
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.removeItem('loggedIn');
            sessionStorage.removeItem('username');
            window.location.href = 'login.html';
        });
    }
});
