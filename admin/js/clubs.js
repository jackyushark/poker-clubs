document.addEventListener('DOMContentLoaded', function() {
    // 排序模式状态
    let sortMode = false;
    
    // 加载数据服务
    loadDataService().then(() => {
        // 加载俱乐部列表
        loadClubsList();
        
        // 设置搜索和筛选功能
        setupSearchAndFilters();
        
        // 设置排序功能
        setupSortingFeature();
        
        // 设置登出功能
        document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'login.html';
        });
    }).catch(error => {
        console.error('无法加载数据服务:', error);
        alert('无法加载数据服务，请稍后再试');
    });
    
    // 设置排序功能
    function setupSortingFeature() {
        const sortModeToggle = document.getElementById('sortModeToggle');
        const saveSortBtn = document.getElementById('saveSortBtn');
        const cancelSortBtn = document.getElementById('cancelSortBtn');
        
        if (sortModeToggle && saveSortBtn && cancelSortBtn) {
            // 切换排序模式
            sortModeToggle.addEventListener('click', toggleSortMode);
            
            // 保存排序
            saveSortBtn.addEventListener('click', saveSort);
            
            // 取消排序
            cancelSortBtn.addEventListener('click', cancelSort);
        }
    }
    
    // 切换排序模式
    function toggleSortMode() {
        sortMode = !sortMode;
        
        // 获取相关DOM元素
        const sortControls = document.querySelector('.sort-controls');
        const tableHeader = document.querySelector('.table-header-row');
        const sortModeToggle = document.getElementById('sortModeToggle');
        
        // 更新UI状态
        if (sortControls) sortControls.classList.toggle('active', sortMode);
        if (tableHeader) tableHeader.classList.toggle('sort-mode', sortMode);
        if (sortModeToggle) {
            sortModeToggle.textContent = sortMode ? '退出排序' : '管理排序';
            sortModeToggle.innerHTML = sortMode ? 
                '<i class="fas fa-times"></i> 退出排序' : 
                '<i class="fas fa-sort"></i> 管理排序';
            
            sortModeToggle.classList.toggle('btn-warning', sortMode);
            sortModeToggle.classList.toggle('btn-secondary', !sortMode);
        }
        
        // 重新加载俱乐部列表以反映排序模式
        loadClubsList();
    }
    
    // 保存排序
    function saveSort() {
        if (!window.PokerRadarDataService) {
            showNotification('数据服务不可用', 'error');
            return;
        }
        
        // 获取当前表格中的所有行的ID，按照显示顺序
        const rows = Array.from(document.querySelectorAll('#clubsList tr'));
        const orderedIds = rows.map(row => row.getAttribute('data-id'));
        
        // 调用数据服务保存排序
        const result = window.PokerRadarDataService.updateClubsOrder(orderedIds);
        
        if (result) {
            // 退出排序模式
            toggleSortMode();
            showNotification('排序已保存', 'success');
        } else {
            showNotification('保存排序失败', 'error');
        }
    }
    
    // 取消排序
    function cancelSort() {
        // 退出排序模式
        toggleSortMode();
        showNotification('已取消排序', 'info');
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 定时移除
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // 拖拽相关变量
    let draggedItem = null;
    
    // 拖拽开始
    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    // 拖拽经过
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    // 拖拽进入
    function handleDragEnter(e) {
        this.classList.add('dragover');
    }
    
    // 拖拽离开
    function handleDragLeave(e) {
        this.classList.remove('dragover');
    }
    
    // 放置
    function handleDrop(e) {
        e.stopPropagation();
        
        if (draggedItem !== this) {
            const allItems = Array.from(document.querySelectorAll('#clubsList tr'));
            const draggedIndex = allItems.indexOf(draggedItem);
            const targetIndex = allItems.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                this.parentNode.insertBefore(draggedItem, this.nextSibling);
            } else {
                this.parentNode.insertBefore(draggedItem, this);
            }
            
            updateSortOrderNumbers();
        }
        
        this.classList.remove('dragover');
        return false;
    }
    
    // 拖拽结束
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        updateSortOrderNumbers();
    }
    
    // 更新排序序号
    function updateSortOrderNumbers() {
        const rows = Array.from(document.querySelectorAll('#clubsList tr'));
        
        rows.forEach((row, index) => {
            const sortOrderEl = row.querySelector('.sort-order');
            if (sortOrderEl) {
                sortOrderEl.textContent = `#${index + 1}`;
            }
        });
    }
    
    // 加载数据服务
    function loadDataService() {
        return new Promise((resolve, reject) => {
            if (window.PokerRadarDataService) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'js/data-service.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 加载俱乐部列表
    function loadClubsList() {
        if (!window.PokerRadarDataService) {
            console.error('数据服务不可用');
            return;
        }
        
        const clubs = window.PokerRadarDataService.getAllClubs();
        const clubsListBody = document.getElementById('clubsList');
        
        // 清空现有列表
        clubsListBody.innerHTML = '';
        
        // 生成俱乐部行
        clubs.forEach(club => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', club.id);
            
            if (sortMode) {
                // 排序模式下的行内容
                row.innerHTML = `
                    <td>
                        <div class="sort-handle"><i class="fas fa-grip-vertical"></i></div>
                        <img src="${club.logoUrl}" alt="${club.name}" class="club-logo-small">
                    </td>
                    <td>${club.name}</td>
                    <td>${club.platform}</td>
                    <td>${club.level}</td>
                    <td>${club.operationTime}</td>
                    <td class="${club.isPledged ? 'pledged-cell' : 'unpledged-cell'}">
                        ${club.isPledged ? `${club.pledgeAmount} USDT` : '未质押'}
                    </td>
                    <td class="sort-order">#${club.sortOrder || 0}</td>
                `;
                
                // 设置为可拖拽
                row.draggable = true;
                row.addEventListener('dragstart', handleDragStart);
                row.addEventListener('dragover', handleDragOver);
                row.addEventListener('dragenter', handleDragEnter);
                row.addEventListener('dragleave', handleDragLeave);
                row.addEventListener('drop', handleDrop);
                row.addEventListener('dragend', handleDragEnd);
                
            } else {
                // 普通模式下的行内容
                row.innerHTML = `
                    <td><img src="${club.logoUrl}" alt="${club.name}" class="club-logo-small"></td>
                    <td>${club.name}</td>
                    <td>${club.platform}</td>
                    <td>${club.level}</td>
                    <td>${club.operationTime}</td>
                    <td class="${club.isPledged ? 'pledged-cell' : 'unpledged-cell'}">
                        ${club.isPledged ? `${club.pledgeAmount} USDT` : '未质押'}
                    </td>
                    <td>${club.playerCount}</td>
                    <td class="actions-cell">
                        <a href="edit-club.html?id=${club.id}" class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i> 编辑
                        </a>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${club.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
            }
            
            // 添加到列表
            clubsListBody.appendChild(row);
        });
        
        // 不在排序模式下才设置删除按钮的事件监听
        if (!sortMode) {
            setupDeleteButtons();
        }
    }

    // 设置删除按钮的事件监听
    function setupDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.btn-delete');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const clubId = this.getAttribute('data-id');
                const clubName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
                
                if (confirm(`确定要删除 "${clubName}" 俱乐部吗？此操作不可撤销。`)) {
                    // 使用数据服务删除俱乐部
                    if (window.PokerRadarDataService && window.PokerRadarDataService.deleteClub(clubId)) {
                        // 从DOM中移除该行
                        this.closest('tr').remove();
                        showNotification(`已删除俱乐部 "${clubName}"`, 'success');
                    } else {
                        showNotification('删除失败，请稍后再试', 'error');
                    }
                }
            });
        });
    }

    // 设置搜索和筛选功能
    function setupSearchAndFilters() {
        const searchInput = document.getElementById('clubSearch');
        const platformFilter = document.getElementById('platformFilter');
        const pledgeFilter = document.getElementById('pledgeFilter');
        
        // 组合所有筛选条件进行筛选
        function filterClubs() {
            const searchTerm = searchInput.value.toLowerCase();
            const platformValue = platformFilter.value;
            const pledgeValue = pledgeFilter.value;
            
            const rows = document.querySelectorAll('#clubsList tr');
            
            rows.forEach(row => {
                const clubName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const platform = row.querySelector('td:nth-child(3)').textContent;
                const isPledged = row.querySelector('td:nth-child(6)').classList.contains('pledged-cell');
                
                // 应用搜索条件
                const matchesSearch = searchTerm === '' || clubName.includes(searchTerm);
                
                // 应用平台筛选
                const matchesPlatform = platformValue === '' || platform === platformValue;
                
                // 应用质押状态筛选
                let matchesPledge = true;
                if (pledgeValue === 'pledged') {
                    matchesPledge = isPledged;
                } else if (pledgeValue === 'unpledged') {
                    matchesPledge = !isPledged;
                }
                
                // 只有满足所有条件的才显示
                if (matchesSearch && matchesPlatform && matchesPledge) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // 添加事件监听器
        searchInput.addEventListener('input', filterClubs);
        platformFilter.addEventListener('change', filterClubs);
        pledgeFilter.addEventListener('change', filterClubs);
        
        // 添加平台选项
        if (window.PokerRadarDataService) {
            const clubs = window.PokerRadarDataService.getAllClubs();
            const platforms = new Set();
            
            clubs.forEach(club => platforms.add(club.platform));
            
            // 清空现有选项（保留"全部"选项）
            while (platformFilter.options.length > 1) {
                platformFilter.remove(1);
            }
            
            // 添加新选项
            platforms.forEach(platform => {
                const option = document.createElement('option');
                option.value = platform;
                option.textContent = platform;
                platformFilter.appendChild(option);
            });
        }
    }
});
