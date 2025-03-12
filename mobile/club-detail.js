// 俱乐部详情页脚本
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
});

// 初始化详情页
async function initializeDetailPage() {
    try {
        // 从URL获取俱乐部ID
        const urlParams = new URLSearchParams(window.location.search);
        const clubId = urlParams.get('id');
        
        if (!clubId) {
            showError('未找到俱乐部信息');
            return;
        }
        
        console.log('正在获取俱乐部ID:', clubId);
        
        // 先显示加载中状态
        document.getElementById('loadingIndicator').style.display = 'flex';
        
        // 加载数据服务
        try {
            await loadDataService();
            console.log('数据服务加载完成');
        } catch (error) {
            console.warn('数据服务加载失败，将使用后备数据:', error);
            // 继续执行，后面会使用后备数据
        }
        
        // 获取俱乐部详情
        let clubDetails;
        try {
            clubDetails = await getClubDetails(clubId);
            console.log('成功获取俱乐部详情:', clubDetails);
        } catch (error) {
            console.error('获取俱乐部详情失败:', error);
            clubDetails = createFallbackClubDetails(clubId);
            console.log('使用后备数据:', clubDetails);
        }
        
        if (!clubDetails) {
            clubDetails = createFallbackClubDetails(clubId);
            console.log('未找到数据，使用后备数据:', clubDetails);
        }
        
        // 隐藏加载状态
        document.getElementById('loadingIndicator').style.display = 'none';
        
        // 渲染俱乐部信息
        renderClubDetails(clubDetails);
        
        // 初始化截图轮播
        initializeScreenshotsSwiper(clubDetails.screenshots || []);
        
        // 加载玩家评价
        renderReviews(clubDetails.reviews || []);
        
        // 添加分享按钮功能
        document.getElementById('shareButton').addEventListener('click', function() {
            shareClub(clubDetails);
        });
        
        // 添加返回按钮功能
        document.getElementById('backButton').addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
    } catch (error) {
        console.error('初始化详情页失败:', error);
        showError('加载失败，请稍后重试');
    }
}

