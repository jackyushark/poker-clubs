/**
 * 扑克雷达 - 移动端Firebase数据服务
 * 负责从Firebase获取数据并处理展示
 */

// 确保在DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化Firebase连接状态监测
    initFirebaseConnectionMonitor();
    
    // 加载俱乐部数据
    loadClubsFromFirebase();
    
    // 设置统计数据实时更新
    setupStatsRealTimeUpdates();
});

// 初始化Firebase连接状态监测
function initFirebaseConnectionMonitor() {
    // 检查Firebase是否已经初始化
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase未初始化或无法连接');
        showErrorMessage('无法连接Firebase服务，请检查网络连接');
        return false;
    }
    
    console.log('Firebase连接状态: 已连接');
    return true;
}

/**
 * 从Firebase加载俱乐部数据
 */
async function loadClubsFromFirebase() {
    if (!initFirebaseConnectionMonitor()) return;
    
    showLoadingIndicator();
    
    try {
        // 获取Firestore实例
        const db = firebase.firestore();
        
        // 获取俱乐部集合，带排序
        const clubsSnapshot = await db.collection('clubs')
            .orderBy('sortOrder', 'asc')
            .get();
        
        // 检查是否有数据
        if (clubsSnapshot.empty) {
            console.log('没有找到俱乐部数据');
            hideLoadingIndicator();
            showNoDataMessage();
            return;
        }
        
        // 转换数据
        const clubs = [];
        clubsSnapshot.forEach(doc => {
            const data = doc.data();
            const club = {
                id: doc.id,
                name: data.name || '未知俱乐部',
                logo: data.logo || '../images/default-logo.png',
                logoUrl: data.logoUrl || data.logo || '../images/default-logo.png', 
                platform: data.platform || '',
                level: data.level || '',
                levels: data.levels || [],
                onlinePlayers: data.onlinePlayers || data.players || 0,
                
                // 关键：正确处理质押相关字段
                isPledged: data.isPledged === true,
                pledgeAmount: data.pledge || 0,  // 使用与Web端相同的字段名
                
                // 支付方式
                paymentMethods: data.paymentMethods || ['USDT']
            };
            
            clubs.push(club);
        });
        
        console.log('处理后的俱乐部数据:', clubs);
        
        // 保存到全局变量
        window.clubsData = clubs;
        
        // 渲染俱乐部列表
        renderClubs(clubs);
        
        // 更新统计数据
        updateStatistics(clubs);
        
        // 隐藏加载指示器
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('从Firebase加载俱乐部数据失败:', error);
        hideLoadingIndicator();
        showErrorMessage('加载数据失败: ' + error.message);
    }
}

/**
 * 设置统计数据实时更新
 */
function setupStatsRealTimeUpdates() {
    if (!initFirebaseConnectionMonitor()) return;
    
    const db = firebase.firestore();
    
    // 实时监听在线玩家数量更新
    db.collection('playerStats').doc('realtime')
        .onSnapshot(snapshot => {
            if (snapshot.exists) {
                const data = snapshot.data();
                updatePlayerCounts(data);
            }
        }, error => {
            console.error('监听玩家数据更新失败:', error);
        });
        
    // 实时监听俱乐部统计数据
    db.collection('statistics').doc('clubStats')
        .onSnapshot(snapshot => {
            if (snapshot.exists) {
                const stats = snapshot.data();
                updateHeaderStatistics(stats);
            }
        }, error => {
            console.error('监听统计数据更新失败:', error);
        });
}

/**
 * 根据用户分类过滤俱乐部
 * @param {string} category 分类名称
 */
function filterClubsByCategory(category) {
    if (!window.clubsData) return;
    
    const clubs = window.clubsData;
    let filteredClubs = [];
    
    // 根据不同分类应用不同的过滤条件
    switch(category) {
        case '全部':
            filteredClubs = clubs;
            break;
        case '已质押':
            filteredClubs = clubs.filter(club => club.isPledged);
            break;
        case '系统推荐':
            filteredClubs = clubs.filter(club => club.isRecommended);
            break;
        case '小级别':
            filteredClubs = clubs.filter(club => {
                const level = parseLevel(club.level);
                return level < 5;
            });
            break;
        case '中级别':
            filteredClubs = clubs.filter(club => {
                const level = parseLevel(club.level);
                return level >= 5 && level < 10;
            });
            break;
        case '高级别':
            filteredClubs = clubs.filter(club => {
                const level = parseLevel(club.level);
                return level >= 10;
            });
            break;
        default:
            filteredClubs = clubs;
    }
    
    // 重新渲染过滤后的列表
    renderClubs(filteredClubs);
}

