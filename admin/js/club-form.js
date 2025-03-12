document.addEventListener('DOMContentLoaded', function() {
    // 加载数据服务
    loadDataService().then(() => {
        // 表单元素相关的初始化
        const addClubForm = document.getElementById('addClubForm');
        const isPledgedRadios = document.querySelectorAll('input[name="isPledged"]');
        const pledgeAmountInput = document.getElementById('pledgeAmount');
        const allDayCheckbox = document.getElementById('allDay');
        const timeInputs = document.querySelectorAll('#startTime, #endTime');
        const clubLogoInput = document.getElementById('clubLogo');
        const logoPreview = document.getElementById('logoPreview');
        
        // 初始化截图相关元素
        const screenshotInputs = document.querySelectorAll('.screenshot-input');
        const screenshotPreviews = [
            document.getElementById('screenshotPreview1'),
            document.getElementById('screenshotPreview2'),
            document.getElementById('screenshotPreview3'),
            document.getElementById('screenshotPreview4')
        ];
        
        let logoBase64 = '';  // 存储图片的Base64数据
        let screenshotsData = []; // 存储截图的数据
        
        // 根据是否质押来启用/禁用质押金额输入框
        isPledgedRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'true') {
                    pledgeAmountInput.disabled = false;
                    pledgeAmountInput.required = true;
                } else {
                    pledgeAmountInput.disabled = true;
                    pledgeAmountInput.required = false;
                    pledgeAmountInput.value = '';
                }
            });
        });
        
        // 如果选择全天候，则禁用时间输入
        allDayCheckbox.addEventListener('change', function() {
            timeInputs.forEach(input => {
                input.disabled = this.checked;
                if (this.checked) {
                    input.value = '';
                }
            });
        });
        
        // Logo图片预览功能
        clubLogoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // 显示加载中状态
                logoPreview.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 20px; color: var(--text-gray);"></i><div style="margin-top: 5px; font-size: 12px; color: var(--text-gray);">处理中...</div></div>';
                
                // 图片压缩处理
                compressImage(file, 200, 200, 0.7).then(compressedImageData => {
                    logoBase64 = compressedImageData;
                    logoPreview.innerHTML = `<img src="${compressedImageData}" alt="Logo预览">`;
                }).catch(error => {
                    console.error("图片压缩失败", error);
                    // 图片压缩失败时，使用原始图片
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        logoBase64 = e.target.result;
                        logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo预览">`;
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
        
        // 设置截图预览功能
        screenshotInputs.forEach((input, index) => {
            input.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    const previewElement = screenshotPreviews[index];
                    const captionInput = document.getElementById(`screenshotCaption${index+1}`);
                    
                    // 显示加载中状态
                    previewElement.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin" style="font-size: 20px; color: var(--text-gray);"></i><div style="margin-top: 5px; font-size: 12px; color: var(--text-gray);">处理中...</div></div>';
                    
                    // 图片压缩处理 - 截图尺寸保持较大以确保质量
                    compressImage(file, 1280, 720, 0.85).then(compressedImageData => {
                        // 更新或添加截图数据
                        if (screenshotsData[index]) {
                            screenshotsData[index].url = compressedImageData;
                            if (captionInput.value) {
                                screenshotsData[index].caption = captionInput.value;
                            }
                        } else {
                            screenshotsData[index] = {
                                url: compressedImageData,
                                caption: captionInput.value || `游戏截图${index+1}`
                            };
                        }
                        
                        previewElement.innerHTML = `<img src="${compressedImageData}" alt="截图预览">`;
                    }).catch(error => {
                        console.error("截图压缩失败", error);
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            if (screenshotsData[index]) {
                                screenshotsData[index].url = e.target.result;
                                if (captionInput.value) {
                                    screenshotsData[index].caption = captionInput.value;
                                }
                            } else {
                                screenshotsData[index] = {
                                    url: e.target.result,
                                    caption: captionInput.value || `游戏截图${index+1}`
                                };
                            }
                            previewElement.innerHTML = `<img src="${e.target.result}" alt="截图预览">`;
                        };
                        reader.readAsDataURL(file);
                    });
                }
            });
            
            // 监听描述文本变化
            const captionInput = document.getElementById(`screenshotCaption${index+1}`);
            captionInput.addEventListener('change', function() {
                if (screenshotsData[index]) {
                    screenshotsData[index].caption = this.value || `游戏截图${index+1}`;
                }
            });
        });
        
        // 表单提交处理
        addClubForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(this);
            const clubData = {
                name: formData.get('clubName'),
                platform: formData.get('platform'),
                level: formData.get('level'),
                status: formData.get('clubStatus'),
                isPledged: formData.get('isPledged') === 'true',
                pledgeAmount: formData.get('isPledged') === 'true' ? parseInt(formData.get('pledgeAmount')) : 0,
                slogan: formData.get('clubSlogan'),
                playerCount: parseInt(formData.get('playerCount')) || 0
            };
            
            // 提取URL中的clubId参数以确定是编辑还是添加操作
            const urlParams = new URLSearchParams(window.location.search);
            const clubId = urlParams.get('id');
            
            // 处理Logo
            // 只有当用户实际上传了新的Logo，才更新logoUrl
            if (logoBase64) {
                clubData.logoUrl = logoBase64;
            } else if (clubId) {
                // 如果是编辑模式且没有上传新logo，尝试保留现有logo
                const existingClub = window.PokerRadarDataService.getClubById(clubId);
                if (existingClub && existingClub.logoUrl) {
                    clubData.logoUrl = existingClub.logoUrl;
                } else {
                    clubData.logoUrl = 'https://via.placeholder.com/120';
                }
            } else {
                clubData.logoUrl = 'https://via.placeholder.com/120';
            }
            
            // 获取支付方式
            const paymentMethods = [];
            document.querySelectorAll('input[name="paymentMethod"]:checked').forEach(checkbox => {
                paymentMethods.push(checkbox.value);
            });
            clubData.paymentMethods = paymentMethods;
            
            // 处理操作时间
            if (allDayCheckbox.checked) {
                clubData.operationTime = '全天候';
            } else {
                const startTime = formData.get('startTime');
                const endTime = formData.get('endTime');
                if (startTime && endTime) {
                    clubData.operationTime = `${startTime}-${endTime}`;
                } else {
                    clubData.operationTime = '请联系客服';
                }
            }
            
            // 处理截图数据
            if (clubId) {
                // 编辑模式：如果用户上传了新截图则更新，否则保留原有截图
                const existingClub = window.PokerRadarDataService.getClubById(clubId);
                
                // 检查是否有上传的新截图
                const hasNewScreenshots = screenshotsData.some(screenshot => screenshot && screenshot.url);
                
                if (hasNewScreenshots) {
                    // 如果用户上传了新截图，使用新的截图数据
                    clubData.screenshots = screenshotsData.filter(screenshot => screenshot && screenshot.url);
                } else if (existingClub && existingClub.screenshots && existingClub.screenshots.length > 0) {
                    // 如果没有上传新截图且原俱乐部有截图，保留原有截图
                    clubData.screenshots = existingClub.screenshots;
                }
            } else {
                // 添加模式：直接使用用户上传的截图
                if (screenshotsData.length > 0) {
                    clubData.screenshots = screenshotsData.filter(screenshot => screenshot && screenshot.url);
                }
            }
            
            let savePromise;
            
            if (clubId) {
                // 编辑现有俱乐部
                clubData.id = clubId;
                savePromise = window.PokerRadarDataService.updateClub(clubData);
            } else {
                // 添加新俱乐部
                savePromise = window.PokerRadarDataService.addClub(clubData);
            }
            
            savePromise.then(() => {
                showNotification('俱乐部数据保存成功！', 'success');
                setTimeout(() => {
                    window.location.href = 'clubs.html';
                }, 1500);
            }).catch(error => {
                console.error('保存俱乐部数据失败:', error);
                showNotification('保存失败，请重试！', 'error');
            });
        });
        
        // 加载现有俱乐部数据（如果是编辑模式）
        const urlParams = new URLSearchParams(window.location.search);
        const clubId = urlParams.get('id');
        
        if (clubId) {
            // 如果是编辑模式，则尝试从数据服务加载俱乐部数据
            if (window.PokerRadarDataService) {
                const club = window.PokerRadarDataService.getClubById(clubId);
                if (club) {
                    loadClubData(club);
                }
            }
        }
    }).catch(error => {
        console.error('加载数据服务失败:', error);
        showNotification('数据服务加载失败，部分功能可能不可用', 'error');
    });
});

