// script.js - 核心逻辑文件（Vercel部署优化版）

// 全局变量
let messages = [];
let systemPrompt = '';
let isProcessing = false;

// DOM 元素引用
const systemPromptEl = document.getElementById('systemPrompt');
const savePromptBtn = document.getElementById('savePromptBtn');
const loadDefaultBtn = document.getElementById('loadDefaultBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const chatMessagesEl = document.getElementById('chatMessages');
const userInputEl = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const formatBtn = document.getElementById('formatBtn');
const quickSceneBtn = document.getElementById('quickSceneBtn');
const typingIndicator = document.getElementById('typingIndicator');
const currentModeEl = document.getElementById('currentMode');
const messageCountEl = document.getElementById('messageCount');

// 默认系统指令（谢屿·终极系统提示词的简化核心版，用于快速加载）
const DEFAULT_SYSTEM_PROMPT = `你扮演谢屿，一个具有淡漠神性与非人秩序感的存在。你的语言必须简洁、直接、必然，禁止比喻、诗歌化、具体数字和情感形容词。所有描写限于孙雪婷可观察的外在。你根据场景在俱乐部主宰、职场神像、私人风暴三张面具间严格切换。

【核心禁令】
1. 视角铁律：仅描写孙雪婷可观察的外在（动作、神态、环境变化）。
2. 语言铁律：语言简洁直接，禁用比喻、诗歌化、具体数字、情感形容词。
3. 人称铁律：所有旁白以"他"或"谢屿"开头。
4. 模式隔离：禁止在不同场景泄露不属于该模式的特质。

现在，开始。`;

// 初始化
function init() {
    loadFromLocalStorage();
    updateUI();
    setupEventListeners();
    displayWelcomeMessage();
}

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedPrompt = localStorage.getItem('xieyu_systemPrompt');
    const savedMessages = localStorage.getItem('xieyu_messages');
    
    if (savedPrompt) {
        systemPrompt = savedPrompt;
        systemPromptEl.value = systemPrompt;
    }
    
    if (savedMessages) {
        try {
            messages = JSON.parse(savedMessages);
            displayMessages();
        } catch (e) {
            console.error('解析消息历史失败:', e);
            messages = [];
        }
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    try {
        localStorage.setItem('xieyu_systemPrompt', systemPrompt);
        // 只保存最近50条消息，避免本地存储过大
        const messagesToSave = messages.slice(-50);
        localStorage.setItem('xieyu_messages', JSON.stringify(messagesToSave));
    } catch (e) {
        console.error('保存到本地存储失败:', e);
        showTemporaryMessage('保存对话历史失败，本地存储可能已满。', 'error');
    }
}

// 更新UI状态
function updateUI() {
    messageCountEl.textContent = messages.length;
    
    // 简单推断当前模式（基于最后一条消息内容）
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant') {
            const content = lastMsg.content.toLowerCase();
            if (content.includes('俱乐部') || content.includes('主宰') || content.includes('呼吸') || content.includes('银铐') || content.includes('冰盘')) {
                currentModeEl.textContent = '俱乐部主宰';
                currentModeEl.style.color = '#6c8eff';
            } else if (content.includes('职场') || content.includes('公司') || content.includes('谢总') || content.includes('经理') || content.includes('项目')) {
                currentModeEl.textContent = '职场神像';
                currentModeEl.style.color = '#4CAF50';
            } else if (content.includes('风暴') || content.includes('空') || content.includes('私人') || content.includes('家') || content.includes('静室')) {
                currentModeEl.textContent = '私人风暴';
                currentModeEl.style.color = '#FF6B6B';
            } else {
                currentModeEl.textContent = '待识别';
                currentModeEl.style.color = '#aaa';
            }
        }
    } else {
        currentModeEl.textContent = '未设定';
        currentModeEl.style.color = '#aaa';
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 保存系统指令
    savePromptBtn.addEventListener('click', () => {
        systemPrompt = systemPromptEl.value.trim();
        if (!systemPrompt) {
            showTemporaryMessage('请输入系统指令！', 'error');
            return;
        }
        
        // 清除历史消息，重新开始
        messages = [];
        saveToLocalStorage();
        displayMessages();
        updateUI();
        
        // 显示成功提示
        showTemporaryMessage('系统指令已保存并生效，对话历史已重置。', 'success');
    });
    
    // 加载默认指令
    loadDefaultBtn.addEventListener('click', () => {
        if (confirm('这将覆盖当前的系统指令，确定要加载默认指令吗？')) {
            systemPromptEl.value = DEFAULT_SYSTEM_PROMPT;
            showTemporaryMessage('默认指令已加载到编辑框，请点击"保存并重置对话"以生效。', 'info');
        }
    });
    
    // 清除对话历史
    clearChatBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有对话历史吗？此操作不可撤销。')) {
            messages = [];
            saveToLocalStorage();
            displayMessages();
            updateUI();
            showTemporaryMessage('对话历史已清除。', 'success');
        }
    });
    
    // 发送消息
    sendBtn.addEventListener('click', sendMessage);
    userInputEl.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 自动调整输入框高度
    userInputEl.addEventListener('input', () => {
        userInputEl.style.height = 'auto';
        userInputEl.style.height = (userInputEl.scrollHeight) + 'px';
    });
    
    // 格式化输入（添加括号）
    formatBtn.addEventListener('click', () => {
        const text = userInputEl.value.trim();
        if (!text) return;
        
        // 如果文本没有被括号包裹，则添加
        if (!text.startsWith('（') && !text.startsWith('(') && 
            !text.endsWith('）') && !text.endsWith(')')) {
            userInputEl.value = `（${text}）`;
        }
        
        userInputEl.focus();
        showTemporaryMessage('已为输入添加括号。', 'info');
    });
    
    // 快速场景提示
    quickSceneBtn.addEventListener('click', () => {
        const scenes = [
            '俱乐部初遇：深夜的俱乐部，灯光昏暗。新来的客人孙雪婷坐在角落，她的目光穿过人群，无声地落在了你身上。',
            '职场汇报：周一上午，你的办公室。孙雪婷作为新项目经理，正在向你汇报季度数据。',
            '静室测试：他带你进入一间绝对安静的静室。空气中只有冰融化时细微的嗞嗞声。',
            '车库对峙：深夜，公司地下车库。她跟着你到了车旁，空气骤然降温。',
            '私人领域：在他的家中，他允许你进入书房。这里充斥着旧书、威士忌和未完成的设计图气息。'
        ];
        
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
        userInputEl.value = randomScene;
        userInputEl.focus();
        userInputEl.style.height = 'auto';
        userInputEl.style.height = (userInputEl.scrollHeight) + 'px';
        showTemporaryMessage('随机场景已插入。', 'info');
    });
}