/**
 * 分析级别大小字符串，返回最高级别值用于比较
 * @param {string} levelStr 级别字符串，如 "5/10"
 * @returns {number} 级别数值
 */
function parseLevel(levelStr) {
    if (!levelStr) return 0;
    
    // 分割级别字符串
    const parts = levelStr.split('/');
    
    // 提取所有数字并找出最大值
    const levels = parts.map(part => {
        const num = parseFloat(part.trim());
        return isNaN(num) ? 0 : num;
    });
    
    return Math.max(...levels);
}

/**
 * 根据指定条件排序俱乐部
 * @param {string} criteria 排序条件
 * @param {string} direction 排序方向，fa-sort-up为升序，fa-sort-down为降序
 */
function sortClubs(criteria, direction) {
    if (!window.clubsData) return;
    
    const clubs = [...window.clubsData]; // 复制一份数据，不改变原数组
    
    // 确定排序方向
    const isAscending = direction.includes('fa-sort-up');
    
    // 根据不同条件排序
    switch (criteria) {
        case '名称':
            clubs.sort((a, b) => {
                const compare = a.name.localeCompare(b.name, 'zh-CN');
                return isAscending ? compare : -compare;
            });
            break;
        case '级别':
            clubs.sort((a, b) => {
                const levelA = parseLevel(a.level);
                const levelB = parseLevel(b.level);
                return isAscending ? levelA - levelB : levelB - levelA;
            });
            break;
        case '质押金':
            clubs.sort((a, b) => {
                const pledgeA = a.isPledged ? (a.pledgeAmount || 0) : 0;
                const pledgeB = b.isPledged ? (b.pledgeAmount || 0) : 0;
                return isAscending ? pledgeA - pledgeB : pledgeB - pledgeA;
            });
            break;
        case '玩家数':
            clubs.sort((a, b) => {
                const playersA = a.onlinePlayers || 0;
                const playersB = b.onlinePlayers || 0;
                return isAscending ? playersA - playersB : playersB - playersA;
            });
            break;
        default:
            // 默认按原始排序
            clubs.sort((a, b) => {
                const orderA = a.sortOrder || 0;
                const orderB = b.sortOrder || 0;
                return orderA - orderB;
            });
    }
    
    // 重新渲染排序后的俱乐部
    renderClubs(clubs);
}

/**
 * 渲染俱乐部列表
 * @param {Array} clubs 俱乐部数据数组
 */
