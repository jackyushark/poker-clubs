document.addEventListener('DOMContentLoaded', function() {
    // 确保Firebase已经初始化
    if (!firebase || !firebase.firestore) {
        console.error('Firebase未正确初始化');
        return;
    }

    // 从Firestore加载俱乐部数据
    loadDashboardData();
    
    // 添加删除俱乐部的事件监听
    setupDeleteButtons();
});

// 从Firestore加载仪表盘数据
function loadDashboardData() {
    const db = firebase.firestore();
    
    // 获取俱乐部集合
    db.collection('clubs').get()
        .then((snapshot) => {
            // 初始化统计数据
            let stats = {
                totalClubs: 0,
                pledgedClubs: 0,
                totalPlayers: 0
            };
            
            // 用于最近俱乐部列表的数据
            let recentClubs = [];
            
            // 计算统计数据
            snapshot.forEach((doc) => {
                const clubData = doc.data();
                
                // 增加总数
                stats.totalClubs++;
                
                // 检查是否有质押
                if (clubData.pledge > 0) {
                    stats.pledgedClubs++;
                }
                
                // 累计玩家数量
                stats.totalPlayers += (parseInt(clubData.players) || 0);
                
                // 添加到最近俱乐部列表
                recentClubs.push({
                    id: doc.id,
                    ...clubData
                });
            });
            
            // 更新仪表盘统计
            updateDashboardStats(stats);
            
            // 更新最近俱乐部列表（最多显示前3个）
            if (recentClubs.length > 0) {
                // 按最新添加排序（假设有timestamp或创建日期字段）
                // 此处可根据实际数据结构调整排序逻辑
                recentClubs.sort((a, b) => {
                    return (b.timestamp || 0) - (a.timestamp || 0);
                });
                
                // 仅显示前3个
                updateRecentClubsList(recentClubs.slice(0, 3));
            }
        })
        .catch((error) => {
            console.error('获取俱乐部数据出错:', error);
        });
}

// 更新仪表盘统计数据
function updateDashboardStats(stats) {
    document.getElementById('totalClubs').textContent = stats.totalClubs;
    document.getElementById('pledgedClubs').textContent = stats.pledgedClubs;
    document.getElementById('totalPlayers').textContent = stats.totalPlayers;
}

// 更新最近俱乐部列表
function updateRecentClubsList(clubs) {
    const recentClubsList = document.getElementById('recentClubsList');
    if (!recentClubsList) return;
    
    // 清空现有内容
    recentClubsList.innerHTML = '';
    
    // 添加俱乐部数据
    clubs.forEach(club => {
        const row = document.createElement('tr');
        
        // 创建Logo单元格
        const logoCell = document.createElement('td');
        logoCell.className = 'club-logo-cell';
        const logoImg = document.createElement('img');
        logoImg.src = club.logo || 'https://via.placeholder.com/120';
        logoImg.alt = club.name + ' Logo';
        logoImg.className = 'club-logo-thumbnail';
        logoCell.appendChild(logoImg);
        
        // 创建名称单元格
        const nameCell = document.createElement('td');
        nameCell.textContent = club.name || '未命名俱乐部';
        
        // 创建平台单元格
        const platformCell = document.createElement('td');
        platformCell.textContent = club.platform || '未指定';
        
        // 创建级别单元格
        const levelCell = document.createElement('td');
        levelCell.textContent = club.level || '未指定';
        
        // 创建质押状态单元格
        const pledgeCell = document.createElement('td');
        if (club.pledge && club.pledge > 0) {
            pledgeCell.className = 'pledged-cell';
            pledgeCell.textContent = `已质押 ${club.pledge.toLocaleString()} USDT`;
        } else {
            pledgeCell.className = 'unpledged-cell';
            pledgeCell.textContent = '未质押';
        }
        
        // 创建操作单元格
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        
        // 编辑按钮
        const editLink = document.createElement('a');
        editLink.href = `edit-club.html?id=${club.id}`;
        editLink.className = 'btn-icon btn-edit';
        editLink.title = '编辑';
        const editIcon = document.createElement('i');
        editIcon.className = 'fas fa-edit';
        editLink.appendChild(editIcon);
        
        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('data-id', club.id);
        deleteBtn.className = 'btn-icon btn-delete';
        deleteBtn.title = '删除';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash-alt';
        deleteBtn.appendChild(deleteIcon);
        
        // 添加按钮到操作单元格
        actionsCell.appendChild(editLink);
        actionsCell.appendChild(deleteBtn);
        
        // 将所有单元格添加到行
        row.appendChild(logoCell);
        row.appendChild(nameCell);
        row.appendChild(platformCell);
        row.appendChild(levelCell);
        row.appendChild(pledgeCell);
        row.appendChild(actionsCell);
        
        // 将行添加到表格
        recentClubsList.appendChild(row);
    });
    
    // 重新绑定删除按钮事件
    setupDeleteButtons();
}

// 设置删除按钮的事件监听
function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const clubId = this.getAttribute('data-id');
            const clubName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`确定要删除 "${clubName}" 俱乐部吗？此操作不可撤销。`)) {
                // 从Firestore删除数据
                const db = firebase.firestore();
                db.collection('clubs').doc(clubId).delete()
                    .then(() => {
                        console.log('俱乐部已成功删除');
                        
                        // 从DOM中移除该行
                        this.closest('tr').remove();
                        
                        // 更新统计数据
                        const totalClubsElement = document.getElementById('totalClubs');
                        const pledgedClubsElement = document.getElementById('pledgedClubs');
                        
                        totalClubsElement.textContent = parseInt(totalClubsElement.textContent) - 1;
                        
                        // 如果删除的是已质押俱乐部，则更新已质押俱乐部数量
                        if (this.closest('tr').querySelector('.pledged-cell')) {
                            pledgedClubsElement.textContent = parseInt(pledgedClubsElement.textContent) - 1;
                        }
                    })
                    .catch((error) => {
                        console.error('删除俱乐部出错:', error);
                        alert('删除俱乐部失败: ' + error.message);
                    });
            }
        });
    });
}
