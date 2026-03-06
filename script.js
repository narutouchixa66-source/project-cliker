// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyDtlzcdEs1ms2mjSyxjXoPP9F45hw9ASDc",
  authDomain: "project-f0996.firebaseapp.com",
  databaseURL: "https://project-f0996-default-rtdb.firebaseio.com",
  projectId: "project-f0996",
  storageBucket: "project-f0996.firebasestorage.app",
  messagingSenderId: "508381330122",
  appId: "1:508381330122:web:1db60b650088666fd31233",
  measurementId: "G-81WCXC67VB"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Глобальные переменные
let userData = {
    telegramId: 0,
    username: '',
    pBalance: 0,
    jBalance: 0,
    totalClicks: 0,
    chestsOpened: 0,
    referrals: [],
    referralEarnings: 0,
    adsWatched: 0,
    lastAdReset: Date.now()
};

let currentScreen = 'clicker';
let adCount = 0;

// Инициализация Telegram Web App
function initTelegramApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        userData.telegramId = tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000);
        userData.username = tg.initDataUnsafe.user?.username || 'Player' + userData.telegramId;
        
        // Обновляем имя пользователя в интерфейсе
        document.getElementById('user-name').textContent = userData.username;
        
        // Проверяем реферальный параметр
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('ref');
        if (referrerId && referrerId != userData.telegramId) {
            handleReferral(referrerId);
        }
    } else {
        // Демо режим для тестирования
        userData.telegramId = Math.floor(Math.random() * 1000000);
        userData.username = 'DemoUser';
        document.getElementById('user-name').textContent = userData.username;
    }
}

// Загрузка данных пользователя
function loadUserData() {
    const userRef = database.ref('users/' + userData.telegramId);
    
    userRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            userData = { ...userData, ...data };
        } else {
            // Новый пользователь - сохраняем базовые данные
            saveUserData();
        }
        
        updateUI();
        generateReferralLink();
    });
}

// Сохранение данных пользователя
function saveUserData() {
    database.ref('users/' + userData.telegramId).set(userData);
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('p-balance').textContent = Math.floor(userData.pBalance);
    document.getElementById('profile-p-balance').textContent = Math.floor(userData.pBalance) + ' ₽';
    document.getElementById('profile-j-balance').textContent = Math.floor(userData.jBalance) + ' Ж';
    document.getElementById('total-clicks').textContent = userData.totalClicks;
    document.getElementById('chests-opened').textContent = userData.chestsOpened;
    document.getElementById('referrals-count').textContent = userData.referrals.length;
    document.getElementById('referral-earnings').textContent = Math.floor(userData.referralEarnings) + ' ₽';
    
    // Обновляем счетчик рекламы
    const today = new Date().toDateString();
    const lastReset = new Date(userData.lastAdReset).toDateString();
    
    if (today !== lastReset) {
        userData.adsWatched = 0;
        userData.lastAdReset = Date.now();
        saveUserData();
    }
    
    adCount = userData.adsWatched;
    document.getElementById('ad-count').textContent = `${adCount}/3`;
}

// Генерация реферальной ссылки
function generateReferralLink() {
    const botUsername = 'project_clicker_bot'; // Замените на имя вашего бота
    const referralLink = `https://t.me/${botUsername}?start=${userData.telegramId}`;
    document.getElementById('referral-link').value = referralLink;
}

// Обработка реферала
function handleReferral(referrerId) {
    const referrerRef = database.ref('users/' + referrerId);
    
    referrerRef.once('value', (snapshot) => {
        const referrerData = snapshot.val();
        if (referrerData && !referrerData.referrals.includes(userData.telegramId)) {
            // Добавляем реферала
            referrerData.referrals.push(userData.telegramId);
            referrerData.jBalance += 500;
            referrerData.pBalance += 300;
            referrerData.referralEarnings += 300;
            
            // Сохраняем данные реферера
            database.ref('users/' + referrerId).set(referrerData);
            
            // Даем бонус новому пользователю
            userData.pBalance += 100; // Стартовый бонус
            saveUserData();
            
            showNotification('Вы получили стартовый бонус 100 ₽!');
        }
    });
}

// Навигация между экранами
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const screens = document.querySelectorAll('.screen');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreen = button.dataset.screen;
            
            // Убираем активный класс у всех кнопок и экранов
            navButtons.forEach(btn => btn.classList.remove('active'));
            screens.forEach(screen => screen.classList.remove('active'));
            
            // Добавляем активный класс
            button.classList.add('active');
            document.getElementById(targetScreen + '-screen').classList.add('active');
            
            currentScreen = targetScreen;
        });
    });
}

// Кликер механика
function initClicker() {
    const clickButton = document.getElementById('main-click');
    const floatingCoins = document.getElementById('floating-coins');
    
    clickButton.addEventListener('click', (e) => {
        // Увеличиваем баланс
        userData.pBalance += 1;
        userData.totalClicks += 1;
        saveUserData();
        updateUI();
        
        // Создаем анимацию монетки
        createFloatingCoin(e);
        
        // Анимация кнопки
        clickButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickButton.style.transform = 'scale(1)';
        }, 100);
    });
}

// Создание анимации монетки
function createFloatingCoin(e) {
    const floatingCoin = document.createElement('div');
    floatingCoin.className = 'floating-coin';
    floatingCoin.textContent = '+1 ₽';
    
    const rect = e.target.getBoundingClientRect();
    floatingCoin.style.left = (rect.left + rect.width / 2) + 'px';
    floatingCoin.style.top = rect.top + 'px';
    
    document.getElementById('floating-coins').appendChild(floatingCoin);
    
    setTimeout(() => {
        floatingCoin.remove();
    }, 1000);
}