function renderClubs(clubs) {
    const clubsList = document.getElementById('clubsList');
    
    // 清除加载指示器以外的内容
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // 清除现有的俱乐部项
    const existingItems = clubsList.querySelectorAll('.club-item');
    existingItems.forEach(item => item.remove());
    
    // 检查是否有数据可展示
    if (!clubs || clubs.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // 创建并添加每个俱乐部项
    clubs.forEach(club => {
        const clubItem = createClubItem(club);
        clubsList.appendChild(clubItem);
    });
}

/**
 * 创建单个俱乐部列表项
 * @param {Object} club 俱乐部数据
 * @returns {HTMLElement} 俱乐部列表项DOM元素
 */
function createClubItem(club) {
    // 调试输出查看字段
    console.log('正在渲染俱乐部:', club);
    
    const clubItem = document.createElement('div');
    clubItem.className = 'club-item';
    clubItem.dataset.id = club.id;
    
    // 俱乐部Logo
    const clubLogo = document.createElement('div');
    clubLogo.className = 'club-logo';
    
    const logoImg = document.createElement('img');
    // 尝试多个可能的logo字段
    logoImg.src = club.logoUrl || club.logo || '../images/default-logo.png';
    logoImg.alt = `${club.name}Logo`;
    logoImg.onerror = function() {
        this.src = '../images/default-logo.png';
    };
    
    clubLogo.appendChild(logoImg);
    clubItem.appendChild(clubLogo);
    
    // 俱乐部信息
    const clubInfo = document.createElement('div');
    clubInfo.className = 'club-info';
    
    // 俱乐部名称行
    const clubNameRow = document.createElement('div');
    clubNameRow.className = 'club-name-row';
    
    const clubName = document.createElement('h2');
    clubName.className = 'club-name';
    clubName.textContent = club.name;
    
    const clubPlatform = document.createElement('div');
    clubPlatform.className = 'club-platform';
    
    // 尝试多个可能的平台字段
    let platformText = '';
    if (typeof club.platform === 'string') {
        platformText = club.platform;
    } else if (club.platforms && club.platforms.length) {
        platformText = club.platforms[0];
    } else if (club.gamePlatform) {
        platformText = club.gamePlatform;
    }
    clubPlatform.textContent = platformText;
    
    clubNameRow.appendChild(clubName);
    clubNameRow.appendChild(clubPlatform);
    clubInfo.appendChild(clubNameRow);
    
    // 俱乐部详情
    const clubDetails = document.createElement('div');
    clubDetails.className = 'club-details';
    
    const playerCount = document.createElement('span');
    playerCount.className = 'player-count';
    // 尝试多个可能的玩家数量字段
    const onlinePlayers = club.onlinePlayers || club.playerCount || club.players || 0;
    playerCount.textContent = `${onlinePlayers} 玩家`;
    
    const clubLevel = document.createElement('span');
    clubLevel.className = 'club-level';
    
    // 尝试多个可能的级别字段
    let levelText = '';
    if (typeof club.level === 'string') {
        levelText = club.level;
    } else if (club.levels && club.levels.length) {
        levelText = club.levels.join('/');
    } else if (club.blindLevels && club.blindLevels.length) {
        levelText = club.blindLevels.join('/');
    }
    clubLevel.textContent = levelText || 'N/A';
    
    clubDetails.appendChild(playerCount);
    clubDetails.appendChild(clubLevel);
    
    // 添加支付方式（使用图片而不是文字）
    if (club.paymentMethods && club.paymentMethods.length > 0) {
        const paymentMethodsContainer = document.createElement('div');
        paymentMethodsContainer.className = 'payment-methods-container';
        
        // 添加"支付："文本标签
        const paymentLabel = document.createElement('span');
        paymentLabel.className = 'payment-label';
        paymentLabel.textContent = '支付: ';
        paymentMethodsContainer.appendChild(paymentLabel);
        
        // 添加支付方式图标
        club.paymentMethods.forEach(method => {
            const methodLower = method.toLowerCase();
            let imageName = '';
            
            // 匹配支付方式与图片
            if (methodLower.includes('支付宝') || methodLower.includes('alipay')) {
                imageName = 'alipay.png';
            } else if (methodLower.includes('微信') || methodLower.includes('wechat')) {
                imageName = 'wechat.png';
            } else if (methodLower.includes('usdt') || methodLower.includes('泰达币')) {
                imageName = 'usdt.png';
            } else if (methodLower.includes('银联') || methodLower.includes('unipay') || methodLower.includes('银行')) {
                imageName = 'unipay.png';
            }
            
            if (imageName) {
                const methodIcon = document.createElement('img');
                methodIcon.src = `../images/payment/${imageName}`;
                methodIcon.alt = method;
                methodIcon.className = 'payment-icon';
                methodIcon.title = method;
                paymentMethodsContainer.appendChild(methodIcon);
            }
        });
        
        clubDetails.appendChild(paymentMethodsContainer);
    }
    
    clubInfo.appendChild(clubDetails);
    
    clubItem.appendChild(clubInfo);
    
    // 俱乐部指标
    const clubMetrics = document.createElement('div');
    clubMetrics.className = 'club-metrics';
    
    const pledgeStatus = document.createElement('div');
    
    // 检查是否有质押
    const isPledged = club.isPledged || (club.pledgeAmount && club.pledgeAmount > 0);
    pledgeStatus.className = isPledged ? 'pledge-status pledged' : 'pledge-status unpledged';
    
    if (isPledged) {
        const pledgeValue = document.createElement('span');
        pledgeValue.className = 'pledge-value';
        
        // 获取质押金额 - 使用原始数据中的pledge字段
        pledgeValue.textContent = formatNumber(club.pledgeAmount);
        
        const pledgeCurrency = document.createElement('span');
        pledgeCurrency.className = 'pledge-currency';
        pledgeCurrency.textContent = 'USDT';
        
        console.log(`俱乐部 ${club.name} 的质押金额: ${club.pledgeAmount} USDT`);
        
        pledgeStatus.appendChild(pledgeValue);
        pledgeStatus.appendChild(pledgeCurrency);
    } else {
        const warningIcon = document.createElement('i');
        warningIcon.className = 'fas fa-exclamation-triangle';
        
        const warningText = document.createElement('span');
        warningText.textContent = '未质押';
        
        pledgeStatus.appendChild(warningIcon);
        pledgeStatus.appendChild(warningText);
    }
    
    clubMetrics.appendChild(pledgeStatus);
    clubItem.appendChild(clubMetrics);
    
    // 点击事件 - 查看详情
    clubItem.addEventListener('click', () => {
        window.location.href = `club-detail.html?id=${club.id}`;
    });
    
    return clubItem;
}

/**
 * 更新统计数据
 * @param {Object} clubs 俱乐部数据
 */
function updateStatistics(clubs) {
    if (!clubs) return;
    
    // 计算总俱乐部数和已质押俱乐部数
    const totalClubs = clubs.length;
    const pledgedClubs = clubs.filter(club => {
        return club.isPledged || (club.pledgeAmount && club.pledgeAmount > 0);
    }).length;
    
    // 更新DOM
    const totalClubsCount = document.getElementById('totalClubsCount');
    const pledgedClubsCount = document.getElementById('pledgedClubsCount');
    
    if (totalClubsCount) {
        totalClubsCount.textContent = totalClubs;
    }
    
    if (pledgedClubsCount) {
        pledgedClubsCount.textContent = pledgedClubs;
    }
}

/**
 * 更新页头统计数据
 * @param {Object} stats 统计数据对象
 */
function updateHeaderStatistics(stats) {
    if (!stats) return;
    
    const totalClubsCount = document.getElementById('totalClubsCount');
    const pledgedClubsCount = document.getElementById('pledgedClubsCount');
    
    if (totalClubsCount && stats.totalClubs !== undefined) {
        totalClubsCount.textContent = stats.totalClubs;
    }
    
    if (pledgedClubsCount && stats.pledgedClubs !== undefined) {
        pledgedClubsCount.textContent = stats.pledgedClubs;
    }
}

/**
 * 更新各俱乐部玩家数量
 * @param {Object} data 玩家数据
 */
function updatePlayerCounts(data) {
    if (!data || !data.clubs) return;
    
    // 遍历所有俱乐部列表项
    const clubItems = document.querySelectorAll('.club-item');
    clubItems.forEach(item => {
        const clubId = item.dataset.id;
        
        // 检查是否有此俱乐部的玩家数据
        if (data.clubs[clubId]) {
            const playerCount = item.querySelector('.player-count');
            if (playerCount) {
                const oldValue = parseInt(playerCount.textContent);
                const newValue = data.clubs[clubId];
                
                // 只有在值变化时更新
                if (oldValue !== newValue) {
                    playerCount.textContent = `${newValue} 玩家`;
                    
                    // 添加动画效果
                    playerCount.classList.add('updated');
                    setTimeout(() => {
                        playerCount.classList.remove('updated');
                    }, 1000);
                    
                    // 同时更新全局数据
                    if (window.clubsData) {
                        const club = window.clubsData.find(c => c.id === clubId);
                        if (club) {
                            club.onlinePlayers = newValue;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 显示加载指示器
 */
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * 显示无数据消息
 */
function showNoDataMessage() {
    const clubsList = document.getElementById('clubsList');
    
    const noDataMessage = document.createElement('div');
    noDataMessage.className = 'no-data-message';
    noDataMessage.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <p>暂无俱乐部数据</p>
    `;
    
    clubsList.appendChild(noDataMessage);
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showErrorMessage(message) {
    const clubsList = document.getElementById('clubsList');
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
    `;
    
    clubsList.appendChild(errorMessage);
}
