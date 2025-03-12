document.addEventListener('DOMContentLoaded', function() {
    // 底部导航切换
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // 如果当前URL与导航项的href匹配，则标记为激活状态
        const href = item.getAttribute('href');
        if (href) {
            const currentPage = window.location.pathname.split('/').pop(); // 获取当前页面文件名
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        }
        
        // 点击事件（只对没有href的项处理）
        item.addEventListener('click', function() {
            if (!this.getAttribute('href') || this.getAttribute('href') === '#') {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // APP项目悬停效果
    const appItems = document.querySelectorAll('.app-item');
    appItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // 下载按钮点击效果
    const downloadButtons = document.querySelectorAll('.app-download-btn');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 添加点击动画
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});
