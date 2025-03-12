/**
 * 设备检测和页面重定向脚本
 * 扑克雷达 - Poker Radar
 * 创建日期: 2025-03-12
 * 更新日期: 2025-03-13
 */

// 在HTML文档完全加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检测设备类型并重定向到相应版本
    detectDeviceAndRedirect();
});

/**
 * 强制设置显示模式 - 测试用
 * 可以在URL中添加参数强制显示移动版或PC版
 * 例如：?forceMode=mobile 或 ?forceMode=desktop
 */
function getForceDisplayMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('forceMode'); // 返回mobile或desktop或null
}

/**
 * 检测设备类型并重定向到相应版本
 */
function detectDeviceAndRedirect() {
    // 获取当前页面URL
    const currentUrl = window.location.href;
    
    // 检查是否已指定强制模式
    const forceMode = getForceDisplayMode();
    
    // 检查URL是否已经包含移动版本标识
    const isMobilePage = currentUrl.includes('mobile=true') || currentUrl.includes('mobile.html') || currentUrl.includes('mobile/');
    const isPcPage = currentUrl.includes('pc=true') || !currentUrl.includes('mobile');
    
    // 检测是否为移动设备 - 使用多重方法检测
    const uaIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const widthIsMobile = window.innerWidth <= 768;
    const isMobileDevice = forceMode === 'mobile' ? true : forceMode === 'desktop' ? false : (uaIsMobile || widthIsMobile);
    
    // 当前页面路径
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '' || currentPath.endsWith('/');
    
    // 调试信息 - 在控制台输出详细设备信息
    console.log('[DEBUG] 设备检测信息:');
    console.log('- UA判断是移动设备:', uaIsMobile);
    console.log('- 屏幕宽度判断是移动设备:', widthIsMobile, '(宽度:', window.innerWidth, 'px)');
    console.log('- 当前路径:', currentPath);
    console.log('- 是首页:', isHomePage);
    console.log('- 强制模式:', forceMode || '未设置');
    console.log('- 最终判断设备类型:', isMobileDevice ? '移动设备' : 'PC设备');
    console.log('- 当前网页类型:', isMobilePage ? '移动版' : 'PC版');
    
    // 根据设备类型和当前页面决定是否需要重定向
    // 判断是否需要重定向
    let needRedirect = false;
    let redirectUrl = '';
    
    if (isHomePage) {
        if (isMobileDevice && !isMobilePage) {
            // 移动设备访问PC版本，重定向到移动版本
            needRedirect = true;
            
            // 根据当前域名构建完整URL
            const baseUrl = window.location.protocol + '//' + window.location.host;
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            
            // 重定向到mobile文件夹中的index.html
            redirectUrl = baseUrl + basePath + 'mobile/index.html';
            
            console.log('[DEBUG] 重定向信息:');
            console.log('- 基础URL:', baseUrl);
            console.log('- 基础路径:', basePath);
            console.log('- 重定向目标:', redirectUrl);
            
            // 如果您想使用根目录下的mobile.html，取消下面的注释并注释上面的行
            // redirectUrl = baseUrl + basePath + 'mobile.html';
        } else if (!isMobileDevice && isMobilePage) {
            // PC设备访问移动版本，重定向到PC版本
            needRedirect = true;
            redirectUrl = window.location.href.replace(/\/mobile\//g, '/').replace(/mobile\.html/g, 'index.html') + (window.location.href.includes('?') ? '&pc=true' : '?pc=true');
        }
    }
    
    // 执行重定向
    if (needRedirect && redirectUrl) {
        console.log('[DEBUG] 执行重定向到:', redirectUrl);
        window.location.href = redirectUrl;
    } else {
        console.log('[DEBUG] 不需要重定向，当前页面与设备类型匹配');
    }
    
    // 为页面添加设备类标识，方便CSS针对性优化
    document.body.classList.add(isMobileDevice ? 'mobile-device' : 'desktop-device');
    
    // 添加可视化调试元素 - 只在包含调试参数时显示
    if (window.location.search.includes('debug=true')) {
        const debugElement = document.createElement('div');
        debugElement.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; z-index: 9999; font-size: 12px; font-family: monospace;';
        
        debugElement.innerHTML = `
            <div>设备检测调试信息:</div>
            <div>- UA判断: ${uaIsMobile ? '移动设备' : 'PC设备'}</div>
            <div>- 屏幕宽度: ${window.innerWidth}px (${widthIsMobile ? '移动尺寸' : 'PC尺寸'})</div>
            <div>- 强制模式: ${forceMode || '未设置'}</div>
            <div>- 当前路径: ${currentPath}</div>
            <div>- 最终判断: ${isMobileDevice ? '移动设备' : 'PC设备'} / ${isMobilePage ? '移动版页面' : 'PC版页面'}</div>
        `;
        
        document.body.appendChild(debugElement);
    }
    
    // 添加强制切换按钮
    if (window.location.search.includes('showSwitcher=true')) {
        const switcherElement = document.createElement('div');
        switcherElement.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border-radius: 5px; padding: 5px; z-index: 9999;';
        
        switcherElement.innerHTML = `
            <button onclick="window.location.href='?forceMode=mobile'" style="margin-right: 5px; padding: 5px 10px;">移动版</button>
            <button onclick="window.location.href='?forceMode=desktop'" style="padding: 5px 10px;">PC版</button>
        `;
        
        document.body.appendChild(switcherElement);
    }
}
