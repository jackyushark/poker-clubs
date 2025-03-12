document.addEventListener('DOMContentLoaded', function() {
    // 这里将来可以添加从服务器获取数据的代码
    // 目前使用模拟数据用于演示

    // 模拟数据统计
    updateDashboardStats({
        totalClubs: 4,
        pledgedClubs: 3,
        totalPlayers: 164
    });

    // 添加删除俱乐部的事件监听
    setupDeleteButtons();
});

// 更新仪表盘统计数据
function updateDashboardStats(stats) {
    document.getElementById('totalClubs').textContent = stats.totalClubs;
    document.getElementById('pledgedClubs').textContent = stats.pledgedClubs;
    document.getElementById('totalPlayers').textContent = stats.totalPlayers;
}

// 设置删除按钮的事件监听
function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const clubId = this.getAttribute('data-id');
            const clubName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`确定要删除 "${clubName}" 俱乐部吗？此操作不可撤销。`)) {
                // 这里应该添加实际的删除逻辑
                // 现在只是简单地从DOM中移除该行
                this.closest('tr').remove();
                
                // 更新统计数据
                const totalClubsElement = document.getElementById('totalClubs');
                const pledgedClubsElement = document.getElementById('pledgedClubs');
                
                totalClubsElement.textContent = parseInt(totalClubsElement.textContent) - 1;
                
                // 如果删除的是已质押俱乐部，则更新已质押俱乐部数量
                if (this.closest('tr').querySelector('.pledged-cell')) {
                    pledgedClubsElement.textContent = parseInt(pledgedClubsElement.textContent) - 1;
                }
            }
        });
    });
}