// Система сундуков
function initChests() {
    const chestCards = document.querySelectorAll('.chest-card');
    
    chestCards.forEach(card => {
        card.addEventListener('click', () => {
            const rarity = card.dataset.rarity;
            openChest(rarity);
        });
    });
}

// Открытие сундука
function openChest(rarity) {
    const chestData = getChestData(rarity);
    
    if (userData.adsWatched < chestData.adsRequired) {
        showNotification(`Нужно посмотреть ${chestData.adsRequired} рекламы!`);
        return;
    }
    
    // Выбираем тип награды (50/50 шанс)
    const isPCoins = Math.random() < 0.5;
    let pReward = 0;
    let jReward = 0;
    
    if (isPCoins) {
        // Даем только P монеты
        pReward = Math.floor(Math.random() * (chestData.pMax - chestData.pMin + 1)) + chestData.pMin;
    } else {
        // Даем только J монеты
        jReward = Math.floor(Math.random() * (chestData.jMax - chestData.jMin + 1)) + chestData.jMin;
    }
    
    // Начисляем награды
    userData.pBalance += pReward;
    userData.jBalance += jReward;
    userData.chestsOpened += 1;
    userData.adsWatched -= chestData.adsRequired;
    
    saveUserData();
    updateUI();
    
    // Показываем модальное окно
    showChestModal(rarity, pReward, jReward);
}

// Получение данных сундука
function getChestData(rarity) {
    const chests = {
        rare: { adsRequired: 3, pMin: 100, pMax: 200, jMin: 10, jMax: 100, icon: '📦' },
        epic: { adsRequired: 6, pMin: 200, pMax: 300, jMin: 20, jMax: 150, icon: '🎁' },
        mythic: { adsRequired: 15, pMin: 500, pMax: 1000, jMin: 40, jMax: 700, icon: '💎' },
        legendary: { adsRequired: 20, pMin: 1000, pMax: 2000, jMin: 100, jMax: 1000, icon: '👑' },
        ultra: { adsRequired: 30, pMin: 0, pMax: 0, jMin: 300, jMax: 5000, icon: '🌟' }
    };
    
    return chests[rarity];
}

// Показ модального окна сундука
function showChestModal(rarity, pReward, jReward) {
    const modal = document.getElementById('chest-modal');
    const chestIcon = document.getElementById('chest-icon');
    const pRewardEl = document.getElementById('p-reward');
    const jRewardEl = document.getElementById('j-reward');
    const rewardTitle = document.querySelector('.reward-title');
    
    const chestData = getChestData(rarity);
    chestIcon.textContent = chestData.icon;
    pRewardEl.textContent = pReward;
    jRewardEl.textContent = jReward;
    
    // Показываем только одну награду
    if (pReward > 0) {
        rewardTitle.textContent = 'Получены P монеты!';
        pRewardEl.parentElement.style.display = 'flex';
        jRewardEl.parentElement.style.display = 'none';
    } else {
        rewardTitle.textContent = 'Получены J монеты!';
        pRewardEl.parentElement.style.display = 'none';
        jRewardEl.parentElement.style.display = 'flex';
    }
    
    modal.classList.add('active');
}

// Закрытие модального окна
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('chest-modal').classList.remove('active');
});

// Система рекламы
function initAds() {
    document.getElementById('watch-ad').addEventListener('click', () => {
        if (userData.adsWatched >= 50) { // Лимит в день
            showNotification('Лимит рекламы на сегодня исчерпан!');
            return;
        }
        
        // Имитация просмотра рекламы
        showNotification('Реклама загружается...');
        
        setTimeout(() => {
            userData.adsWatched += 1;
            saveUserData();
            updateUI();
            showNotification('Вы посмотрели рекламу! +1 к счетчику');
        }, 2000);
    });
}

// Реферальная система
function initReferral() {
    document.getElementById('copy-link').addEventListener('click', () => {
        const referralLink = document.getElementById('referral-link');
        referralLink.select();
        document.execCommand('copy');
        showNotification('Ссылка скопирована!');
    });
    
    document.getElementById('invite-friends').addEventListener('click', () => {
        const referralLink = document.getElementById('referral-link').value;
        
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Заработай со мной в Project!')}`);
        } else {
            navigator.clipboard.writeText(referralLink);
            showNotification('Ссылка скопирована в буфер обмена!');
        }
    });
}

// Система обмена
function initExchange() {
    document.getElementById('exchange-button').addEventListener('click', () => {
        if (userData.pBalance < 10000) {
            showNotification('Недостаточно P монет! Нужно 10000 ₽');
            return;
        }
        
        userData.pBalance -= 10000;
        userData.jBalance += 100;
        saveUserData();
        updateUI();
        showNotification('Обмен выполнен! +100 Ж');
    });
}

// Показ уведомлений
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        z-index: 2000;
        font-weight: bold;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Инициализация приложения
function initApp() {
    initTelegramApp();
    loadUserData();
    initNavigation();
    initClicker();
    initChests();
    initAds();
    initReferral();
    initExchange();
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Автосохранение каждые 30 секунд
setInterval(() => {
    saveUserData();
}, 30000);

// Обработка закрытия приложения
window.addEventListener('beforeunload', saveUserData);
