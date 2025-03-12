// 扑克雷达 - 前端主要脚本

document.addEventListener('DOMContentLoaded', function() {
    // 加载数据服务
    loadDataService().then(() => {
        // 加载俱乐部数据并显示
        loadAndDisplayClubs();
        // 更新统计数据
        updateStatistics();
        // 加载并显示公告
        loadAndDisplayAnnouncements();
    }).catch(error => {
        console.error('无法加载数据服务:', error);
        // 如果数据加载失败，显示错误信息
        showErrorMessage('系统正在维护，请稍后再试');
    });

    // 设置登录按钮事件
    setupLoginButton();
    
    // 设置视图切换功能
    setupViewToggle();
    
    // 设置分类筛选功能
    setupCategoryFilters();
    
    // 初始加载后，设置一个定时器定期检查Logo元素
    setInterval(ensureLogosVisible, 500);
});

// 加载数据服务
function loadDataService() {
    return new Promise((resolve, reject) => {
        if (window.PokerRadarDataService) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'admin/js/data-service.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 当前活跃的分类过滤器
let activeCategory = 'all';

// 设置分类筛选功能
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-button');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 设置当前活跃的分类
            activeCategory = this.getAttribute('data-category');
            
            // 重新加载并显示过滤后的俱乐部
            loadAndDisplayClubs();
        });
    });
}

// 加载并显示所有俱乐部
function loadAndDisplayClubs() {
    if (!window.PokerRadarDataService) {
        console.error('数据服务不可用');
        return;
    }
    
    const clubs = window.PokerRadarDataService.getAllClubs();
    const filteredClubs = filterClubsByCategory(clubs, activeCategory);
    const clubsContainer = document.querySelector('.clubs-container');
    
    // 清空现有内容
    clubsContainer.innerHTML = '';
    
    // 没有俱乐部时显示提示
    if (filteredClubs.length === 0) {
        clubsContainer.innerHTML = '<div class="no-clubs-message">没有符合条件的俱乐部，请尝试其他分类！</div>';
        return;
    }
    
    // 为每个俱乐部创建卡片
    filteredClubs.forEach(club => {
        const clubCard = createClubCard(club);
        clubsContainer.appendChild(clubCard);
    });
}

// 根据分类筛选俱乐部
function filterClubsByCategory(clubs, category) {
    if (category === 'all') {
        return clubs;
    }
    
    return clubs.filter(club => {
        // 根据是否质押过滤
        if (category === 'pledged') {
            return club.isPledged === true;
        }
        
        // 根据级别大小过滤
        if (category === 'small' || category === 'medium' || category === 'large') {
            // 提取级别中的数字，如 "2/5" 提取出 2 和 5
            const levelMatch = (club.level || '').match(/(\d+)\/(\d+)/);
            if (!levelMatch) return false;
            
            const smallBlind = parseInt(levelMatch[1], 10);
            const bigBlind = parseInt(levelMatch[2], 10);
            
            // 根据大盲注的大小来确定级别
            if (category === 'small') {
                return bigBlind <= 5; // 小级别：大盲注 <= 5
            } else if (category === 'medium') {
                return bigBlind > 5 && bigBlind <= 15; // 中级别：5 < 大盲注 <= 15
            } else if (category === 'large') {
                return bigBlind > 15; // 大级别：大盲注 > 15
            }
        }
        
        return false;
    });
}