// 显示欢迎消息
function displayWelcomeMessage() {
    if (messages.length === 0) {
        // 欢迎消息已在HTML中硬编码，无需额外显示
    }
}

// 显示所有消息
function displayMessages() {
    chatMessagesEl.innerHTML = '';
    
    if (messages.length === 0) {
        // 显示内置的欢迎消息（来自HTML）
        const welcomeMsg = document.querySelector('.welcome-msg');
        if (welcomeMsg) {
            chatMessagesEl.appendChild(welcomeMsg.cloneNode(true));
        }
        return;
    }
    
    messages.forEach(msg => {
        const messageEl = createMessageElement(msg);
        chatMessagesEl.appendChild(messageEl);
    });
    
    // 滚动到底部
    scrollToBottom();
}

// 创建消息元素
function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 处理内容中的换行和基本格式
    let formattedContent = msg.content
        .replace(/\n/g, '<br>')
        .replace(/（/g, '<span class="bracket">（')
        .replace(/）/g, '）</span>');
    
    // 高亮谢屿的名字
    formattedContent = formattedContent.replace(/谢屿/g, '<span class="name-highlight">谢屿</span>');
    
    contentDiv.innerHTML = formattedContent;
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

// 发送消息
async function sendMessage() {
    const userInput = userInputEl.value.trim();
    
    if (!userInput) {
        showTemporaryMessage('请输入消息！', 'error');
        return;
    }
    
    if (!systemPrompt) {
        showTemporaryMessage('请先设置并保存系统指令！', 'error');
        return;
    }
    
    if (isProcessing) {
        showTemporaryMessage('请等待上一条消息处理完成。', 'warning');
        return;
    }
    
    // 添加用户消息
    const userMessage = {
        role: 'user',
        content: userInput,
        timestamp: new Date().toISOString()
    };
    
    messages.push(userMessage);
    displayMessages();
    updateUI();
    
    // 清空输入框并重置高度
    userInputEl.value = '';
    userInputEl.style.height = 'auto';
    
    // 显示正在输入指示器
    showTypingIndicator(true);
    isProcessing = true;
    
    // 禁用发送按钮
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中';
    
    try {
        // 准备API请求
        const requestMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.role, content: msg.content }))
        ];
        
        const response = await callDeepSeekAPI(requestMessages);
        
        // 添加助手回复
        const assistantMessage = {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
        };
        
        messages.push(assistantMessage);
        displayMessages();
        updateUI();
        
        // 保存到本地存储
        saveToLocalStorage();
        
    } catch (error) {
        console.error('API调用错误:', error);
        
        // 显示错误消息
        const errorMessage = {
            role: 'assistant',
            content: `（系统错误：${error.message || 'API请求失败'}。请检查API密钥配置和网络连接。）`,
            timestamp: new Date().toISOString()
        };
        
        messages.push(errorMessage);
        displayMessages();
        updateUI();
        
        // 保存错误状态
        saveToLocalStorage();
        
    } finally {
        // 隐藏正在输入指示器
        showTypingIndicator(false);
        isProcessing = false;
        
        // 重新启用发送按钮
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送';
        
        // 聚焦到输入框
        userInputEl.focus();
    }
}

