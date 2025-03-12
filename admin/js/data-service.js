/**
 * 数据服务模块 - 用于管理扑克雷达平台的数据
 * 负责处理前台和后台的数据交互
 */

// 模拟数据存储
const STORAGE_KEY = 'pokerRadarClubs';
const ANNOUNCEMENT_KEY = 'pokerRadarAnnouncements';

// 初始化默认数据（如果localStorage为空）
function initializeDefaultData() {
    const defaultClubs = [
        {
            id: '1',
            name: '鲨鱼扑克',
            platform: '微扑克',
            level: '5/10',
            operationTime: '11:00-01:00',
            paymentMethods: ['支付宝', '微信支付', 'USDT'],
            status: 'available',
            isPledged: true,
            pledgeAmount: 50000,
            slogan: '高额桌首选，24小时极速到账',
            playerCount: 42,
            logoUrl: 'https://via.placeholder.com/120',
            sortOrder: 1,
            screenshots: [
                {
                    url: 'https://via.placeholder.com/1280x720?text=游戏截图1',
                    caption: '牌局实时画面'
                },
                {
                    url: 'https://via.placeholder.com/1280x720?text=游戏截图2',
                    caption: '豪华对决现场'
                }
            ]
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
            pledgeAmount: 0,
            slogan: '新手友好环境，专业培训指导',
            playerCount: 21,
            logoUrl: 'https://via.placeholder.com/120',
            sortOrder: 2
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
            pledgeAmount: 100000,
            slogan: '高手云集，大额对决无限制',
            playerCount: 65,
            logoUrl: 'https://via.placeholder.com/120',
            sortOrder: 3
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
            pledgeAmount: 80000,
            slogan: '最佳新手入门，专业指导',
            playerCount: 36,
            logoUrl: 'https://via.placeholder.com/120',
            sortOrder: 4
        }
    ];

    // 检查是否已有俱乐部数据，如果没有就初始化
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClubs));
    }
    
    // 检查是否已有公告数据，如果没有就初始化
    if (!localStorage.getItem(ANNOUNCEMENT_KEY)) {
        const defaultAnnouncements = [
            {
                id: "1",
                text: "新俱乐部入驻：『鲨鱼扑克』 | USDT支付手续费全免 | 3月优惠：首次充值送10%",
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(defaultAnnouncements));
    }
}

// 获取所有俱乐部数据
function getAllClubs() {
    initializeDefaultData(); // 确保有初始数据
    const clubs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // 确保所有俱乐部都有排序值
    clubs.forEach((club, index) => {
        if (club.sortOrder === undefined) {
            club.sortOrder = index + 1;
        }
    });
    
    // 按照sortOrder排序
    clubs.sort((a, b) => a.sortOrder - b.sortOrder);
    
    return clubs;
}

// 获取指定ID的俱乐部
function getClubById(id) {
    const clubs = getAllClubs();
    return clubs.find(club => club.id === id) || null;
}

// 添加新俱乐部
function addClub(clubData) {
    const clubs = getAllClubs();
    
    // 生成新的ID
    clubData.id = Date.now().toString();
    
    // 默认设置为最后一个位置
    if (clubData.sortOrder === undefined) {
        const maxOrder = clubs.reduce((max, club) => Math.max(max, club.sortOrder || 0), 0);
        clubData.sortOrder = maxOrder + 1;
    }
    
    clubs.push(clubData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
    
    return clubData;
}

// 更新现有俱乐部
function updateClub(clubData) {
    const clubs = getAllClubs();
    const index = clubs.findIndex(club => club.id === clubData.id);
    
    if (index !== -1) {
        clubs[index] = clubData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
        return true;
    }
    
    return false;
}

// 删除俱乐部
function deleteClub(id) {
    const clubs = getAllClubs();
    const filteredClubs = clubs.filter(club => club.id !== id);
    
    if (filteredClubs.length < clubs.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredClubs));
        return true;
    }
    
    return false;
}

// 更新俱乐部排序
function updateClubsOrder(orderedIds) {
    const clubs = getAllClubs();
    let updated = false;
    
    // 为每个ID分配新的排序值
    orderedIds.forEach((id, index) => {
        const club = clubs.find(c => c.id === id);
        if (club) {
            club.sortOrder = index + 1;
            updated = true;
        }
    });
    
    if (updated) {
        // 重新排序数组
        clubs.sort((a, b) => a.sortOrder - b.sortOrder);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
    }
    
    return updated;
}

// 获取质押排行榜
function getPledgeRanking(limit = 5) {
    const clubs = getAllClubs();
    
    // 过滤出已质押的俱乐部并按质押金额排序
    return clubs
        .filter(club => club.isPledged)
        .sort((a, b) => b.pledgeAmount - a.pledgeAmount)
        .slice(0, limit);
}

// 获取统计数据
function getStatistics() {
    const clubs = getAllClubs();
    
    const pledgedClubs = clubs.filter(club => club.isPledged);
    const totalPlayers = clubs.reduce((sum, club) => sum + parseInt(club.playerCount || 0), 0);
    
    return {
        totalClubs: clubs.length,
        pledgedClubs: pledgedClubs.length,
        totalPlayers: totalPlayers,
        totalPledgeAmount: pledgedClubs.reduce((sum, club) => sum + parseInt(club.pledgeAmount || 0), 0)
    };
}

// 获取所有公告
function getAllAnnouncements() {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        return announcements;
    } catch (error) {
        console.error('获取公告数据失败:', error);
        return [];
    }
}

// 获取当前活跃的公告
function getActiveAnnouncements() {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        return announcements.filter(announcement => announcement.active);
    } catch (error) {
        console.error('获取活跃公告数据失败:', error);
        return [];
    }
}

// 获取指定ID的公告
function getAnnouncementById(id) {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        return announcements.find(announcement => announcement.id === id) || null;
    } catch (error) {
        console.error('获取公告数据失败:', error);
        return null;
    }
}

// 添加新公告
function addAnnouncement(announcementData) {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        
        // 创建新的公告对象
        const newAnnouncement = {
            ...announcementData,
            id: Date.now().toString(), // 使用当前时间戳作为唯一ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 添加新公告到数组
        announcements.push(newAnnouncement);
        
        // 保存更新后的数据
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcements));
        
        return newAnnouncement;
    } catch (error) {
        console.error('添加公告失败:', error);
        return null;
    }
}

// 更新现有公告
function updateAnnouncement(announcementData) {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        
        // 查找要更新的公告索引
        const index = announcements.findIndex(announcement => announcement.id === announcementData.id);
        
        if (index === -1) {
            throw new Error('找不到要更新的公告');
        }
        
        // 更新公告数据
        announcements[index] = {
            ...announcements[index],
            ...announcementData,
            updatedAt: new Date().toISOString()
        };
        
        // 保存更新后的数据
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcements));
        
        return announcements[index];
    } catch (error) {
        console.error('更新公告失败:', error);
        return null;
    }
}

// 删除公告
function deleteAnnouncement(id) {
    try {
        const announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENT_KEY)) || [];
        
        // 过滤掉要删除的公告
        const updatedAnnouncements = announcements.filter(announcement => announcement.id !== id);
        
        // 保存更新后的数据
        localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(updatedAnnouncements));
        
        return true;
    } catch (error) {
        console.error('删除公告失败:', error);
        return false;
    }
}

// 导出API
window.PokerRadarDataService = {
    getAllClubs,
    getClubById,
    addClub,
    updateClub,
    deleteClub,
    updateClubsOrder,
    getPledgeRanking,
    getStatistics,
    getAllAnnouncements,
    getActiveAnnouncements,
    getAnnouncementById,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
};