// 加载数据服务
function loadDataService() {
    return new Promise((resolve, reject) => {
        if (window.PokerRadarDataService) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'js/data-service.js';
        
        script.onload = () => {
            if (window.PokerRadarDataService) {
                resolve();
            } else {
                reject(new Error('数据服务未正确加载'));
            }
        };
        
        script.onerror = (error) => {
            reject(error);
        };
        
        document.head.appendChild(script);
    });
}

// 从数据服务加载俱乐部数据到表单
function loadClubData(club) {
    document.getElementById('clubName').value = club.name || '';
    document.getElementById('platform').value = club.platform || '';
    document.getElementById('level').value = club.level || '';
    document.getElementById('clubStatus').value = club.status || 'available';
    document.getElementById('playerCount').value = club.playerCount || '';
    document.getElementById('clubSlogan').value = club.slogan || '';
    
    // 设置是否质押
    const isPledgedTrue = document.querySelector('input[name="isPledged"][value="true"]');
    const isPledgedFalse = document.querySelector('input[name="isPledged"][value="false"]');
    if (club.isPledged) {
        isPledgedTrue.checked = true;
        document.getElementById('pledgeAmount').disabled = false;
        document.getElementById('pledgeAmount').value = club.pledgeAmount || '';
    } else {
        isPledgedFalse.checked = true;
        document.getElementById('pledgeAmount').disabled = true;
    }
    
    // 设置支付方式
    if (club.paymentMethods && Array.isArray(club.paymentMethods)) {
        club.paymentMethods.forEach(method => {
            const checkbox = document.querySelector(`input[name="paymentMethod"][value="${method}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // 设置操作时间
    if (club.operationTime) {
        if (club.operationTime === '全天候') {
            document.getElementById('allDay').checked = true;
            document.getElementById('startTime').disabled = true;
            document.getElementById('endTime').disabled = true;
        } else {
            const times = club.operationTime.split('-');
            if (times.length === 2) {
                document.getElementById('startTime').value = times[0];
                document.getElementById('endTime').value = times[1];
            }
        }
    }
    
    // 处理Logo
    if (club.logoUrl) {
        logoBase64 = club.logoUrl;
        document.getElementById('logoPreview').innerHTML = `<img src="${club.logoUrl}" alt="Logo预览">`;
    }
    
    // 加载截图数据
    if (club.screenshots && Array.isArray(club.screenshots)) {
        screenshotsData = [...club.screenshots];
        
        club.screenshots.forEach((screenshot, index) => {
            if (index < 4) { // 最多显示4张
                document.getElementById(`screenshotPreview${index+1}`).innerHTML = 
                    `<img src="${screenshot.url}" alt="截图预览">`;
                document.getElementById(`screenshotCaption${index+1}`).value = screenshot.caption || '';
            }
        });
    }
    
    // 更新页面标题，指示这是编辑模式
    document.querySelector('.page-title').textContent = '编辑俱乐部';
}

// 图片压缩函数
function compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // 计算调整后的尺寸
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }
                
                // 创建Canvas元素进行绘制
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                // 绘制图片
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为Base64数据
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = function() {
                reject(new Error('图片加载失败'));
            };
            img.src = event.target.result;
        };
        reader.onerror = function() {
            reject(new Error('读取文件失败'));
        };
        reader.readAsDataURL(file);
    });
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 添加样式以显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 几秒后自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
