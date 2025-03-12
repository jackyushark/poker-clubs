// 扑克雷达 - 前端主要脚本

document.addEventListener('DOMContentLoaded', function() {
    // 加载数据服务
    loadDataService().then(() => {
        // 此处放置需要在数据加载后执行的初始化逻辑
        // 例如：setupCategoryFilters(), loadAndDisplayClubs()等
    });
});

// 加载数据服务
async function loadDataService() {
    // 这里可能是异步加载数据逻辑
    return new Promise((resolve) => {
        // 模拟异步加载
        setTimeout(() => {
            // 数据加载完成
            resolve();
        }, 100);
    });
}

// 当前活跃的分类过滤器
let activeCategory = 'all';

// 设置分类筛选功能
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-button');
    if (!categoryButtons.length) return;
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            if (category === activeCategory) return;
            
            // 更新活跃分类
            activeCategory = category;
            
            // 更新UI
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选俱乐部
            filterClubsByCategory(window.clubsData, category);
        });
    });
}

// 加载并显示所有俱乐部
function loadAndDisplayClubs() {
    const clubsContainer = document.querySelector('.clubs-container');
    if (!clubsContainer) return;
    
    // 清空容器
    clubsContainer.innerHTML = '';
    
    // 从dataLoader获取俱乐部数据
    if (window.clubsData && window.clubsData.length) {
        // 按质押金额排序
        const sortedClubs = [...window.clubsData].sort((a, b) => b.pledgeAmount - a.pledgeAmount);
        
        // 应用当前的分类过滤器
        filterClubsByCategory(sortedClubs, activeCategory);
        
        // 更新质押金额排行榜
        updatePledgeRanking(sortedClubs);
    } else {
        clubsContainer.innerHTML = '<div class="error-message">暂无俱乐部数据</div>';
    }
}

// 根据分类筛选俱乐部
function filterClubsByCategory(clubs, category) {
    const clubsContainer = document.querySelector('.clubs-container');
    if (!clubsContainer || !clubs) return;
    
    // 清空容器
    clubsContainer.innerHTML = '';
    
    // 筛选符合当前分类的俱乐部
    let filteredClubs = clubs;
    
    if (category !== 'all') {
        filteredClubs = clubs.filter(club => {
            if (category === 'available') {
                return club.status === 'available';
            }
            if (category === 'recommended') {
                return club.isRecommended;
            }
            if (category === 'new') {
                // 定义"新"为加入时间在30天内
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const joinDate = new Date(club.joinDate);
                return joinDate >= thirtyDaysAgo;
            }
            if (category === 'platform') {
                return club.platform === category;
            }
            return true;
        });
    }
    
    // 显示筛选后的俱乐部
    if (filteredClubs.length) {
        filteredClubs.forEach(club => {
            const clubCard = createClubCard(club);
            clubsContainer.appendChild(clubCard);
        });
    } else {
        clubsContainer.innerHTML = '<div class="error-message">没有符合条件的俱乐部</div>';
    }
}