// 创建俱乐部卡片
function createClubCard(club) {
    const card = document.createElement('div');
    card.className = 'club-card';
    card.id = `club-${club.id}`;
    
    // 可用状态类名
    const availabilityClass = club.status === 'available' ? 'available' : 'maintenance';
    // 质押状态类名
    const pledgeStatusClass = club.isPledged ? 'pledged' : 'unpledged';
    
    // 使用背景图片而不是img标签
    const logoStyle = club.logoUrl ? 
        `background-image: url('${club.logoUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat;` : 
        '';
    
    // 构建卡片内容
    card.innerHTML = `
        <div class="card-header">
            <div class="club-identity">
                <div class="club-logo" style="width: 120px; height: 120px; min-width: 120px; min-height: 120px; margin-right: 10px; border-radius: 4px; background-color: #121212; ${logoStyle}"></div>
                <h2 class="club-name">${club.name}</h2>
            </div>
        </div>
        <div class="card-body">
            <div class="left-info">
                <div class="platform-info">
                    <div class="platform-logo">${club.platform}</div>
                    <span class="level-tag">${club.level}</span>
                </div>
                <div class="time-schedule">
                    <div class="time-label">开放时间</div>
                    <div class="time-bar">
                        <div class="time-range">${club.operationTime}</div>
                    </div>
                </div>
                <div class="payment-methods">
                    ${club.paymentMethods.includes('支付宝') ? 
                        '<div class="payment-icon" title="支付宝"><img src="images/payment/alipay.png" alt="支付宝" class="payment-logo"></div>' : ''}
                    ${club.paymentMethods.includes('微信支付') ? 
                        '<div class="payment-icon" title="微信支付"><img src="images/payment/wechat.png" alt="微信支付" class="payment-logo"></div>' : ''}
                    ${club.paymentMethods.includes('USDT') ? 
                        '<div class="payment-icon" title="USDT"><img src="images/payment/usdt.png" alt="USDT" class="payment-logo"></div>' : ''}
                    ${club.paymentMethods.includes('银行转账') ? 
                        '<div class="payment-icon" title="银行转账"><img src="images/payment/unipay.png" alt="银行转账" class="payment-logo"></div>' : ''}
                </div>
            </div>
            <div class="right-info">
                <p class="club-slogan">${club.slogan || '高品质线上德州俱乐部'}</p>
                <div class="status-info">
                    <div class="player-count">
                        <span class="count-label">在线玩家:</span>
                        <span class="count-value">${club.playerCount}</span>
                    </div>
                    <div class="availability ${availabilityClass}">
                        <span class="status-dot"></span>
                        <span class="status-text">${club.status === 'available' ? '当前可加入' : '维护中'}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-actions">
            <button class="join-button" data-club-id="${club.id}">立即加入</button>
            <a href="#" class="report-link" data-club-id="${club.id}">举报</a>
        </div>
        <div class="pledge-status ${pledgeStatusClass}">
            <div class="${club.isPledged ? 'shield-icon' : 'warning-icon'}"></div>
            <span class="pledge-text">${club.isPledged ? `质押 ${club.pledgeAmount} USDT` : '未质押'}</span>
        </div>
    `;
    
    // 添加按钮事件
    const joinButton = card.querySelector('.join-button');
    joinButton.addEventListener('click', function() {
        joinClub(club);
    });
    
    const reportLink = card.querySelector('.report-link');
    reportLink.addEventListener('click', function(e) {
        e.preventDefault();
        reportClub(club);
    });
    
    return card;
}

// 确保Logo元素持续可见
function ensureLogosVisible() {
    const logoElements = document.querySelectorAll('.club-logo');
    logoElements.forEach(logo => {
        // 确保元素可见并且样式属性保持不变
        logo.style.width = '120px';
        logo.style.height = '120px';
        logo.style.minWidth = '120px';
        logo.style.minHeight = '120px';
        logo.style.marginRight = '10px';
        logo.style.display = 'block';
        
        // 如果有背景图，确保背景图的设置正确
        if (logo.style.backgroundImage) {
            logo.style.backgroundSize = 'contain';
            logo.style.backgroundPosition = 'center';
            logo.style.backgroundRepeat = 'no-repeat';
        }
    });
}

// 更新页面顶部的统计数据
function updateStatistics() {
    if (!window.PokerRadarDataService) {
        return;
    }
    
    const clubs = window.PokerRadarDataService.getAllClubs();
    
    // 更新俱乐部数量
    const clubCountEl = document.querySelector('.club-count');
    if (clubCountEl) {
        clubCountEl.textContent = clubs.length;
    }
    
    // 计算质押总额
    let totalPledge = 0;
    clubs.forEach(club => {
        if (club.isPledged && club.pledgeAmount) {
            // 移除非数字字符并转换为数字
            const amount = parseInt(club.pledgeAmount.toString().replace(/[^\d]/g, ''), 10);
            if (!isNaN(amount)) {
                totalPledge += amount;
            }
        }
    });
    
    // 更新质押总额
    const pledgeAmountEl = document.querySelector('.pledge-amount');
    if (pledgeAmountEl) {
        // 格式化数字（添加千位分隔符）
        pledgeAmountEl.textContent = totalPledge.toLocaleString();
    }
    
    // 更新质押信任榜
    updatePledgeRanking(clubs);
}

// 更新质押信任榜
function updatePledgeRanking(clubs) {
    // 筛选有质押的俱乐部
    const pledgedClubs = clubs.filter(club => club.isPledged && club.pledgeAmount);
    
    // 按质押金额降序排序
    pledgedClubs.sort((a, b) => {
        const amountA = parseInt(a.pledgeAmount.toString().replace(/[^\d]/g, ''), 10);
        const amountB = parseInt(b.pledgeAmount.toString().replace(/[^\d]/g, ''), 10);
        return amountB - amountA;
    });
    
    // 获取前5名
    const topClubs = pledgedClubs.slice(0, 5);
    
    // 找到质押信任榜容器
    const rankList = document.querySelector('.rank-list');
    if (!rankList) return;
    
    // 清空现有内容
    rankList.innerHTML = '';
    
    // 添加前5名俱乐部到排行榜
    topClubs.forEach((club, index) => {
        const position = index + 1;
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        // 格式化质押金额
        const formattedPledge = parseInt(club.pledgeAmount).toLocaleString() + ' USDT';
        
        rankItem.innerHTML = `
            <div class="rank-position">
                ${position === 1 ? '<span class="crown-icon"></span>' : ''}
                <span class="position-number">${position}</span>
            </div>
            <div class="rank-info">
                <span class="rank-name">${club.name}</span>
                <span class="rank-pledge">${formattedPledge}</span>
            </div>
        `;
        
        rankList.appendChild(rankItem);
    });
}

