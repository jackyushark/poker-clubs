/**
 * 设备检测和页面重定向脚本
 * 扑克雷达 - Poker Radar
 * 创建日期: 2025-03-12
 */

// 在HTML文档完全加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检测设备类型并重定向到相应版本
    detectDeviceAndRedirect();
});

/**
 * 检测设备类型并重定向到相应版本
 */
function detectDeviceAndRedirect() {
    // 获取当前页面URL
    const currentUrl = window.location.href;
    
    // 检查URL是否已经包含移动版本标识
    const isMobilePage = currentUrl.includes('mobile=true') || currentUrl.includes('mobile.html');
    const isPcPage = currentUrl.includes('pc=true') || !currentUrl.includes('mobile');
    
    // 检测是否为移动设备
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // 当前页面路径
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath.endsWith('index.html');
    
    // 根据设备类型和当前页面决定是否需要重定向
    if (isHomePage) {
        if (isMobileDevice && !isMobilePage) {
            // 移动设备访问PC版本，重定向到移动版本
            window.location.href = 'mobile.html';
        } else if (!isMobileDevice && isMobilePage) {
            // PC设备访问移动版本，重定向到PC版本
            window.location.href = 'index.html?pc=true';
        }
    }
    
    // 为页面添加设备类标识，方便CSS针对性优化
    document.body.classList.add(isMobileDevice ? 'mobile-device' : 'desktop-device');
    
    // 记录设备信息到控制台，方便调试
    console.log('[设备检测] 当前设备: ' + (isMobileDevice ? '移动设备' : 'PC设备'));
    console.log('[设备检测] 当前页面: ' + (isMobilePage ? '移动版本' : 'PC版本'));
}
