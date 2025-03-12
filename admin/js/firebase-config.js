/**
 * Firebase配置文件
 * 用于初始化Firebase及所有相关服务
 */

// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyCB4_vz7xQ6eWLK5FrGPKIQwE5BfIbHdKo",
    authDomain: "pokerradar-8b40a.firebaseapp.com",
    projectId: "pokerradar-8b40a",
    storageBucket: "pokerradar-8b40a.appspot.com",
    messagingSenderId: "271197653811",
    appId: "1:271197653811:web:8c4ba1cb00894d5f1e26ec",
    measurementId: "G-47WVDKN3VY"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);

// 导出Firebase服务实例
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// 为控制台日志添加前缀
const logPrefix = "[Firebase]";

// 简单日志功能
function logInfo(message) {
    console.log(`${logPrefix} ${message}`);
}

function logError(message, error) {
    console.error(`${logPrefix} ${message}`, error);
}

// 初始化日志
logInfo("Firebase初始化成功");