// 加入俱乐部逻辑
function joinClub(club) {
    // 假设这里会打开加入俱乐部的对话框或导向注册页面
    alert(`即将加入俱乐部: ${club.name}\n请联系客服获取加入邀请码`);
}

// 举报俱乐部逻辑
function reportClub(club) {
    // 假设这里会打开举报对话框
    alert(`您正在举报俱乐部: ${club.name}\n请提供具体问题以帮助我们处理`);
}

// 显示错误消息
function showErrorMessage(message) {
    const clubsContainer = document.querySelector('.clubs-container');
    clubsContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// 设置登录按钮事件
function setupLoginButton() {
    const loginButton = document.querySelector('.login-button');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            window.location.href = 'admin/login.html';
        });
    }
}

// 加载并显示公告
function loadAndDisplayAnnouncements() {
    if (!window.PokerRadarDataService) {
        console.error('数据服务不可用');
        return;
    }
    
    // 获取活跃的公告
    const activeAnnouncements = window.PokerRadarDataService.getActiveAnnouncements();
    
    if (activeAnnouncements && activeAnnouncements.length > 0) {
        // 获取第一条活跃公告
        const announcementText = document.querySelector('.announcement-text');
        if (announcementText) {
            // 组合所有活跃公告内容
            let combinedText = activeAnnouncements.map(a => a.text).join(' | ');
            announcementText.textContent = combinedText;
            
            // 如果没有父容器可见，则让整个公告部分显示
            const announcementSection = document.querySelector('.sidebar-module.announcements');
            if (announcementSection) {
                announcementSection.style.display = 'block';
            }
            
            // 初始化滚动效果
            initAnnouncementScroll();
        }
    } else {
        // 如果没有活跃公告，隐藏公告部分
        const announcementSection = document.querySelector('.sidebar-module.announcements');
        if (announcementSection) {
            announcementSection.style.display = 'none';
        }
    }
}

// 初始化公告滚动效果
function initAnnouncementScroll() {
    const announcementText = document.querySelector('.announcement-text');
    if (!announcementText) return;
    
    // 复制公告内容以实现无缝滚动
    const originalText = announcementText.textContent;
    announcementText.textContent = originalText + ' ' + originalText;
    
    // 设置鼠标悬停暂停滚动
    const announcementContainer = document.querySelector('.announcement-container');
    if (announcementContainer) {
        announcementContainer.addEventListener('mouseenter', function() {
            announcementText.style.animationPlayState = 'paused';
        });
        
        announcementContainer.addEventListener('mouseleave', function() {
            announcementText.style.animationPlayState = 'running';
        });
    }
    
    // 添加暂停/播放按钮功能
    const pauseButton = document.querySelector('.announcement-controls .pause');
    if (pauseButton) {
        pauseButton.addEventListener('click', function() {
            if (announcementText.style.animationPlayState === 'running' || 
                !announcementText.style.animationPlayState) {
                announcementText.style.animationPlayState = 'paused';
                this.textContent = '播放';
            } else {
                announcementText.style.animationPlayState = 'running';
                this.textContent = '暂停';
            }
        });
    }
}

// 设置视图切换功能
function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-button');
    const clubsContainer = document.querySelector('.clubs-container');
    
    if(!viewButtons.length || !clubsContainer) return;
    
    // 检查本地存储中是否有保存的视图首选项
    const savedView = localStorage.getItem('preferredView');
    if(savedView) {
        // 应用保存的视图模式
        viewButtons.forEach(button => {
            const viewType = button.getAttribute('data-view');
            button.classList.toggle('active', viewType === savedView);
        });
        
        if(savedView === 'list') {
            clubsContainer.classList.add('list-view');
        } else {
            clubsContainer.classList.remove('list-view');
        }
    }
    
    // 为每个视图按钮添加点击事件
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 获取视图类型
            const viewType = this.getAttribute('data-view');
            
            // 保存用户首选项到本地存储
            localStorage.setItem('preferredView', viewType);
            
            // 应用视图变化
            if(viewType === 'list') {
                clubsContainer.classList.add('list-view');
            } else {
                clubsContainer.classList.remove('list-view');
            }
            
            // 确保在视图切换后Logo元素正确显示
            setTimeout(ensureLogosVisible, 100);
        });
    });
}
