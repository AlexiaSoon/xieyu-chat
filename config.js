// config.js - 配置文件（Vercel版本）
// 注意：API密钥将通过Vercel的环境变量设置，不直接写在这里

// 从环境变量中读取API密钥，如果不存在则使用空字符串（部署后会由Vercel注入）
const API_KEY = process.env.API_KEY || '';

// API请求的基准URL
const API_BASE_URL = 'https://api.deepseek.com/v1';

// 使用的模型
const MODEL_NAME = 'deepseek-chat';

// 最大上下文长度
const MAX_TOKENS = 4096;

// 导出配置以便其他文件使用（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_KEY, API_BASE_URL, MODEL_NAME, MAX_TOKENS };
}