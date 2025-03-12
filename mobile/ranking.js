document.addEventListener('DOMContentLoaded', function() {
    // 尝试从数据服务获取俱乐部排行榜数据
    loadDataService().then(() => {
        // 加载排行榜数据
        loadRankingData();
    }).catch(error => {
        console.error('无法加载数据服务:', error);
        // 显示错误信息
        showRankingError('无法加载数据服务，请稍后再试');
    });
    
    // 加载数据服务模块
    function loadDataService() {
        return new Promise((resolve, reject) => {
            console.log('正在加载数据服务模块...');
            const script = document.createElement('script');
            script.src = '../admin/js/data-service.js'; 
            script.onload = () => {
                console.log('数据服务模块加载成功');
                if (window.PokerRadarDataService) {
                    console.log('PokerRadarDataService已成功初始化');
                    resolve();
                } else {
                    console.error('PokerRadarDataService加载失败: 服务对象不存在');
                    // 即使加载失败也继续，我们会使用后备数据
                    resolve();
                }
            };
            script.onerror = (error) => {
                console.error('加载数据服务模块失败:', error);
                // 即使加载失败也继续，我们会使用后备数据
                resolve();
            };
            document.head.appendChild(script);
        });
    }
    
    // 加载排行榜数据
    function loadRankingData() {
        const rankingList = document.querySelector('.ranking-list');
        
        // 显示加载中
        rankingList.innerHTML = `
            <div class="ranking-loading">
                <div class="ranking-spinner"></div>
                <div>加载中...</div>
            </div>
        `;
        
        // 尝试从数据服务获取数据
        if (window.PokerRadarDataService) {
            try {
                console.log('从数据服务获取俱乐部排行数据');
                let clubs = window.PokerRadarDataService.getAllClubs();
                
                if (Array.isArray(clubs) && clubs.length > 0) {
                    // 只获取已质押的俱乐部
                    clubs = clubs.filter(club => club.isPledged && club.pledgeAmount);
                    
                    // 按照质押金额降序排序
                    clubs.sort((a, b) => {
                        const pledgeA = parseFloat(String(a.pledgeAmount).replace(/,/g, '')) || 0;
                        const pledgeB = parseFloat(String(b.pledgeAmount).replace(/,/g, '')) || 0;
                        return pledgeB - pledgeA;
                    });
                    
                    renderRankingList(clubs);
                    return;
                } else {
                    console.warn('从数据服务获取的俱乐部数据为空');
                }
            } catch (error) {
                console.error('数据服务获取数据失败:', error);
            }
        }
        
        // 如果数据服务不可用或返回空数据，尝试从API获取
        fetch('../api/clubs/ranking')
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                if (data && Array.isArray(data) && data.length > 0) {
                    renderRankingList(data);
                } else {
                    showRankingEmpty();
                }
            })
            .catch(error => {
                console.error('获取排行榜数据失败:', error);
                showRankingError('获取排行榜数据失败，请稍后再试');
            });
    }
    
    // 渲染排行榜列表
    function renderRankingList(clubs) {
        const rankingList = document.querySelector('.ranking-list');
        
        if (!clubs || clubs.length === 0) {
            showRankingEmpty();
            return;
        }
        
        // 清空排行榜
        rankingList.innerHTML = '';
        
        // 渲染排行榜项目
        clubs.forEach((club, index) => {
            // 确保pledgeAmount是字符串并格式化
            let pledgeAmount = String(club.pledgeAmount || '0');
            
            // 确定排名样式
            let positionClass = 'position-other';
            if (index === 0) positionClass = 'position-1';
            else if (index === 1) positionClass = 'position-2';
            else if (index === 2) positionClass = 'position-3';
            
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            
            rankingItem.innerHTML = `
                <div class="ranking-position ${positionClass}">${index + 1}</div>
                <div class="ranking-club-info">
                    <div class="ranking-club-logo">
                        <img src="${club.logo || club.logoUrl || '../images/placeholder.png'}" alt="${club.name} Logo">
                    </div>
                    <div class="ranking-club-details">
                        <h3 class="ranking-club-name">${club.name}</h3>
                        <div class="ranking-club-stats">
                            <div class="ranking-club-platform">${club.platform}</div>
                            <div class="player-count">${club.playerCount || 0} 玩家</div>
                        </div>
                    </div>
                </div>
                <div class="ranking-pledge-amount">
                    ${pledgeAmount}<span class="ranking-pledge-currency">USDT</span>
                </div>
            `;
            
            rankingList.appendChild(rankingItem);
        });
    }
    
    // 显示排行榜为空的提示
    function showRankingEmpty() {
        const rankingList = document.querySelector('.ranking-list');
        rankingList.innerHTML = `
            <div class="ranking-empty">
                <i class="fas fa-trophy" style="font-size: 40px; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>暂无质押俱乐部数据</p>
            </div>
        `;
    }
    
    // 显示排行榜加载错误
    function showRankingError(message) {
        const rankingList = document.querySelector('.ranking-list');
        rankingList.innerHTML = `
            <div class="ranking-empty">
                <i class="fas fa-exclamation-circle" style="font-size: 40px; margin-bottom: 10px; color: #ff4d4d;"></i>
                <p>${message}</p>
            </div>
        `;
    }
});
