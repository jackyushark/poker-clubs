document.addEventListener('DOMContentLoaded', function() {
    // 检测当前页面
    const currentPage = window.location.pathname.split('/').pop(); // 获取当前页面文件名
    const isMainPage = currentPage === "" || currentPage === "index.html";
    
    // 如果是主页才加载数据服务和俱乐部数据
    if (isMainPage) {
        // 先加载数据服务模块，然后再初始化页面
        loadDataService().then(() => {
            // 初始化加载俱乐部数据
            loadClubs();

            // 分类标签切换
            const categories = document.querySelectorAll('.category');
            categories.forEach(category => {
                category.addEventListener('click', function(event) {
                    event.preventDefault();
                    categories.forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    
                    // 根据选中的分类过滤俱乐部
                    const categoryText = this.textContent.trim();
                    filterClubsByCategory(categoryText);
                });
            });

            // 筛选排序功能
            const filterItems = document.querySelectorAll('.filter-item');
            filterItems.forEach(item => {
                item.addEventListener('click', function() {
                    const icon = this.querySelector('i');
                    
                    // 重置其他排序图标
                    filterItems.forEach(filter => {
                        if (filter !== this) {
                            const filterIcon = filter.querySelector('i');
                            filterIcon.className = 'fas fa-sort';
                        }
                    });
                    
                    // 切换当前排序图标状态
                    if (icon.classList.contains('fa-sort')) {
                        icon.className = 'fas fa-sort-up';
                    } else if (icon.classList.contains('fa-sort-up')) {
                        icon.className = 'fas fa-sort-down';
                    } else {
                        icon.className = 'fas fa-sort';
                    }
                    
                    // 实际的排序逻辑
                    sortClubs(this.querySelector('span').textContent, icon.className);
                });
            });

            // 搜索功能
            const searchInput = document.querySelector('.search-bar input');
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const clubs = document.querySelectorAll('.club-item');
                
                clubs.forEach(club => {
                    const name = club.querySelector('.club-name').textContent.toLowerCase();
                    const platform = club.querySelector('.club-platform').textContent.toLowerCase();
                    const level = club.querySelector('.club-level').textContent.toLowerCase();
                    
                    if (name.includes(searchTerm) || platform.includes(searchTerm) || level.includes(searchTerm)) {
                        club.style.display = '';
                    } else {
                        club.style.display = 'none';
                    }
                });
            });

            // 滚动加载更多
            let isLoading = false;
            let page = 1;
            
            window.addEventListener('scroll', function() {
                if (isLoading || window.noMoreClubs) return;
                
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                    isLoading = true;
                    
                    // 显示加载指示器
                    showLoadingIndicator();
                    
                    // 加载更多俱乐部
                    page++;
                    loadClubs(page);
                    
                    setTimeout(() => {
                        hideLoadingIndicator();
                        isLoading = false;
                    }, 800);
                }
            });

            // 模拟定期更新玩家数量
            setInterval(() => {
                if (!document.hidden) {
                    updatePlayerCounts();
                }
            }, 30000); // 每30秒更新一次
        }).catch(error => {
            console.error('无法加载数据服务:', error);
            // 如果数据加载失败，显示错误信息
            alert('无法加载数据服务，请稍后再试');
        });
    }

    // 底部导航切换 - 在所有页面都需要
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // 如果链接已经包含href属性，则不需要额外处理
            if (this.getAttribute('href') && this.getAttribute('href') !== '#') {
                return;
            }
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            // 这里可以添加切换页面的逻辑
        });
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

    // 从数据服务加载俱乐部数据
    function loadClubs(page = 1) {
        showLoadingIndicator();
        
        // 尝试直接从数据服务获取数据
        if (window.PokerRadarDataService) {
            try {
                console.log('从数据服务获取俱乐部数据');
                const clubs = window.PokerRadarDataService.getAllClubs();
                console.log('获取到的俱乐部数据:', clubs);
                
                if (Array.isArray(clubs) && clubs.length > 0) {
                    // 此处做分页处理，每页10条
                    const pageSize = 10;
                    const startIndex = (page - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    
                    // 如果请求的页码超出数据范围，则不再加载
                    if (startIndex >= clubs.length) {
                        console.log('没有更多数据可加载');
                        hideLoadingIndicator();
                        return;
                    }
                    
                    const pagedClubs = clubs.slice(startIndex, endIndex);
                    renderClubs(pagedClubs, page > 1);
                    
                    // 如果已经加载到最后一页，禁用滚动加载
                    if (endIndex >= clubs.length) {
                        window.noMoreClubs = true;
                    }
                    
                    hideLoadingIndicator();
                    return;
                } else {
                    console.warn('从数据服务获取的俱乐部数据为空');
                }
            } catch (error) {
                console.error('数据服务获取数据失败:', error);
            }
        } else {
            console.error('数据服务不可用');
        }
        
        // 如果数据服务不可用或返回空数据，尝试从API获取
        const limit = 10;
        const url = `../api/clubs?page=${page}&limit=${limit}`;
        
        // 使用Fetch API获取数据
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // 创建一些基本的俱乐部数据作为后备
                    const fallbackClubs = createFallbackClubs();
                    
                    // 模拟分页
                    const pageSize = 2; // 每页显示2条，以便更容易测试分页效果
                    const startIndex = (page - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    
                    // 如果请求的页码超出数据范围，则不再加载
                    if (startIndex >= fallbackClubs.length) {
                        return { clubs: [] };
                    }
                    
                    return { clubs: fallbackClubs.slice(startIndex, endIndex) };
                }
                return response.json();
            })
            .then(data => {
                if (data.clubs && data.clubs.length > 0) {
                    renderClubs(data.clubs, page > 1);
                } else {
                    // 如果返回空数据，表示已经没有更多数据了
                    window.noMoreClubs = true;
                    
                    if (page === 1) {
                        // 如果是第一页就没有数据，显示提示
                        const clubsList = document.querySelector('.clubs-list');
                        clubsList.innerHTML = '<div class="error-message">没有找到符合条件的俱乐部</div>';
                    } else {
                        // 如果是加载更多时没有数据，则显示底部提示
                        const loadingEndMsg = document.createElement('div');
                        loadingEndMsg.className = 'loading-end-message';
                        loadingEndMsg.textContent = '已加载全部俱乐部';
                        document.querySelector('.clubs-list').appendChild(loadingEndMsg);
                    }
                }
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('加载俱乐部数据失败:', error);
                // 尝试使用基本的后备数据
                const fallbackClubs = createFallbackClubs();
                
                // 模拟分页
                const pageSize = 2; // 每页显示2条
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                
                // 如果请求的页码超出数据范围，则不再加载
                if (startIndex >= fallbackClubs.length) {
                    window.noMoreClubs = true;
                    hideLoadingIndicator();
                    return;
                }
                
                const pagedClubs = fallbackClubs.slice(startIndex, endIndex);
                
                if (pagedClubs.length > 0) {
                    renderClubs(pagedClubs, page > 1);
                } else {
                    // 如果没有后备数据，显示错误信息
                    const clubsList = document.querySelector('.clubs-list');
                    clubsList.innerHTML = '<div class="error-message">无法加载俱乐部数据，请刷新页面重试</div>';
                }
                hideLoadingIndicator();
            });
    }
    
    // 创建基本的后备俱乐部数据
    function createFallbackClubs() {
        return [
            {
                id: '1',
                name: '鲨鱼扑克',
                platform: '微扑克',
                level: '5/10',
                operationTime: '11:00-01:00',
                paymentMethods: ['支付宝', '微信支付', 'USDT'],
                status: 'available',
                isPledged: true,
                pledgeAmount: '50000',
                slogan: '高额桌首选，24小时极速到账',
                playerCount: 42,
                logo: '../images/logo1.png',
                changePercentage: '12.4%',
                isRecommended: true
            },
            {
                id: '2',
                name: '王牌俱乐部',
                platform: 'HH',
                level: '3/5',
                operationTime: '14:00-04:00',
                paymentMethods: ['支付宝', '微信支付'],
                status: 'unavailable',
                isPledged: false,
                pledgeAmount: '0',
                slogan: '新手友好环境，专业培训指导',
                playerCount: 21,
                logo: '../images/logo2.png',
                changePercentage: '3.7%',
                isRecommended: false
            },
            {
                id: '3',
                name: '黄金俱乐部',
                platform: '微扑克',
                level: '10/20',
                operationTime: '全天候',
                paymentMethods: ['支付宝', '微信支付', 'USDT'],
                status: 'available',
                isPledged: true,
                pledgeAmount: '100000',
                slogan: '高手云集，大额对决无限制',
                playerCount: 65,
                logo: '../images/logo3.png',
                changePercentage: '-5.2%',
                isRecommended: true
            },
            {
                id: '4',
                name: '皇家扑克',
                platform: 'HH',
                level: '2/5',
                operationTime: '10:00-23:00',
                paymentMethods: ['支付宝', '微信支付', 'USDT'],
                status: 'available',
                isPledged: true,
                pledgeAmount: '80000',
                slogan: '最佳新手入门，专业指导',
                playerCount: 36,
                logo: '../images/logo4.png',
                changePercentage: '-2.1%',
                isRecommended: true
            }
        ];
    }

    // 渲染俱乐部列表
    function renderClubs(clubs, append = false) {
        const clubsList = document.querySelector('.clubs-list');
        
        if (!append) {
            clubsList.innerHTML = '';
        }
        
        if (!clubs || clubs.length === 0) {
            clubsList.innerHTML = '<div class="error-message">没有找到符合条件的俱乐部</div>';
            return;
        }
        
        clubs.forEach(club => {
            const clubItem = document.createElement('div');
            clubItem.className = 'club-item';
            
            // 确保pledgeAmount是字符串
            let pledgeAmount = String(club.pledgeAmount || '0');
            
            // 处理支付方式
            let paymentMethodsHtml = '';
            if (club.paymentMethods && Array.isArray(club.paymentMethods) && club.paymentMethods.length > 0) {
                paymentMethodsHtml = `
                    <div class="payment-methods">
                        <span class="payment-label">支付:</span>
                        <div class="payment-icons">
                            ${club.paymentMethods.map(method => {
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
                                
                                return `<span class="payment-icon" title="${paymentName}">
                                    <img src="${imgSrc}" alt="${paymentName}">
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            clubItem.innerHTML = `
                <div class="club-logo">
                    <img src="${club.logo || club.logoUrl || '../images/placeholder.png'}" alt="${club.name} Logo">
                </div>
                <div class="club-info">
                    <div class="club-name-row">
                        <h2 class="club-name">${club.name}</h2>
                    </div>
                    <div class="club-details">
                        <span class="player-count">${club.playerCount || 0} 玩家</span>
                        <span class="club-level">${club.level}</span>
                        ${paymentMethodsHtml}
                    </div>
                </div>
                <div class="club-metrics">
                    <div class="club-platform">${club.platform}</div>
                    <div class="pledge-status ${club.isPledged ? 'pledged' : 'unpledged'}">
                        ${club.isPledged 
                            ? `<span class="pledge-value">${pledgeAmount}</span><span class="pledge-currency">USDT</span>` 
                            : '<i class="fas fa-exclamation-triangle"></i><span>未质押</span>'}
                    </div>
                </div>
            `;
            
            clubsList.appendChild(clubItem);
            
            // 添加点击事件
            clubItem.addEventListener('click', function() {
                showClubDetails(club);
            });
        });
    }

    // 根据分类过滤俱乐部
    function filterClubsByCategory(category) {
        showLoadingIndicator();
        console.log(`正在过滤: ${category}`);
        
        if (category === '全部') {
            // 如果选择"全部"，直接从数据服务加载所有俱乐部
            if (window.PokerRadarDataService) {
                try {
                    const clubs = window.PokerRadarDataService.getAllClubs();
                    console.log(`获取到所有俱乐部: ${clubs.length}个`);
                    renderClubs(clubs, false);
                    hideLoadingIndicator();
                    return;
                } catch (error) {
                    console.error('从数据服务获取所有俱乐部失败:', error);
                }
            }
            
            // 如果数据服务不可用，尝试从API获取
            loadClubs();
            return;
        }
        
        // 如果不是"全部"分类，尝试直接从数据服务过滤
        if (window.PokerRadarDataService) {
            try {
                let clubs = window.PokerRadarDataService.getAllClubs();
                console.log(`开始过滤前俱乐部总数: ${clubs.length}`);
                
                // 根据分类过滤俱乐部
                if (category === '小级别') {
                    clubs = clubs.filter(club => {
                        try {
                            const levelParts = club.level.split('/');
                            if (levelParts.length < 2) return false;
                            const bigBlind = parseInt(levelParts[1]);
                            return !isNaN(bigBlind) && bigBlind <= 5;
                        } catch (e) {
                            console.error('解析级别数据失败:', e, club);
                            return false;
                        }
                    });
                } else if (category === '中级别') {
                    clubs = clubs.filter(club => {
                        try {
                            const levelParts = club.level.split('/');
                            if (levelParts.length < 2) return false;
                            const bigBlind = parseInt(levelParts[1]);
                            return !isNaN(bigBlind) && bigBlind > 5 && bigBlind <= 20;
                        } catch (e) {
                            console.error('解析级别数据失败:', e, club);
                            return false;
                        }
                    });
                } else if (category === '高级别') {
                    clubs = clubs.filter(club => {
                        try {
                            const levelParts = club.level.split('/');
                            if (levelParts.length < 2) return false;
                            const bigBlind = parseInt(levelParts[1]);
                            return !isNaN(bigBlind) && bigBlind > 20;
                        } catch (e) {
                            console.error('解析级别数据失败:', e, club);
                            return false;
                        }
                    });
                } else if (category === '已质押') {
                    clubs = clubs.filter(club => Boolean(club.isPledged));
                } else if (category === '系统推荐') {
                    // 对于系统推荐，如果isRecommended未定义，则使用isPledged作为后备
                    clubs = clubs.filter(club => Boolean(club.isRecommended || club.isPledged));
                }
                
                console.log(`过滤后的俱乐部: ${clubs.length}个`);
                renderClubs(clubs, false);
                hideLoadingIndicator();
                return;
            } catch (error) {
                console.error('数据服务过滤失败:', error);
            }
        }
        
        // 如果数据服务不可用或发生错误，尝试使用API
        const url = `../api/clubs?category=${encodeURIComponent(category)}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // 如果API不可用，使用后备数据
                    let fallbackClubs = createFallbackClubs();
                    
                    // 对后备数据进行过滤
                    if (category === '小级别') {
                        fallbackClubs = fallbackClubs.filter(club => {
                            const bigBlind = parseInt(club.level.split('/')[1]);
                            return bigBlind <= 5;
                        });
                    } else if (category === '中级别') {
                        fallbackClubs = fallbackClubs.filter(club => {
                            const bigBlind = parseInt(club.level.split('/')[1]);
                            return bigBlind > 5 && bigBlind <= 20;
                        });
                    } else if (category === '高级别') {
                        fallbackClubs = fallbackClubs.filter(club => {
                            const bigBlind = parseInt(club.level.split('/')[1]);
                            return bigBlind > 20;
                        });
                    } else if (category === '已质押') {
                        fallbackClubs = fallbackClubs.filter(club => club.isPledged);
                    } else if (category === '系统推荐') {
                        fallbackClubs = fallbackClubs.filter(club => club.isRecommended);
                    }
                    
                    return Promise.resolve({ clubs: fallbackClubs });
                }
                return response.json();
            })
            .then(data => {
                renderClubs(data.clubs, false);
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('过滤俱乐部数据失败:', error);
                // 如果过滤失败，显示错误信息
                const clubsList = document.querySelector('.clubs-list');
                clubsList.innerHTML = '<div class="error-message">无法过滤俱乐部数据，请重试</div>';
                hideLoadingIndicator();
            });
    }

    // 按条件排序俱乐部
    function sortClubs(criteria, direction) {
        const clubsList = document.querySelector('.clubs-list');
        const clubs = Array.from(document.querySelectorAll('.club-item'));
        
        clubs.sort((a, b) => {
            let valueA, valueB;
            
            if (criteria === '玩家数') {
                valueA = parseInt(a.querySelector('.player-count').textContent);
                valueB = parseInt(b.querySelector('.player-count').textContent);
            } else if (criteria === '质押金') {
                const pledgeA = a.querySelector('.pledge-value');
                const pledgeB = b.querySelector('.pledge-value');
                valueA = pledgeA ? parseInt(pledgeA.textContent.replace(/,/g, '')) : 0;
                valueB = pledgeB ? parseInt(pledgeB.textContent.replace(/,/g, '')) : 0;
            } else if (criteria === '级别') {
                const levelA = a.querySelector('.club-level').textContent;
                const levelB = b.querySelector('.club-level').textContent;
                valueA = parseInt(levelA.split('/')[1]);
                valueB = parseInt(levelB.split('/')[1]);
            } else {
                // 默认按照名称排序
                valueA = a.querySelector('.club-name').textContent;
                valueB = b.querySelector('.club-name').textContent;
                return direction.includes('down') ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
            }
            
            return direction.includes('down') ? valueB - valueA : valueA - valueB;
        });
        
        // 清空并重新添加排序后的俱乐部
        clubsList.innerHTML = '';
        clubs.forEach(club => clubsList.appendChild(club));
    }

    // 显示俱乐部详情
    function showClubDetails(club) {
        // 导航到详情页面
        window.location.href = `club-detail.html?id=${club.id}`;
    }

    // 显示加载指示器
    function showLoadingIndicator() {
        let loadingIndicator = document.querySelector('.loading-indicator');
        
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            `;
            document.body.appendChild(loadingIndicator);
        }
        
        loadingIndicator.style.display = 'flex';
    }

    // 隐藏加载指示器
    function hideLoadingIndicator() {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    // 更新玩家数量
    function updatePlayerCounts() {
        // 在实际应用中，这应该从API获取最新数据
        // 这里使用模拟数据进行演示
        const playerCounts = document.querySelectorAll('.player-count');
        playerCounts.forEach(count => {
            const currentValue = parseInt(count.textContent);
            // 随机增减一些玩家数量，模拟实时变化
            const newValue = currentValue + Math.floor(Math.random() * 11) - 5;
            count.textContent = `${Math.max(1, newValue)} 玩家`;
            
            // 添加一个动画效果突出显示更新
            count.classList.add('updated');
            setTimeout(() => {
                count.classList.remove('updated');
            }, 1000);
        });
    }
});
                }
                
                // 确保playerCount/players字段存在
                if (!club.players && club.playerCount) {
                    club.players = club.playerCount;
                } else if (!club.players) {
                    club.players = Math.floor(Math.random() * 100) + 10; // 随机生成玩家数
                }
                
                // 确保支付方式字段格式正确
                if (!club.payments) {
                    club.payments = ['wechat', 'alipay'];
                }
                
                clubs.push(club);
            });
            
            return clubs;
        } catch (error) {
            console.error('获取俱乐部数据失败:', error);
            throw error;
        }
    }
}