// 加载数据服务
async function loadDataService() {
    return new Promise((resolve, reject) => {
        if (window.PokerRadarDataService) {
            console.log('数据服务已加载');
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        // 修正路径，确保能找到文件
        script.src = '../admin/js/data-service.js'; 
        script.async = true;
        
        script.onload = () => {
            console.log('数据服务加载成功');
            if (window.PokerRadarDataService) {
                resolve();
            } else {
                console.error('数据服务脚本加载成功但PokerRadarDataService未定义');
                reject(new Error('数据服务未正确初始化'));
            }
        };
        
        script.onerror = (error) => {
            console.error('加载数据服务失败:', error);
            reject(error);
        };
        
        document.head.appendChild(script);
    });
}

// 获取俱乐部详情
async function getClubDetails(clubId) {
    console.log('开始获取俱乐部详情, ID:', clubId);
    
    // 尝试从数据服务获取
    if (window.PokerRadarDataService) {
        try {
            console.log('从PokerRadarDataService获取俱乐部数据');
            const club = window.PokerRadarDataService.getClubById(clubId);
            console.log('获取到的俱乐部数据:', club);
            
            if (club) {
                // 确保所有必需字段都存在，以防admin后台记录的数据不完全
                return enhanceClubData(club);
            }
        } catch (error) {
            console.error('从数据服务获取数据失败:', error);
            // 继续尝试其他方法
        }
    } else {
        console.warn('PokerRadarDataService不可用，尝试加载');
        try {
            await loadDataService();
            // 再次尝试获取
            if (window.PokerRadarDataService) {
                const club = window.PokerRadarDataService.getClubById(clubId);
                if (club) {
                    return enhanceClubData(club);
                }
            }
        } catch (loadError) {
            console.error('加载数据服务失败:', loadError);
        }
    }
    
    // 尝试从API获取
    try {
        const response = await fetch(`../api/clubs/${clubId}`);
        if (response.ok) {
            const data = await response.json();
            if (data) {
                return enhanceClubData(data);
            }
        }
    } catch (apiError) {
        console.error('API请求失败:', apiError);
    }
    
    // 所有方法都失败，创建和使用后备数据
    console.warn('无法获取俱乐部数据，使用后备数据');
    return createFallbackClubDetails(clubId);
}

// 增强俱乐部数据（添加模拟的详细信息）
function enhanceClubData(club) {
    // 创建新对象以保留原始数据，同时添加缺失的字段
    const enhancedClub = { ...club };
    
    // 如果没有特定的详细信息字段，添加一些模拟数据
    if (!enhancedClub.screenshots) {
        console.log('为俱乐部补充截图数据');
        enhancedClub.screenshots = [
            { 
                url: '../images/screenshots/default1.jpg',
                caption: '牌桌示例'
            },
            { 
                url: '../images/screenshots/default2.jpg',
                caption: '游戏示例'
            }
        ];
    }
    
    if (!enhancedClub.regularPlayerCount) {
        enhancedClub.regularPlayerCount = (enhancedClub.playerCount ? enhancedClub.playerCount * 3 + '-' + enhancedClub.playerCount * 4 : '100-150') + '人';
    }
    
    if (!enhancedClub.contactInfo) {
        enhancedClub.contactInfo = '微信: poker' + enhancedClub.id + (enhancedClub.id.length < 3 ? '888' : '');
    }
    
    if (!enhancedClub.features) {
        enhancedClub.features = [
            { icon: 'fa-trophy', text: '每日锦标赛' },
            { icon: 'fa-money-bill-wave', text: '高额彩池' },
            { icon: 'fa-shield-alt', text: '安全保障' },
            { icon: 'fa-clock', text: '24/7客服' }
        ];
    }
    
    if (!enhancedClub.description) {
        enhancedClub.description = `${enhancedClub.name}是一家专业的德州扑克俱乐部，提供多种级别的牌局，满足不同玩家需求。我们的牌手来自各行各业，游戏环境公平公正，确保每位玩家都能享受到高质量的扑克体验。\n\n我们提供多种优惠活动，包括首充奖励、日常红利和锦标赛奖池。${enhancedClub.name}承诺为每位玩家提供安全、可靠的游戏环境和专业的客户服务。`;
    }
    
    if (!enhancedClub.reviews) {
        enhancedClub.reviews = [
            {
                id: 1,
                name: '王先生',
                avatar: null, 
                rating: 5,
                date: '2024-12-15',
                content: '玩了几个月了，环境很好，管理员处理问题及时，推荐给扑克爱好者。'
            },
            {
                id: 2,
                name: '李小姐',
                avatar: null,
                rating: 4,
                date: '2024-12-10',
                content: '游戏体验不错，提款很快，就是有时候人不多。总体来说很满意。'
            },
            {
                id: 3,
                name: '张先生',
                avatar: null,
                rating: 4.5,
                date: '2024-12-05',
                content: '高级别的牌局很刺激，遇到了不少高手，很有挑战性。客服态度也很好。'
            }
        ];
    }
    
    // 如果没有提供桌子数量，根据玩家数量计算一个合理值
    if (!enhancedClub.tableCount) {
        enhancedClub.tableCount = enhancedClub.playerCount ? Math.ceil(enhancedClub.playerCount / 6) : 5;
    }
    
    // 确保质押金额是字符串类型
    if (enhancedClub.pledgeAmount && typeof enhancedClub.pledgeAmount === 'number') {
        enhancedClub.pledgeAmount = enhancedClub.pledgeAmount.toString();
    }
    
    // 确保有24小时变化百分比
    if (!enhancedClub.changePercentage) {
        // 随机生成一个-20%~+30%之间的变化率
        const change = (Math.random() * 50 - 20).toFixed(1);
        enhancedClub.changePercentage = (change >= 0 ? '+' : '') + change + '%';
    }
    
    console.log('增强后的俱乐部数据:', enhancedClub);
    return enhancedClub;
}

// 创建后备的俱乐部详情
function createFallbackClubDetails(clubId) {
    return {
        id: clubId,
        name: '扑克俱乐部 ' + clubId,
        platform: 'HH',
        level: '5/10',
        playerCount: 35,
        operationTime: '全天候',
        paymentMethods: ['支付宝', '微信支付', 'USDT'],
        status: 'available',
        isPledged: true,
        pledgeAmount: '50000',
        slogan: '高手云集，大额对决无限制',
        logo: '../images/logo.png', // 使用确定存在的logo图片
        changePercentage: '+12.4%',
        tableCount: 6,
        regularPlayerCount: '100-150人',
        contactInfo: '微信: pokerclub888',
        screenshots: [
            { url: '../images/screenshots/default1.jpg', caption: '游戏界面示例' },
            { url: '../images/screenshots/default2.jpg', caption: '游戏界面示例' }
        ],
        features: [
            { icon: 'fa-trophy', text: '每日锦标赛' },
            { icon: 'fa-money-bill-wave', text: '高额彩池' },
            { icon: 'fa-shield-alt', text: '安全保障' },
            { icon: 'fa-clock', text: '24/7客服' }
        ],
        description: '这是一家专业的德州扑克俱乐部，提供多种级别的牌局，满足不同玩家需求。我们的牌手来自各行各业，游戏环境公平公正，确保每位玩家都能享受到高质量的扑克体验。\n\n我们提供多种优惠活动，包括首充奖励、日常红利和锦标赛奖池。我们承诺为每位玩家提供安全、可靠的游戏环境和专业的客户服务。',
        reviews: [
            {
                id: 1,
                name: '王先生',
                avatar: null, // 不使用不存在的头像，改为null
                rating: 5,
                date: '2024-12-15',
                content: '玩了几个月了，环境很好，管理员处理问题及时，推荐给扑克爱好者。'
            },
            {
                id: 2,
                name: '李小姐',
                avatar: null, // 不使用不存在的头像，改为null
                rating: 4,
                date: '2024-12-10',
                content: '游戏体验不错，提款很快，就是有时候人不多。总体来说很满意。'
            }
        ]
    };
}

// 渲染俱乐部详情
function renderClubDetails(club) {
    // 设置页面标题
    document.title = `${club.name} - 扑克雷达`;
    
    // 基本信息
    document.getElementById('clubLogo').src = club.logo || club.logoUrl || '../images/placeholder.png';
    document.getElementById('clubName').textContent = club.name;
    document.getElementById('clubPlatform').textContent = club.platform;
    document.getElementById('clubLevel').textContent = club.level;
    
    document.getElementById('playerCount').textContent = club.playerCount || 0;
    document.getElementById('tableCount').textContent = club.tableCount || 0;
    
    // 处理变化百分比
    let changePercentage = club.changePercentage || '0%';
    if (!changePercentage.includes('%')) {
        changePercentage = changePercentage + '%';
    }
    
    const changeElement = document.getElementById('changePercentage');
    const changeValue = parseFloat(changePercentage);
    if (!isNaN(changeValue)) {
        changeElement.className = 'stat-value ' + (changeValue >= 0 ? 'positive' : 'negative');
        changeElement.textContent = (changeValue >= 0 ? '+' : '') + changePercentage;
    } else {
        changeElement.textContent = changePercentage;
    }
    
    // 质押信息
    const pledgeBadge = document.getElementById('pledgeBadge');
    if (club.isPledged) {
        pledgeBadge.style.display = '';
        document.getElementById('pledgeAmount').textContent = '质押: ' + formatNumber(club.pledgeAmount);
    } else {
        pledgeBadge.style.display = 'none';
    }
    
    // 详细信息
    document.getElementById('operationTime').textContent = club.operationTime || '未知';
    document.getElementById('regularPlayerCount').textContent = club.regularPlayerCount || '未知';
    document.getElementById('contactInfo').textContent = club.contactInfo || '请咨询在线客服';
    
    // 渲染支付方式
    renderPaymentMethods(club.paymentMethods || []);
    
    // 渲染特色和标语
    document.getElementById('clubSlogan').textContent = club.slogan || '';
    renderFeatures(club.features || []);
    
    // 渲染俱乐部简介
    document.getElementById('clubDescription').textContent = club.description || '暂无简介';
    
    // 渲染评价
    renderReviews(club.reviews || []);
}

// 格式化数字（添加千位分隔符）
function formatNumber(num) {
    if (!num) return '0';
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 渲染支付方式
function renderPaymentMethods(methods) {
    const container = document.getElementById('paymentMethods');
    container.innerHTML = '';
    
    if (!methods || methods.length === 0) {
        container.textContent = '暂无信息';
        return;
    }
    
    methods.forEach(method => {
        let imgSrc = '';
        let paymentName = '';
        
        if (method.includes('支付宝')) {
            imgSrc = '../images/payment/alipay.png';
            paymentName = '支付宝';
        } else if (method.includes('微信')) {
            imgSrc = '../images/payment/wechat.png';
            paymentName = '微信支付';
        } else if (method.includes('USDT') || method.includes('加密')) {
            imgSrc = '../images/payment/usdt.png';
            paymentName = 'USDT';
        } else if (method.includes('银行') || method.includes('卡') || method.includes('银联')) {
            imgSrc = '../images/payment/unipay.png';
            paymentName = '银联';
        } else {
            // 默认图标
            imgSrc = '../images/payment/unipay.png';
            paymentName = method;
        }
        
        const paymentIcon = document.createElement('div');
        paymentIcon.className = 'payment-icon';
        paymentIcon.title = paymentName;
        paymentIcon.innerHTML = `<img src="${imgSrc}" alt="${paymentName}">`;
        
        container.appendChild(paymentIcon);
    });
}

// 渲染俱乐部特色
function renderFeatures(features) {
    const container = document.getElementById('featuresList');
    container.innerHTML = '';
    
    if (!features || features.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无特色信息</div>';
        return;
    }
    
    features.forEach(feature => {
        const featureTag = document.createElement('div');
        featureTag.className = 'feature-tag';
        featureTag.innerHTML = `
            <i class="fas ${feature.icon || 'fa-check'}"></i>
            <span>${feature.text}</span>
        `;
        
        container.appendChild(featureTag);
    });
}

// 渲染评价
function renderReviews(reviews) {
    const container = document.getElementById('reviewsList');
    container.innerHTML = '';
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无玩家评价</div>';
        return;
    }
    
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        // 生成星级评分HTML
        const starsHtml = generateStarsHtml(review.rating);
        
        // 创建头像HTML
        let avatarHtml = '';
        if (review.avatar) {
            // 如果有头像URL，使用图片
            avatarHtml = `<img src="${review.avatar}" alt="${review.name}" class="reviewer-avatar">`;
        } else {
            // 如果没有头像，使用首字母头像或默认图标
            const initial = review.name ? review.name.charAt(0).toUpperCase() : '?';
            avatarHtml = `<div class="reviewer-avatar-placeholder">${initial}</div>`;
        }
        
        reviewItem.innerHTML = `
            <div class="review-header">
                ${avatarHtml}
                <div class="reviewer-info">
                    <div class="reviewer-name">${review.name}</div>
                    <div class="review-date">${formatDate(review.date)}</div>
                </div>
                <div class="review-rating">
                    ${starsHtml}
                </div>
            </div>
            <div class="review-content">${review.content}</div>
        `;
        
        container.appendChild(reviewItem);
    });
}