// 创建俱乐部卡片
function createClubCard(club) {
    const card = document.createElement('div');
    card.className = `club-card ${club.status}`;
    card.dataset.id = club.id;
    
    // 左侧信息
    const leftInfo = document.createElement('div');
    leftInfo.className = 'left-info';
    
    // 俱乐部Logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'club-logo-container';
    
    const logo = document.createElement('img');
    logo.className = 'club-logo';
    logo.src = club.logo || 'images/default-logo.png';
    logo.alt = `${club.name} Logo`;
    logo.loading = 'lazy';
    
    logoContainer.appendChild(logo);
    
    // 俱乐部名称和标语
    const nameContainer = document.createElement('div');
    nameContainer.className = 'club-name-container';
    
    const name = document.createElement('h3');
    name.className = 'club-name';
    name.textContent = club.name;
    
    const slogan = document.createElement('p');
    slogan.className = 'club-slogan';
    slogan.textContent = club.slogan || '无标语';
    
    nameContainer.appendChild(name);
    nameContainer.appendChild(slogan);
    
    leftInfo.appendChild(logoContainer);
    leftInfo.appendChild(nameContainer);
    
    // 中间信息
    const midInfo = document.createElement('div');
    midInfo.className = 'mid-info';
    
    // 平台信息
    const platform = document.createElement('div');
    platform.className = 'platform-info';
    platform.innerHTML = `<span class="info-label">平台:</span> <span class="info-value">${club.platform}</span>`;
    
    // 级别信息
    const levels = document.createElement('div');
    levels.className = 'levels-info';
    levels.innerHTML = `<span class="info-label">级别:</span> <span class="info-value">${club.levels.join('/')}</span>`;
    
    // 支付方式
    const payment = document.createElement('div');
    payment.className = 'payment-info';
    payment.innerHTML = `<span class="info-label">支付:</span> <span class="info-value">${club.paymentMethods.join(', ')}</span>`;
    
    // 在线玩家
    const players = document.createElement('div');
    players.className = 'players-info';
    players.innerHTML = `<span class="info-label">在线:</span> <span class="info-value players-count">${club.onlinePlayers || 0}</span>`;
    
    midInfo.appendChild(platform);
    midInfo.appendChild(levels);
    midInfo.appendChild(payment);
    midInfo.appendChild(players);
    
    // 右侧信息
    const rightInfo = document.createElement('div');
    rightInfo.className = 'right-info';
    
    // 质押状态
    const pledgeStatus = document.createElement('div');
    pledgeStatus.className = 'pledge-status';
    
    const pledgeLabel = document.createElement('span');
    pledgeLabel.className = 'info-label';
    pledgeLabel.textContent = '质押金额:';
    
    const pledgeValue = document.createElement('span');
    pledgeValue.className = 'info-value pledge-amount';
    pledgeValue.textContent = `¥${club.pledgeAmount.toLocaleString()}`;
    
    pledgeStatus.appendChild(pledgeLabel);
    pledgeStatus.appendChild(pledgeValue);
    
    // 状态指示
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'status-indicator';
    
    const statusDot = document.createElement('span');
    statusDot.className = 'status-dot';
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    statusText.textContent = club.status === 'available' ? '开局中' : '未开局';
    
    statusIndicator.appendChild(statusDot);
    statusIndicator.appendChild(statusText);
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'club-actions';
    
    const joinButton = document.createElement('button');
    joinButton.className = 'action-button join-club';
    joinButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> 加入俱乐部';
    joinButton.addEventListener('click', function(e) {
        e.stopPropagation();
        joinClub(club);
    });
    
    const reportButton = document.createElement('button');
    reportButton.className = 'action-button report-club';
    reportButton.innerHTML = '<i class="fas fa-flag"></i> 举报';
    reportButton.addEventListener('click', function(e) {
        e.stopPropagation();
        reportClub(club);
    });
    
    actions.appendChild(joinButton);
    actions.appendChild(reportButton);
    
    rightInfo.appendChild(pledgeStatus);
    rightInfo.appendChild(statusIndicator);
    rightInfo.appendChild(actions);
    
    // 组装卡片
    card.appendChild(leftInfo);
    card.appendChild(midInfo);
    card.appendChild(rightInfo);
    
    return card;
}

// 确保Logo元素持续可见
function ensureLogosVisible() {
    const logos = document.querySelectorAll('.club-logo');
    if (!logos.length) return;
    
    // 使用Intersection Observer监视logo元素的可见性
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                // 当logo不在视口内时，延迟加载
                const logo = entry.target;
                const src = logo.src;
                logo.src = '';
                
                setTimeout(() => {
                    logo.src = src;
                }, 10);
            }
        });
    }, {
        root: null,
        threshold: 0.1
    });
    
    // 监视所有logo
    logos.forEach(logo => {
        observer.observe(logo);
    });
}

// 更新页面顶部的统计数据
function updateStatistics() {
    const totalClubsElement = document.getElementById('total-clubs');
    const totalPlayersElement = document.getElementById('total-players');
    const totalPledgeElement = document.getElementById('total-pledge');
    
    if (!totalClubsElement || !totalPlayersElement || !totalPledgeElement) return;
    
    // 从clubsData中计算统计数据
    if (window.clubsData && window.clubsData.length) {
        // 俱乐部总数
        const totalClubs = window.clubsData.length;
        
        // 在线玩家总数
        const totalPlayers = window.clubsData.reduce((sum, club) => {
            return sum + (club.onlinePlayers || 0);
        }, 0);
        
        // 总质押金额
        const totalPledge = window.clubsData.reduce((sum, club) => {
            return sum + (club.pledgeAmount || 0);
        }, 0);
        
        // 更新DOM
        totalClubsElement.textContent = totalClubs;
        totalPlayersElement.textContent = totalPlayers;
        totalPledgeElement.textContent = `¥${totalPledge.toLocaleString()}`;
        
        // 使用计数器动画效果
        animateCounter(totalClubsElement, totalClubs);
        animateCounter(totalPlayersElement, totalPlayers);
        animateCounter(totalPledgeElement, `¥${totalPledge.toLocaleString()}`);
    }
}

// 更新质押信任榜
function updatePledgeRanking(clubs) {
    const rankingContainer = document.querySelector('.trust-ranking-list');
    if (!rankingContainer || !clubs || !clubs.length) return;
    
    // 清空容器
    rankingContainer.innerHTML = '';
    
    // 按质押金额排序并获取前5名
    const topClubs = [...clubs]
        .sort((a, b) => b.pledgeAmount - a.pledgeAmount)
        .slice(0, 5);
    
    // 创建排行榜项目
    topClubs.forEach((club, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        // 排名
        const rankNumber = document.createElement('div');
        rankNumber.className = 'rank-number';
        rankNumber.textContent = index + 1;
        
        // 俱乐部信息
        const rankInfo = document.createElement('div');
        rankInfo.className = 'rank-info';
        
        const clubLogo = document.createElement('img');
        clubLogo.className = 'rank-logo';
        clubLogo.src = club.logo || 'images/default-logo.png';
        clubLogo.alt = `${club.name} Logo`;
        clubLogo.loading = 'lazy';
        
        const clubName = document.createElement('div');
        clubName.className = 'rank-name';
        clubName.textContent = club.name;
        
        rankInfo.appendChild(clubLogo);
        rankInfo.appendChild(clubName);
        
        // 质押金额
        const pledgeAmount = document.createElement('div');
        pledgeAmount.className = 'rank-pledge';
        pledgeAmount.textContent = `¥${club.pledgeAmount.toLocaleString()}`;
        
        // 组装排行项
        rankItem.appendChild(rankNumber);
        rankItem.appendChild(rankInfo);
        rankItem.appendChild(pledgeAmount);
        
        rankingContainer.appendChild(rankItem);
    });
}

