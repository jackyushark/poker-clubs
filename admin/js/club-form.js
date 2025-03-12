document.addEventListener('DOMContentLoaded', function() {
    // 检查Firebase是否已初始化
    if (!firebase || !firebase.firestore) {
        console.error('Firebase未正确初始化');
        showNotification('Firebase未正确初始化，无法保存数据', 'error');
        return;
    }
    
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // 表单元素相关的初始化
    const addClubForm = document.getElementById('addClubForm');
    const pledgeAmountInput = document.getElementById('pledgeAmount');
    const allDayCheckbox = document.getElementById('allDay');
    const timeInputs = document.querySelectorAll('#startTime, #endTime');
    const clubLogoInput = document.getElementById('clubLogo');
    const logoPreview = document.getElementById('logoPreview');
    
    console.log('DOM加载完成，找到质押金额输入框:', pledgeAmountInput ? '是' : '否');
    
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
    const pledgedTrue = document.getElementById('pledgedTrue');
    const pledgedFalse = document.getElementById('pledgedFalse');
    
    // 使用ID选择器直接为单选按钮添加事件
    if (pledgedTrue && pledgedFalse && pledgeAmountInput) {
        console.log('找到所有质押相关元素，添加事件');
        
        // 为"已质押"单选按钮添加事件
        pledgedTrue.addEventListener('click', function() {
            console.log('选择了已质押');
            pledgeAmountInput.disabled = false;
            pledgeAmountInput.required = true;
        });
        
        // 为"未质押"单选按钮添加事件
        pledgedFalse.addEventListener('click', function() {
            console.log('选择了未质押');
            pledgeAmountInput.disabled = true;
            pledgeAmountInput.required = false;
            pledgeAmountInput.value = '';
        });
        
        // 确保初始状态正确
        if (pledgedTrue.checked) {
            pledgeAmountInput.disabled = false;
            pledgeAmountInput.required = true;
        } else {
            pledgeAmountInput.disabled = true;
            pledgeAmountInput.required = false;
        }
    } else {
        console.error('未找到质押相关元素', {
            pledgedTrue: !!pledgedTrue,
            pledgedFalse: !!pledgedFalse,
            pledgeAmountInput: !!pledgeAmountInput
        });
    }
    
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
        
        // 显示保存中提示
        showNotification('正在保存数据...', 'info');
        
        // 获取表单数据
        const formData = new FormData(this);
        const clubData = {
            name: formData.get('clubName'),
            platform: formData.get('platform'),
            level: formData.get('level'),
            status: formData.get('clubStatus'),
            isPledged: formData.get('isPledged') === 'true',
            pledge: formData.get('isPledged') === 'true' ? parseInt(formData.get('pledgeAmount')) : 0,
            slogan: formData.get('clubSlogan'),
            players: parseInt(formData.get('playerCount')) || 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 提取URL中的clubId参数以确定是编辑还是添加操作
        const urlParams = new URLSearchParams(window.location.search);
        const clubId = urlParams.get('id');
        
        // 处理Logo
        // 只有当用户实际上传了新的Logo，才更新logo字段
        if (logoBase64 && logoBase64.startsWith('data:image')) {
            clubData.logo = logoBase64;
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
        // 只有当用户实际上传了新的截图，才更新screenshots字段
        const validScreenshots = screenshotsData.filter(screenshot => screenshot && screenshot.url && screenshot.url.startsWith('data:image'));
        if (validScreenshots.length > 0) {
            clubData.screenshots = validScreenshots;
        }
        
        // 保存到Firestore
        let savePromise;
        
        if (clubId) {
            // 编辑现有俱乐部
            savePromise = db.collection('clubs').doc(clubId).update(clubData);
        } else {
            // 添加新俱乐部
            if (!clubData.sortOrder) {
                clubData.sortOrder = 0; // 对于新俱乐部，设置默认排序顺序
            }
            savePromise = db.collection('clubs').add(clubData);
        }
        
        savePromise
            .then(() => {
                showNotification('俱乐部数据保存成功！', 'success');
                setTimeout(() => {
                    window.location.href = 'clubs.html';
                }, 1500);
            })
            .catch(error => {
                console.error('保存俱乐部数据失败:', error);
                showNotification('保存失败：' + error.message, 'error');
            });
    });
    
    // 加载现有俱乐部数据（如果是编辑模式）
    const urlParams = new URLSearchParams(window.location.search);
    const clubId = urlParams.get('id');
    
    if (clubId) {
        // 如果是编辑模式，则从Firestore加载俱乐部数据
        showNotification('加载俱乐部数据...', 'info');
        
        db.collection('clubs').doc(clubId).get()
            .then(doc => {
                if (doc.exists) {
                    const club = doc.data();
                    loadClubData(club);
                    showNotification('数据加载成功', 'success');
                } else {
                    showNotification('找不到该俱乐部数据', 'error');
                    console.error('找不到ID为', clubId, '的俱乐部');
                }
            })
            .catch(error => {
                console.error('获取俱乐部数据出错:', error);
                showNotification('加载数据失败: ' + error.message, 'error');
            });
    }
});

// 从Firestore加载俱乐部数据到表单
function loadClubData(club) {
    document.getElementById('clubName').value = club.name || '';
    document.getElementById('platform').value = club.platform || '';
    document.getElementById('level').value = club.level || '';
    document.getElementById('clubStatus').value = club.status || 'available';
    document.getElementById('playerCount').value = club.players || '';
    document.getElementById('clubSlogan').value = club.slogan || '';
    
    // 设置是否质押
    const isPledgedTrue = document.querySelector('input[name="isPledged"][value="true"]');
    const isPledgedFalse = document.querySelector('input[name="isPledged"][value="false"]');
    if (club.isPledged) {
        isPledgedTrue.checked = true;
        document.getElementById('pledgeAmount').disabled = false;
        document.getElementById('pledgeAmount').value = club.pledge || '';
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
    if (club.logo) {
        logoBase64 = club.logo;
        document.getElementById('logoPreview').innerHTML = `<img src="${club.logo}" alt="Logo预览">`;
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
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 定时移除
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 这个全局函数用于直接从onclick事件处理质押金额输入框
function togglePledgeAmount(enable) {
    console.log('直接调用togglePledgeAmount函数:', enable);
    const pledgeAmountInput = document.getElementById('pledgeAmount');
    if (pledgeAmountInput) {
        pledgeAmountInput.disabled = !enable;
        if (!enable) {
            pledgeAmountInput.value = '';
        }
    } else {
        console.error('未找到质押金额输入框');
    }
}