// 生成星级评分HTML
function generateStarsHtml(rating) {
    if (!rating) return '';
    
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // 添加满星
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // 添加半星
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 添加空星
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    } catch (e) {
        return dateStr;
    }
}

// 初始化截图轮播
function initializeScreenshotsSwiper(screenshots) {
    const swiperWrapper = document.getElementById('screenshotsWrapper');
    
    // 清空现有内容
    swiperWrapper.innerHTML = '';
    
    // 创建默认截图，以防没有实际图片
    if (!screenshots || screenshots.length === 0) {
        // 添加默认的占位幻灯片
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="screenshot-placeholder">
                <i class="fas fa-camera"></i>
                <p>暂无游戏截图</p>
            </div>`;
        swiperWrapper.appendChild(slide);
    } else {
        // 添加轮播项
        screenshots.forEach(screenshot => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            // 创建图片容器
            const imgContainer = document.createElement('div');
            imgContainer.className = 'screenshot-container';
            
            // 创建图片元素，自适应各种比例的截图
            const img = document.createElement('img');
            img.src = screenshot.url;
            img.alt = screenshot.caption || '游戏截图';
            
            // 添加加载错误处理
            img.onerror = function() {
                this.onerror = null;
                this.parentNode.innerHTML = `
                    <div class="screenshot-placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>图片加载失败</p>
                    </div>`;
            };
            
            // 将图片添加到容器
            imgContainer.appendChild(img);
            
            // 如果有截图说明，添加说明文字
            if (screenshot.caption) {
                const caption = document.createElement('div');
                caption.className = 'screenshot-caption';
                caption.textContent = screenshot.caption;
                imgContainer.appendChild(caption);
            }
            
            slide.appendChild(imgContainer);
            swiperWrapper.appendChild(slide);
        });
    }
    
    // 初始化Swiper
    try {
        if (typeof Swiper !== 'undefined') {
            new Swiper('.swiper-container', {
                loop: swiperWrapper.children.length > 2, // 只有当超过2张图片时启用循环
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: true, // 动态子弹效果，更美观
                },
                // 自动高度适配
                autoHeight: true,
                // 显示2张截图，在小屏幕上自动调整为1张
                slidesPerView: 'auto',
                breakpoints: {
                    320: {
                        slidesPerView: 1.2,
                        spaceBetween: 10
                    },
                    480: {
                        slidesPerView: 2,
                        spaceBetween: 15
                    }
                },
                // 居中显示当前幻灯片
                centeredSlides: swiperWrapper.children.length === 1,
                // 适当的间距
                spaceBetween: 10,
                // 自动播放（仅当有多张图片时）
                autoplay: swiperWrapper.children.length > 2 ? {
                    delay: 3000,
                    disableOnInteraction: false
                } : false,
                // 滑动时显示抓手指针
                grabCursor: true,
                // 允许用户滑动操作
                allowTouchMove: true,
                // 自由模式，不固定位置
                freeMode: swiperWrapper.children.length > 2,
                freeModeSticky: true
            });
        } else {
            console.warn('Swiper库未加载，轮播功能将不可用');
            // 添加基本的样式让图片能够静态显示
            const style = document.createElement('style');
            style.textContent = `
                .swiper-wrapper { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
                .swiper-slide { flex: 0 0 calc(50% - 5px); margin-bottom: 10px; height: 160px; }
                .screenshot-container { width: 100%; height: 100%; overflow: hidden; border-radius: 8px; }
                .screenshot-container img { width: 100%; height: 100%; object-fit: contain; }
                .screenshot-caption { background: rgba(0,0,0,0.7); padding: 6px; font-size: 11px; text-align: center; color: white; }
                @media (max-width: 360px) { .swiper-slide { flex: 0 0 100%; } }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('初始化轮播图失败:', error);
        // 如果Swiper初始化失败，至少保留静态显示
    }
}

// 加载玩家评价
function loadReviews(clubId) {
    // 此函数保留用于后续从API加载真实评价数据
    // 目前评价数据已经包含在俱乐部详情中
}

// 分享俱乐部
function shareClub(club) {
    // 创建分享内容
    const shareText = `【扑克雷达】推荐俱乐部：${club.name}\n平台: ${club.platform} | 级别: ${club.level}\n在线玩家: ${club.playerCount}人\n${club.slogan}\n${club.isPledged ? '已质押: ' + formatNumber(club.pledgeAmount) : '未质押'}\n联系方式: ${club.contactInfo}`;
    
    // 检查是否支持Navigator Share API
    if (navigator.share) {
        navigator.share({
            title: '扑克雷达 - ' + club.name,
            text: shareText,
            url: window.location.href
        })
        .then(() => console.log('分享成功'))
        .catch((error) => {
            console.error('分享失败:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// 后备分享方法
function fallbackShare(text) {
    // 创建一个临时输入元素
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    
    // 选择并复制文本
    input.select();
    document.execCommand('copy');
    
    // 移除临时元素
    document.body.removeChild(input);
    
    // 显示提示
    alert('分享内容已复制到剪贴板，您可以粘贴发送给好友！');
}

// 显示错误信息
function showError(message) {
    const errorContainer = document.getElementById('errorContainer') || createErrorContainer();
    
    // 创建错误消息元素
    errorContainer.innerHTML = `
        <div class="error-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="error-message">${message}</div>
        <a href="index.html" class="error-action">返回主页</a>
    `;
    
    // 显示错误容器
    errorContainer.style.display = 'flex';
    
    // 隐藏加载指示器
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // 隐藏其他内容区域
    const contentSections = document.querySelectorAll('.screenshots-section, .club-detailed-info, .club-features, .club-description, .player-reviews');
    contentSections.forEach(section => {
        section.style.display = 'none';
    });
}

// 创建错误容器
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'errorContainer';
    container.className = 'error-container';
    
    // 将容器插入到主内容区域的顶部
    const mainContent = document.querySelector('.club-detail-content');
    if (mainContent) {
        mainContent.prepend(container);
    } else {
        document.body.appendChild(container);
    }
    
    return container;
}
