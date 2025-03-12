document.addEventListener('DOMContentLoaded', function() {
    // 加载管理后台的数据服务
    loadScript('admin/js/data-service.js').then(() => {
        // 初始化应用
        initApp();
    }).catch(error => {
        console.error('无法加载数据服务:', error);
        // 如果数据服务加载失败，依然尝试使用静态数据初始化
        initApp();
    });

    // 初始化应用
    function initApp() {
        // 加载俱乐部数据
        loadClubs();
        
        // 加载质押排行榜
        loadPledgeRanking();
        
        // 更新统计数据
        updateStatistics();
        
        // 启动公告滚动效果
        initAnnouncementScroll();
        
        // 数据滚动更新动画
        animateCounters();
        
        // 平台公告滚动控制
        setupAnnouncementControls();
        
        // 卡片交互效果
        setupCardInteractions();
    }

    // 从数据服务或静态HTML加载俱乐部数据
    function loadClubs() {
        const clubsContainer = document.querySelector('.clubs-container');
        
        // 检查数据服务是否可用
        if (window.PokerRadarDataService) {
            const clubs = window.PokerRadarDataService.getAllClubs();
            
            // 清空现有内容
            clubsContainer.innerHTML = '';
            
            // 生成俱乐部卡片
            clubs.forEach(club => {
                const clubCard = createClubCard(club);
                clubsContainer.appendChild(clubCard);
            });
        }
    }

    // 创建俱乐部卡片元素
    function createClubCard(club) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'club-card';
        cardDiv.id = `club-${club.id}`;
        
        // 构建卡片HTML
        cardDiv.innerHTML = `
            <div class="card-header">
                <div class="club-identity">
                    <div class="club-logo">
                        <img src="${club.logoUrl}" alt="${club.name}Logo">
                    </div>
                    <h2 class="club-name">${club.name}</h2>
                </div>
                <div class="pledge-status ${club.isPledged ? 'pledged' : 'unpledged'}">
                    <div class="${club.isPledged ? 'shield-icon' : 'warning-icon'}"></div>
                    <span class="pledge-text">${club.isPledged ? `质押 ${formatNumber(club.pledgeAmount)} USDT` : '未质押'}</span>
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
                        ${generatePaymentIcons(club.paymentMethods)}
                    </div>
                </div>
                <div class="right-info">
                    <p class="club-slogan">${club.slogan}</p>
                    <div class="status-info">
                        <div class="player-count">
                            <span class="count-label">在线玩家:</span>
                            <span class="count-value">${club.playerCount}</span>
                        </div>
                        <div class="availability ${club.status === 'available' ? 'available' : 'unavailable'}">
                            <span class="status-dot"></span>
                            <span class="status-text">${club.status === 'available' ? '当前可加入' : '维护中'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="join-button">立即加入</button>
                <a href="#" class="report-link">举报</a>
            </div>
        `;
        
        // 添加事件监听器
        const joinButton = cardDiv.querySelector('.join-button');
        joinButton.addEventListener('click', function() {
            alert(`您即将加入 ${club.name}，本功能即将上线`);
        });
        
        return cardDiv;
    }

    // 生成支付方式图标
    function generatePaymentIcons(methods) {
        let icons = '';
        
        if (methods.includes('支付宝')) {
            icons += `<div class="payment-icon" title="支付宝"><div class="alipay-icon"></div></div>`;
        }
        
        if (methods.includes('微信支付')) {
            icons += `<div class="payment-icon" title="微信支付"><div class="wechat-icon"></div></div>`;
        }
        
        if (methods.includes('USDT')) {
            icons += `<div class="payment-icon" title="USDT"><div class="usdt-icon"></div></div>`;
        }
        
        if (methods.includes('银行转账')) {
            icons += `<div class="payment-icon" title="银行转账"><div class="bank-icon"></div></div>`;
        }
        
        return icons;
    }

    // 加载质押排行榜
    function loadPledgeRanking() {
        if (!window.PokerRadarDataService) return;
        
        const rankingList = document.querySelector('.rank-list');
        if (!rankingList) return;
        
        // 获取排行榜数据
        const rankingData = window.PokerRadarDataService.getPledgeRanking(5);
        
        // 清空现有内容
        rankingList.innerHTML = '';
        
        // 生成排行榜项目
        rankingData.forEach((club, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'rank-item';
            
            // 标记第一名
            const isFirstPlace = index === 0;
            
            rankItem.innerHTML = `
                <div class="rank-position">
                    ${isFirstPlace ? '<span class="crown-icon"></span>' : ''}
                    <span class="position-number">${index + 1}</span>
                </div>
                <div class="rank-info">
                    <span class="rank-name">${club.name}</span>
                    <span class="rank-pledge">${formatNumber(club.pledgeAmount)} USDT</span>
                </div>
            `;
            
            rankingList.appendChild(rankItem);
        });
    }

    // 更新统计数据
    function updateStatistics() {
        if (!window.PokerRadarDataService) return;
        
        const stats = window.PokerRadarDataService.getStatistics();
        
        // 更新俱乐部数量
        const clubCountElement = document.querySelector('.club-count');
        if (clubCountElement) {
            clubCountElement.textContent = stats.totalClubs;
        }
        
        // 更新总质押金额
        const pledgeAmountElement = document.querySelector('.pledge-amount');
        if (pledgeAmountElement) {
            pledgeAmountElement.textContent = formatNumber(stats.totalPledgeAmount);
        }
    }

    // 启动公告滚动效果
    function initAnnouncementScroll() {
        const announcementText = document.querySelector('.announcement-text');
        if (!announcementText) return;
        
        // 复制公告内容
        const originalText = announcementText.textContent;
        announcementText.textContent = originalText + ' ' + originalText;
        
        // 添加滚动动画
        announcementText.classList.add('scrolling');
        
        // 控制暂停按钮
        const pauseButton = document.querySelector('.announcement-controls .pause');
        if (pauseButton) {
            pauseButton.addEventListener('click', function() {
                if (announcementText.classList.contains('scrolling')) {
                    announcementText.classList.remove('scrolling');
                    pauseButton.textContent = '继续';
                } else {
                    announcementText.classList.add('scrolling');
                    pauseButton.textContent = '暂停';
                }
            });
        }
    }

    // 数字格式化函数，添加千位分隔符
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // 动态加载脚本
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 数字滚动动画函数
    function animateCounters() {
        // 质押总额数字动画
        const pledgeAmount = document.querySelector('.pledge-amount');
        const targetValue = 1200000;
        let currentValue = 1150000;
        
        // 俱乐部数量动画
        const clubCount = document.querySelector('.club-count');
        const targetClubCount = 20;
        let currentClubCount = 18;
        
        const interval = setInterval(() => {
            // 更新质押金额
            if (currentValue < targetValue) {
                currentValue += 1000;
                pledgeAmount.textContent = new Intl.NumberFormat().format(currentValue);
            }
            
            // 更新俱乐部数量
            if (currentClubCount < targetClubCount) {
                currentClubCount += 1;
                clubCount.textContent = currentClubCount;
            }
            
            // 如果两者都达到目标值，停止动画
            if (currentValue >= targetValue && currentClubCount >= targetClubCount) {
                clearInterval(interval);
                
                // 设置定时器，过段时间后重新开始动画
                setTimeout(() => {
                    currentValue = 1150000;
                    currentClubCount = 18;
                    animateCounters();
                }, 15000);
            }
        }, 200);
    }

    // 设置平台公告滚动控制
    function setupAnnouncementControls() {
        const announcementText = document.querySelector('.announcement-text');
        const pauseButton = document.querySelector('.control-button.pause');
        
        let isPaused = false;
        
        pauseButton.addEventListener('click', () => {
            if (!isPaused) {
                // 暂停动画
                announcementText.style.animationPlayState = 'paused';
                pauseButton.textContent = '继续';
                isPaused = true;
            } else {
                // 继续动画
                announcementText.style.animationPlayState = 'running';
                pauseButton.textContent = '暂停';
                isPaused = false;
            }
        });
    }

    // 卡片交互效果
    function setupCardInteractions() {
        const cards = document.querySelectorAll('.club-card');
        
        cards.forEach(card => {
            const joinButton = card.querySelector('.join-button');
            
            // 卡片悬停效果
            card.addEventListener('mouseenter', () => {
                // 按钮上浮效果
                joinButton.style.transform = 'translateY(-5px) scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                // 恢复按钮原始状态
                joinButton.style.transform = '';
            });
            
            // 加入按钮点击效果
            joinButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 获取俱乐部名称
                const clubName = card.querySelector('.club-name').textContent;
                
                // 这里可以添加实际跳转逻辑或显示加入对话框
                alert(`正在连接到 ${clubName} 俱乐部...`);
            });
        });
        
        // 支付方式图标悬停显示说明
        const paymentIcons = document.querySelectorAll('.payment-icon');
        
        paymentIcons.forEach(icon => {
            const tooltip = icon.getAttribute('title');
            
            icon.addEventListener('mouseenter', () => {
                // 创建工具提示元素
                const tooltipElement = document.createElement('div');
                tooltipElement.className = 'tooltip';
                tooltipElement.textContent = tooltip;
                
                // 定位和样式
                tooltipElement.style.position = 'absolute';
                tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltipElement.style.color = '#fff';
                tooltipElement.style.padding = '5px 10px';
                tooltipElement.style.borderRadius = '4px';
                tooltipElement.style.fontSize = '12px';
                tooltipElement.style.zIndex = '100';
                tooltipElement.style.top = '40px';
                tooltipElement.style.left = '50%';
                tooltipElement.style.transform = 'translateX(-50%)';
                tooltipElement.style.whiteSpace = 'nowrap';
                
                // 添加到DOM
                icon.style.position = 'relative';
                icon.appendChild(tooltipElement);
            });
            
            icon.addEventListener('mouseleave', () => {
                // 移除工具提示
                const tooltip = icon.querySelector('.tooltip');
                if (tooltip) {
                    icon.removeChild(tooltip);
                }
            });
        });
    }

    // 动态更新玩家数量
    function updatePlayerCounts() {
        const playerCountElements = document.querySelectorAll('.count-value');
        
        playerCountElements.forEach(element => {
            // 获取当前值
            let currentValue = parseInt(element.textContent);
            
            // 随机增减1-3的玩家数量，模拟真实变化
            let change = Math.floor(Math.random() * 5) - 2;
            let newValue = Math.max(5, currentValue + change); // 确保不会小于5
            
            // 更新显示
            element.textContent = newValue;
            
            // 如果变化明显，添加变化的动画效果
            if (Math.abs(change) >= 2) {
                element.style.transition = 'color 0.5s';
                
                if (change > 0) {
                    element.style.color = '#4CAF50'; // 增加时显示绿色
                } else if (change < 0) {
                    element.style.color = '#FF4D4D'; // 减少时显示红色
                }
                
                // 恢复原来的颜色
                setTimeout(() => {
                    element.style.color = '';
                }, 500);
            }
        });
    }

    // 每30秒更新一次玩家数量
    setInterval(updatePlayerCounts, 30000);

    // 初始触发一次玩家数量更新
    setTimeout(updatePlayerCounts, 5000);
});
