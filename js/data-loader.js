/**
 * 扑克雷达 - 数据加载器
 * 负责从JSON文件加载数据
 * 创建日期: 2025-03-12
 */

// 从JSON文件加载俱乐部数据
function loadClubsFromJson() {
    return fetch('../data/clubs-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络错误，无法加载俱乐部数据');
            }
            return response.json();
        })
        .then(data => {
            return data.clubs || [];
        })
        .catch(error => {
            console.error('加载俱乐部数据失败:', error);
            return [];
        });
}

// 从JSON文件加载统计数据
function loadStatisticsFromJson() {
    return fetch('../data/clubs-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络错误，无法加载统计数据');
            }
            return response.json();
        })
        .then(data => {
            return data.statistics || {};
        })
        .catch(error => {
            console.error('加载统计数据失败:', error);
            return {};
        });
}

// 从JSON文件加载公告
function loadAnnouncementsFromJson() {
    return fetch('../data/clubs-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络错误，无法加载公告数据');
            }
            return response.json();
        })
        .then(data => {
            return data.announcements || [];
        })
        .catch(error => {
            console.error('加载公告数据失败:', error);
            return [];
        });
}

// 创建数据服务对象
const PokerRadarDataService = {
    loadClubs: loadClubsFromJson,
    loadStatistics: loadStatisticsFromJson,
    loadAnnouncements: loadAnnouncementsFromJson
};

// 导出数据服务
window.PokerRadarDataService = PokerRadarDataService;
