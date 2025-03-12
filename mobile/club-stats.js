/**
 * 俱乐部统计数据更新脚本
 * 负责在所有移动端页面上显示俱乐部统计信息
 */
document.addEventListener('DOMContentLoaded', function() {
    // 加载俱乐部统计数据
    loadClubStats();
    
    /**
     * 加载俱乐部统计数据
     * 尝试从数据服务获取统计数据，如果不可用则使用API
     */
    function loadClubStats() {
        console.log('正在加载俱乐部统计数据...');
        
        // 尝试从数据服务获取数据
        if (window.PokerRadarDataService) {
            try {
                console.log('从数据服务获取俱乐部统计数据');
                let clubs = window.PokerRadarDataService.getAllClubs();
                
                if (Array.isArray(clubs) && clubs.length > 0) {
                    // 计算统计数据
                    const totalClubs = clubs.length;
                    const pledgedClubs = clubs.filter(club => club.isPledged).length;
                    
                    // 更新UI
                    updateStatsUI(totalClubs, pledgedClubs);
                    return;
                } else {
                    console.warn('从数据服务获取的俱乐部数据为空');
                }
            } catch (error) {
                console.error('数据服务获取统计数据失败:', error);
            }
        } else {
            console.log('数据服务不可用，尝试加载数据服务模块');
            loadDataService().then(() => {
                if (window.PokerRadarDataService) {
                    try {
                        let clubs = window.PokerRadarDataService.getAllClubs();
                        if (Array.isArray(clubs) && clubs.length > 0) {
                            // 计算统计数据
                            const totalClubs = clubs.length;
                            const pledgedClubs = clubs.filter(club => club.isPledged).length;
                            
                            // 更新UI
                            updateStatsUI(totalClubs, pledgedClubs);
                            return;
                        }
                    } catch (e) {
                        console.error('数据服务加载后获取数据失败:', e);
                    }
                }
                // 从API获取数据
                fetchStatsFromAPI();
            }).catch(() => {
                // 数据服务加载失败，从API获取
                fetchStatsFromAPI();
            });
        }
    }
    
    /**
     * 从API获取统计数据
     */
    function fetchStatsFromAPI() {
        console.log('从API获取俱乐部统计数据');
        fetch('../api/clubs/stats')
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.totalClubs && data.pledgedClubs) {
                    updateStatsUI(data.totalClubs, data.pledgedClubs);
                } else {
                    // 使用默认数据
                    updateStatsUI(6, 5);
                }
            })
            .catch(error => {
                console.error('获取统计数据失败:', error);
                // 使用默认数据
                updateStatsUI(6, 5);
            });
    }
    
    /**
     * 更新统计UI
     * @param {number} totalClubs - 总俱乐部数
     * @param {number} pledgedClubs - 已质押俱乐部数
     */
    function updateStatsUI(totalClubs, pledgedClubs) {
        console.log(`更新统计UI: 总计${totalClubs}家俱乐部, ${pledgedClubs}家已质押`);
        
        // 更新所有统计数字元素
        const totalClubsElements = document.querySelectorAll('#totalClubsCount');
        const pledgedClubsElements = document.querySelectorAll('#pledgedClubsCount');
        
        totalClubsElements.forEach(element => {
            element.textContent = totalClubs;
        });
        
        pledgedClubsElements.forEach(element => {
            element.textContent = pledgedClubs;
        });
    }
    
    /**
     * 加载数据服务模块
     */
    function loadDataService() {
        return new Promise((resolve, reject) => {
            console.log('正在加载数据服务模块...');
            if (window.PokerRadarDataService) {
                console.log('数据服务已加载');
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = '../admin/js/data-service.js'; 
            script.onload = () => {
                console.log('数据服务模块加载成功');
                if (window.PokerRadarDataService) {
                    console.log('PokerRadarDataService已成功初始化');
                    resolve();
                } else {
                    console.error('PokerRadarDataService加载失败: 服务对象不存在');
                    reject();
                }
            };
            script.onerror = (error) => {
                console.error('加载数据服务模块失败:', error);
                reject();
            };
            document.head.appendChild(script);
        });
    }
});
