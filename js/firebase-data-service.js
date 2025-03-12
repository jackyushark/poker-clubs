/**
 * Firebase数据加载器
 * 负责从Firebase获取俱乐部数据并提供给前端使用
 */

// 定义全局命名空间
window.PokerRadarApp = window.PokerRadarApp || {};

// Firebase数据服务
class FirebaseDataService {
    constructor() {
        console.log('初始化Firebase数据服务...');
        
        try {
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            console.log('Firebase Firestore和Storage服务已初始化');
        } catch (error) {
            console.error('初始化Firebase服务失败:', error);
        }
        
        this.clubsData = [];
        console.log('Firebase数据服务初始化完成');
    }

    // 获取所有俱乐部
    async getClubs() {
        try {
            console.log('开始从Firebase加载俱乐部数据');
            const snapshot = await this.db.collection('clubs').get();
            
            if (snapshot.empty) {
                console.log('没有找到俱乐部数据');
                return [];
            }
            
            this.clubsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '未命名俱乐部',
                    logo: data.logo || 'https://via.placeholder.com/120x120.png?text=俱乐部',
                    platform: data.platform || '未知平台',
                    level: data.level || '未知级别',
                    levels: data.levels || [data.level || '未知级别'],
                    operationTime: data.operationTime || '全天候',
                    isPledged: data.isPledged === true,
                    pledgeAmount: data.pledge || 0,
                    playerCount: data.players || 0,
                    onlinePlayers: data.onlinePlayers || data.players || 0,
                    slogan: data.slogan || '',
                    paymentMethods: data.paymentMethods || ['USDT'],
                    createdAt: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
                    status: data.status || 'available',
                    isRecommended: data.isRecommended || false,
                    screenshots: data.screenshots || []
                };
            });
            
            console.log(`加载了 ${this.clubsData.length} 个俱乐部`);
            return this.clubsData;
        } catch (error) {
            console.error('加载俱乐部数据出错:', error);
            throw error;
        }
    }

    // 获取单个俱乐部
    async getClub(clubId) {
        try {
            const doc = await this.db.collection('clubs').doc(clubId).get();
            
            if (!doc.exists) {
                console.log('没有找到该俱乐部数据');
                return null;
            }
            
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '未命名俱乐部',
                logo: data.logo || 'https://via.placeholder.com/120x120.png?text=俱乐部',
                platform: data.platform || '未知平台',
                level: data.level || '未知级别',
                levels: data.levels || [data.level || '未知级别'],
                operationTime: data.operationTime || '全天候',
                isPledged: data.isPledged === true,
                pledgeAmount: data.pledge || 0,
                playerCount: data.players || 0,
                onlinePlayers: data.onlinePlayers || data.players || 0,
                slogan: data.slogan || '',
                paymentMethods: data.paymentMethods || ['USDT'],
                createdAt: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
                status: data.status || 'available',
                isRecommended: data.isRecommended || false,
                screenshots: data.screenshots || []
            };
        } catch (error) {
            console.error('获取俱乐部数据出错:', error);
            throw error;
        }
    }

    // 获取统计数据
    async getStatistics() {
        try {
            // 如果还未加载俱乐部数据，先加载
            if (this.clubsData.length === 0) {
                await this.getClubs();
            }
            
            const totalClubs = this.clubsData.length;
            const totalPlayers = this.clubsData.reduce((sum, club) => sum + (club.onlinePlayers || 0), 0);
            const totalPledge = this.clubsData.reduce((sum, club) => sum + (club.pledgeAmount || 0), 0);
            
            return {
                totalClubs,
                totalPlayers,
                totalPledge
            };
        } catch (error) {
            console.error('获取统计数据出错:', error);
            throw error;
        }
    }
}

// 初始化数据服务
window.PokerRadarApp.dataService = new FirebaseDataService();
