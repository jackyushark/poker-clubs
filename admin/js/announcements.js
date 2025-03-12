/**
 * 公告管理模块 - 用于管理扑克雷达平台的滚动公告
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    if (typeof checkAuth === 'function') {
        checkAuth();
    }
    
    // 初始化数据
    initializeData();
    
    // 设置事件监听
    setupEventListeners();
});

// 当前选中的公告ID（用于编辑和删除操作）
let currentAnnouncementId = null;

// 初始化数据
function initializeData() {
    // 加载所有公告数据
    loadAnnouncements();
}

// 加载公告数据
function loadAnnouncements() {
    // 确保数据服务已加载
    if (!window.PokerRadarDataService) {
        console.error('数据服务未加载');
        return;
    }
    
    const announcements = window.PokerRadarDataService.getAllAnnouncements();
    renderAnnouncementsList(announcements);
}

// 渲染公告列表
function renderAnnouncementsList(announcements) {
    const tableBody = document.querySelector('#announcementsTable tbody');
    
    // 清空现有内容
    tableBody.innerHTML = '';
    
    if (announcements.length === 0) {
        // 如果没有公告，显示空状态
        tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无公告数据</td></tr>';
        return;
    }
    
    // 排序公告（最新更新的排在前面）
    announcements.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // 为每条公告创建一行
    announcements.forEach(announcement => {
        const row = document.createElement('tr');
        
        // 格式化更新时间
        const updatedDate = new Date(announcement.updatedAt);
        const formattedDate = updatedDate.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 获取公告预览文本（如果太长则截断）
        const previewText = announcement.text.length > 50 
            ? announcement.text.substring(0, 50) + '...' 
            : announcement.text;
        
        row.innerHTML = `
            <td title="${announcement.text}">${previewText}</td>
            <td>
                <span class="status-badge ${announcement.active ? 'active' : 'inactive'}">
                    ${announcement.active ? '激活' : '停用'}
                </span>
            </td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn-icon edit-btn" data-id="${announcement.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-btn" data-id="${announcement.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 为新添加的按钮绑定事件
    addRowButtonListeners();
}

// 为列表中的按钮添加事件监听
function addRowButtonListeners() {
    // 为编辑按钮添加事件
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const announcementId = this.getAttribute('data-id');
            openEditModal(announcementId);
        });
    });
    
    // 为删除按钮添加事件
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const announcementId = this.getAttribute('data-id');
            openDeleteModal(announcementId);
        });
    });
}

// 设置页面事件监听
function setupEventListeners() {
    // 新增公告按钮
    const addButton = document.getElementById('addAnnouncementBtn');
    if (addButton) {
        addButton.addEventListener('click', openAddModal);
    }
    
    // 公告表单提交
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 取消按钮（添加/编辑模态框）
    const cancelButton = document.getElementById('cancelAnnouncementBtn');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeModal);
    }
    
    // 关闭模态框的X按钮
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // 删除确认模态框按钮
    const cancelDeleteButton = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', closeModal);
    }
    
    const confirmDeleteButton = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', confirmDelete);
    }
}

// 打开添加公告模态框
function openAddModal() {
    // 重置表单
    document.getElementById('announcementForm').reset();
    document.getElementById('announcementId').value = '';
    currentAnnouncementId = null;
    
    // 设置模态框标题
    document.getElementById('modalTitle').textContent = '添加公告';
    
    // 显示模态框
    document.getElementById('announcementModal').style.display = 'block';
}

// 打开编辑公告模态框
function openEditModal(announcementId) {
    // 获取公告数据
    const announcement = window.PokerRadarDataService.getAnnouncementById(announcementId);
    
    if (!announcement) {
        console.error('找不到公告数据:', announcementId);
        return;
    }
    
    // 填充表单数据
    document.getElementById('announcementId').value = announcement.id;
    document.getElementById('announcementText').value = announcement.text;
    document.getElementById('announcementStatus').value = announcement.active.toString();
    
    currentAnnouncementId = announcementId;
    
    // 设置模态框标题
    document.getElementById('modalTitle').textContent = '编辑公告';
    
    // 显示模态框
    document.getElementById('announcementModal').style.display = 'block';
}

// 打开删除确认模态框
function openDeleteModal(announcementId) {
    currentAnnouncementId = announcementId;
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

// 确认删除公告
function confirmDelete() {
    if (!currentAnnouncementId) {
        console.error('没有选中要删除的公告');
        return;
    }
    
    // 调用数据服务删除公告
    const success = window.PokerRadarDataService.deleteAnnouncement(currentAnnouncementId);
    
    if (success) {
        // 重新加载公告列表
        loadAnnouncements();
        
        // 显示成功消息
        showNotification('删除成功', 'success');
    } else {
        // 显示错误消息
        showNotification('删除失败', 'error');
    }
    
    // 关闭模态框
    closeModal();
}

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const id = document.getElementById('announcementId').value;
    const text = document.getElementById('announcementText').value.trim();
    const active = document.getElementById('announcementStatus').value === 'true';
    
    if (!text) {
        showNotification('公告内容不能为空', 'error');
        return;
    }
    
    // 准备公告数据
    const announcementData = {
        text,
        active
    };
    
    let success;
    
    if (id) {
        // 更新现有公告
        announcementData.id = id;
        success = window.PokerRadarDataService.updateAnnouncement(announcementData);
    } else {
        // 添加新公告
        success = window.PokerRadarDataService.addAnnouncement(announcementData);
    }
    
    if (success) {
        // 重新加载公告列表
        loadAnnouncements();
        
        // 显示成功消息
        showNotification(id ? '编辑成功' : '添加成功', 'success');
        
        // 关闭模态框
        closeModal();
    } else {
        // 显示错误消息
        showNotification(id ? '编辑失败' : '添加失败', 'error');
    }
}

// 关闭所有模态框
function closeModal() {
    document.getElementById('announcementModal').style.display = 'none';
    document.getElementById('deleteConfirmModal').style.display = 'none';
    currentAnnouncementId = null;
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 将通知添加到页面
    document.body.appendChild(notification);
    
    // 添加显示类
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 一段时间后自动移除
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
