/**
 * 俱乐部排序管理
 * 处理俱乐部前台显示顺序的设置
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const sortableList = document.getElementById('sortableClubsList');
    const resetOrderBtn = document.getElementById('resetOrderBtn');
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    
    // 拖拽相关变量
    let draggedItem = null;
    let clubsData = [];
    
    // 初始化
    function init() {
        loadClubs();
        setupEventListeners();
    }
    
    // 加载俱乐部列表
    function loadClubs() {
        clubsData = PokerRadarDataService.getAllClubs();
        renderClubsList();
    }
    
    // 渲染俱乐部排序列表
    function renderClubsList() {
        sortableList.innerHTML = '';
        
        clubsData.forEach(club => {
            const listItem = document.createElement('li');
            listItem.className = 'sortable-item';
            listItem.dataset.id = club.id;
            
            const pledgeStatusBadge = club.isPledged ? 
                `<span class="badge badge-gold">已质押 ${club.pledgeAmount} USDT</span>` : 
                `<span class="badge badge-red">未质押</span>`;
            
            listItem.innerHTML = `
                <div class="sortable-item-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <img src="${club.logoUrl || 'https://via.placeholder.com/120'}" alt="${club.name}" class="club-thumbnail">
                <div class="club-details">
                    <div class="club-name">${club.name}</div>
                    <div class="club-info">
                        ${club.platform} | ${club.level}
                        ${pledgeStatusBadge}
                    </div>
                </div>
                <div class="sort-order">#${club.sortOrder}</div>
            `;
            
            // 设置拖拽事件
            listItem.draggable = true;
            listItem.addEventListener('dragstart', handleDragStart);
            listItem.addEventListener('dragover', handleDragOver);
            listItem.addEventListener('dragenter', handleDragEnter);
            listItem.addEventListener('dragleave', handleDragLeave);
            listItem.addEventListener('drop', handleDrop);
            listItem.addEventListener('dragend', handleDragEnd);
            
            sortableList.appendChild(listItem);
        });
    }
    
    // 设置事件监听
    function setupEventListeners() {
        resetOrderBtn.addEventListener('click', resetOrder);
        saveOrderBtn.addEventListener('click', saveOrder);
    }
    
    // 重置排序
    function resetOrder() {
        // 按照ID排序
        clubsData.sort((a, b) => a.id.localeCompare(b.id));
        
        // 重新分配排序值
        clubsData.forEach((club, index) => {
            club.sortOrder = index + 1;
        });
        
        renderClubsList();
        
        showNotification('排序已重置', 'info');
    }
    
    // 保存排序
    function saveOrder() {
        // 获取当前列表中的所有项的ID顺序
        const orderedIds = Array.from(sortableList.children).map(item => item.dataset.id);
        
        // 调用数据服务保存排序
        const result = PokerRadarDataService.updateClubsOrder(orderedIds);
        
        if (result) {
            showNotification('排序已保存', 'success');
            // 重新加载数据以确保所有更改都已应用
            loadClubs();
        } else {
            showNotification('保存排序失败', 'error');
        }
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
    
    // 拖拽开始处理
    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        
        // 设置拖拽数据
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    // 拖拽经过处理
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    // 拖拽进入处理
    function handleDragEnter(e) {
        this.classList.add('dragover');
    }
    
    // 拖拽离开处理
    function handleDragLeave(e) {
        this.classList.remove('dragover');
    }
    
    // 放置处理
    function handleDrop(e) {
        e.stopPropagation();
        
        // 如果目标不是被拖拽的元素本身，则进行排序调整
        if (draggedItem !== this) {
            // 获取目标位置
            const allItems = Array.from(sortableList.children);
            const draggedIndex = allItems.indexOf(draggedItem);
            const targetIndex = allItems.indexOf(this);
            
            // 执行排序
            if (draggedIndex < targetIndex) {
                sortableList.insertBefore(draggedItem, this.nextSibling);
            } else {
                sortableList.insertBefore(draggedItem, this);
            }
            
            // 更新视觉提示
            updateSortOrderNumbers();
        }
        
        this.classList.remove('dragover');
        return false;
    }
    
    // 拖拽结束处理
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        
        // 更新所有项的排序号码
        updateSortOrderNumbers();
    }
    
    // 更新排序号码
    function updateSortOrderNumbers() {
        const allItems = Array.from(sortableList.children);
        
        allItems.forEach((item, index) => {
            const sortOrderEl = item.querySelector('.sort-order');
            if (sortOrderEl) {
                sortOrderEl.textContent = `#${index + 1}`;
            }
        });
    }
    
    // 初始化
    init();
});