// 加入俱乐部逻辑
function joinClub(club) {
    // 实现加入俱乐部的功能
    console.log(`加入俱乐部: ${club.name}`);
    showErrorMessage('该功能即将上线，敬请期待!');
}

// 举报俱乐部逻辑
function reportClub(club) {
    // 实现举报俱乐部的功能
    console.log(`举报俱乐部: ${club.name}`);
    showErrorMessage('举报功能即将上线，敬请期待!');
}

// 显示错误消息
function showErrorMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'error-toast';
    messageBox.textContent = message;
    
    document.body.appendChild(messageBox);
    
    // 2秒后自动消失
    setTimeout(() => {
        messageBox.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(messageBox);
        }, 300);
    }, 2000);
}

// 设置登录按钮事件
function setupLoginButton() {
    const loginBtn = document.querySelector('.login-button');
    if (!loginBtn) return;
    
    loginBtn.addEventListener('click', function() {
        showErrorMessage('登录功能即将上线，敬请期待!');
    });
}

// 加载并显示公告
function loadAndDisplayAnnouncements() {
    const announcementContainer = document.querySelector('.announcement-items');
    if (!announcementContainer) return;
    
    // 模拟公告数据
    const announcements = [
        {
            id: 1,
            content: '欢迎来到扑克雷达 - 专业的德州扑克俱乐部聚合平台!',
            type: 'info',
            date: '2023-06-01'
        },
        {
            id: 2,
            content: '新功能上线: 质押信任机制，为玩家提供更多保障!',
            type: 'new',
            date: '2023-06-15'
        },
        {
            id: 3,
            content: '安全提醒: 请仔细核对俱乐部信息，确保资金安全',
            type: 'warning',
            date: '2023-06-20'
        },
        {
            id: 4,
            content: '新增5家优质俱乐部，更多选择等你来体验!',
            type: 'info',
            date: '2023-07-01'
        },
        {
            id: 5,
            content: '系统将于本周六凌晨2点-4点进行升级维护，请提前安排游戏时间',
            type: 'warning',
            date: '2023-07-10'
        }
    ];
    
    // 清空容器
    announcementContainer.innerHTML = '';
    
    // 添加公告项
    announcements.forEach(announcement => {
        const item = document.createElement('div');
        item.className = `announcement-item ${announcement.type}`;
        
        const icon = document.createElement('i');
        icon.className = announcement.type === 'warning' ? 
            'fas fa-exclamation-triangle' : 
            (announcement.type === 'new' ? 'fas fa-star' : 'fas fa-bullhorn');
        
        const content = document.createElement('span');
        content.className = 'announcement-content';
        content.textContent = announcement.content;
        
        item.appendChild(icon);
        item.appendChild(content);
        
        announcementContainer.appendChild(item);
    });
    
    // 初始化滚动效果
    initAnnouncementScroll();
}

// 初始化公告滚动效果
function initAnnouncementScroll() {
    const container = document.querySelector('.announcement-items');
    if (!container) return;
    
    const items = container.querySelectorAll('.announcement-item');
    if (items.length <= 1) return; // 只有一个或没有公告时不需要滚动
    
    // 复制公告以实现无缝滚动
    items.forEach(item => {
        const clone = item.cloneNode(true);
        container.appendChild(clone);
    });
    
    // 设置滚动动画
    container.style.animationDuration = `${items.length * 5}s`; // 每个公告5秒
    container.style.animationName = 'scrollAnnouncement';
    container.style.animationTimingFunction = 'linear';
    container.style.animationIterationCount = 'infinite';
}

// 设置视图切换功能
function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-button');
    const clubsContainer = document.querySelector('.clubs-container');
    
    if (!viewButtons.length || !clubsContainer) return;
    
    // 从localStorage获取上次的视图设置
    const savedView = localStorage.getItem('pokerRadarViewMode') || 'grid';
    
    // 应用保存的视图模式
    clubsContainer.className = `clubs-container ${savedView}-view`;
    
    // 更新按钮状态
    viewButtons.forEach(button => {
        if (button.dataset.view === savedView) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // 设置点击事件
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // 更新视图
            clubsContainer.className = `clubs-container ${view}-view`;
            
            // 更新按钮状态
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 保存设置
            localStorage.setItem('pokerRadarViewMode', view);
        });
    });
}