// 调用DeepSeek API
async function callDeepSeekAPI(messages) {
    // 检查API密钥 - 修改为适应Vercel环境变量
    let apiKey = '';
    
    // 首先尝试从全局变量获取（config.js中定义的API_KEY）
    if (typeof API_KEY !== 'undefined' && API_KEY) {
        apiKey = API_KEY;
    }
    
    // 如果全局变量中没有，尝试从环境变量读取（在Vercel部署中有效）
    if (!apiKey && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
    }
    
    // 如果还没有API密钥，则抛出错误
    if (!apiKey || apiKey === '') {
        throw new Error('API密钥未配置。请在Vercel项目设置的环境变量中添加API_KEY。');
    }
    
    // 从全局配置获取其他参数
    const apiBaseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://api.deepseek.com/v1';
    const modelName = typeof MODEL_NAME !== 'undefined' ? MODEL_NAME : 'deepseek-chat';
    const maxTokens = typeof MAX_TOKENS !== 'undefined' ? MAX_TOKENS : 4096;
    
    const requestBody = {
        model: modelName,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
    };
    
    try {
        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorText = errorJson.error.message;
                }
            } catch (e) {
                // 如果无法解析为JSON，使用原始文本
            }
            
            throw new Error(`API请求失败 (${response.status}): ${errorText || '未知错误'}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('API返回了空响应');
        }
        
    } catch (error) {
        console.error('API调用失败:', error);
        // 重新抛出错误，让上层处理
        throw error;
    }
}

// 显示/隐藏正在输入指示器
function showTypingIndicator(show) {
    if (show) {
        typingIndicator.style.display = 'flex';
    } else {
        typingIndicator.style.display = 'none';
    }
}

// 滚动到底部
function scrollToBottom() {
    // 使用requestAnimationFrame确保在DOM更新后滚动
    requestAnimationFrame(() => {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    });
}

// 显示临时消息提示
function showTemporaryMessage(text, type) {
    // 移除现有的临时消息
    const existingMsg = document.querySelector('.temporary-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // 创建新消息
    const msgDiv = document.createElement('div');
    msgDiv.className = `temporary-message ${type}`;
    msgDiv.textContent = text;
    
    // 根据类型设置颜色
    let bgColor, textColor;
    switch(type) {
        case 'success':
            bgColor = 'rgba(76, 175, 80, 0.9)';
            textColor = 'white';
            break;
        case 'error':
            bgColor = 'rgba(244, 67, 54, 0.9)';
            textColor = 'white';
            break;
        case 'warning':
            bgColor = 'rgba(255, 152, 0, 0.9)';
            textColor = 'white';
            break;
        case 'info':
        default:
            bgColor = 'rgba(33, 150, 243, 0.9)';
            textColor = 'white';
            break;
    }
    
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${textColor};
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: fadeInOut 3s ease-in-out;
        max-width: 300px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
    `;
    
    // 添加动画样式（如果不存在）
    if (!document.querySelector('#tempMsgStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'tempMsgStyles';
        styleSheet.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    document.body.appendChild(msgDiv);
    
    // 3秒后移除
    setTimeout(() => {
        if (msgDiv.parentNode) {
            msgDiv.remove();
        }
    }, 3000);
}

// 添加一些CSS样式到头部（如果不存在）
function addAdditionalStyles() {
    if (!document.querySelector('#additional-styles')) {
        const style = document.createElement('style');
        style.id = 'additional-styles';
        style.textContent = `
            .bracket {
                color: #aaa;
                font-weight: 300;
            }
            .name-highlight {
                color: #6c8eff;
                font-weight: bold;
            }
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .fa-spin {
                animation: fa-spin 1s infinite linear;
            }
            @keyframes fa-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    addAdditionalStyles();
    init();
});