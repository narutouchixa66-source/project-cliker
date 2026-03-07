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
    lastAdReset: Date.now(),
    level: 1,
    experience: 0,
    autoClickers: 0,
    autoClickerPower: 0,
    lastDailyBonus: 0,
    lastHourlyBonus: 0,
    achievements: [],
    tournamentScore: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    clickPower: 1,
    multiplier: 1,
    lastOnline: Date.now(),
    premiumUntil: 0
};

let currentScreen = 'clicker';
let adCount = 0;
let tournamentData = null;
let globalStats = null;

// Система уровней
const LEVELS = [
    { level: 1, exp: 0, reward: 0, bonus: 0 },
    { level: 2, exp: 100, reward: 50, bonus: 1.1 },
    { level: 3, exp: 250, reward: 100, bonus: 1.2 },
    { level: 4, exp: 500, reward: 200, bonus: 1.3 },
    { level: 5, exp: 1000, reward: 500, bonus: 1.5 },
    { level: 10, exp: 5000, reward: 2000, bonus: 2 },
    { level: 20, exp: 25000, reward: 10000, bonus: 3 },
    { level: 50, exp: 150000, reward: 50000, bonus: 5 },
    { level: 100, exp: 1000000, reward: 500000, bonus: 10 }
];

// Достижения
const ACHIEVEMENTS = [
    { id: 'first_click', name: 'Первый клик', desc: 'Сделайте первый клик', reward: 10, type: 'p' },
    { id: 'clicks_100', name: 'Новичок', desc: '100 кликов', reward: 100, type: 'p' },
    { id: 'clicks_1000', name: 'Опытный', desc: '1000 кликов', reward: 1000, type: 'p' },
    { id: 'clicks_10000', name: 'Мастер', desc: '10000 кликов', reward: 5000, type: 'j' },
    { id: 'first_chest', name: 'Первый сундук', desc: 'Откройте первый сундук', reward: 50, type: 'p' },
    { id: 'chests_10', name: 'Коллекционер', desc: '10 сундуков', reward: 500, type: 'p' },
    { id: 'chests_100', name: 'Легенда', desc: '100 сундуков', reward: 2000, type: 'j' },
    { id: 'first_referral', name: 'Друг', desc: 'Пригласите друга', reward: 300, type: 'j' },
    { id: 'referrals_5', name: 'Популярный', desc: '5 друзей', reward: 1000, type: 'j' },
    { id: 'level_10', name: 'Герой', desc: 'Достигните 10 уровня', reward: 1000, type: 'j' },
    { id: 'level_50', name: 'Титан', desc: 'Достигните 50 уровня', reward: 10000, type: 'j' },
    { id: 'auto_clicker', name: 'Автоматизация', desc: 'Купите первый автокликер', reward: 100, type: 'p' },
    { id: 'daily_streak_7', name: 'Активность', desc: '7 дней подряд', reward: 500, type: 'j' },
    { id: 'tournament_winner', name: 'Чемпион', desc: 'Выиграйте турнир', reward: 5000, type: 'j' }
];

// Магазин улучшений
const SHOP_ITEMS = [
    { id: 'click_power_2', name: 'x2 Сила клика', cost: 1000, type: 'p', effect: { clickPower: 2 } },
    { id: 'click_power_3', name: 'x3 Сила клика', cost: 5000, type: 'p', effect: { clickPower: 3 } },
    { id: 'click_power_5', name: 'x5 Сила клика', cost: 20000, type: 'j', effect: { clickPower: 5 } },
    { id: 'auto_clicker_1', name: 'Автокликер 1', cost: 500, type: 'p', effect: { autoClickers: 1, autoClickerPower: 1 } },
    { id: 'auto_clicker_5', name: 'Автокликер 5', cost: 2000, type: 'p', effect: { autoClickers: 5, autoClickerPower: 1 } },
    { id: 'auto_clicker_10', name: 'Автокликер 10', cost: 10000, type: 'j', effect: { autoClickers: 10, autoClickerPower: 2 } },
    { id: 'multiplier_2', name: 'x2 Множитель', cost: 15000, type: 'j', effect: { multiplier: 2 } },
    { id: 'premium_day', name: 'Премиум на день', cost: 100, type: 'j', effect: { premium: 86400000 } }
];

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

// Обновление интерфейса с новыми элементами
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
    
    // Обновляем уровень и опыт
    if (document.getElementById('user-level')) {
        document.getElementById('user-level').textContent = `Уровень ${userData.level}`;
    }
    if (document.getElementById('user-exp')) {
        const nextLevel = LEVELS.find(l => l.level > userData.level) || LEVELS[LEVELS.length - 1];
        const expNeeded = nextLevel.exp - userData.experience;
        document.getElementById('user-exp').textContent = `${userData.experience}/${nextLevel.exp}`;
    }
    
    // Обновляем силу клика
    if (document.getElementById('click-power')) {
        const totalPower = (userData.clickPower || 1) * (userData.multiplier || 1);
        document.getElementById('click-power').textContent = `Сила: ${totalPower}₽`;
    }
}

// Проверка уровня и награды
function checkLevelUp() {
    const nextLevelData = LEVELS.find(l => l.level > userData.level);
    if (!nextLevelData) return;
    
    if (userData.experience >= nextLevelData.exp) {
        userData.level = nextLevelData.level;
        userData.pBalance += nextLevelData.reward;
        
        showNotification(`🎉 Уровень ${userData.level}! +${nextLevelData.reward} ₽`);
        
        // Проверяем следующий уровень
        checkLevelUp();
    }
}

// Проверка достижений
function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (userData.achievements.includes(achievement.id)) return;
        
        let unlocked = false;
        
        switch(achievement.id) {
            case 'first_click':
                unlocked = userData.totalClicks >= 1;
                break;
            case 'clicks_100':
                unlocked = userData.totalClicks >= 100;
                break;
            case 'clicks_1000':
                unlocked = userData.totalClicks >= 1000;
                break;
            case 'clicks_10000':
                unlocked = userData.totalClicks >= 10000;
                break;
            case 'first_chest':
                unlocked = userData.chestsOpened >= 1;
                break;
            case 'chests_10':
                unlocked = userData.chestsOpened >= 10;
                break;
            case 'chests_100':
                unlocked = userData.chestsOpened >= 100;
                break;
            case 'first_referral':
                unlocked = userData.referrals.length >= 1;
                break;
            case 'referrals_5':
                unlocked = userData.referrals.length >= 5;
                break;
            case 'level_10':
                unlocked = userData.level >= 10;
                break;
            case 'level_50':
                unlocked = userData.level >= 50;
                break;
            case 'auto_clicker':
                unlocked = userData.autoClickers >= 1;
                break;
        }
        
        if (unlocked) {
            userData.achievements.push(achievement.id);
            
            if (achievement.type === 'p') {
                userData.pBalance += achievement.reward;
                showNotification(`🏆 Достижение: ${achievement.name}! +${achievement.reward} ₽`);
            } else {
                userData.jBalance += achievement.reward;
                showNotification(`🏆 Достижение: ${achievement.name}! +${achievement.reward} Ж`);
            }
        }
    });
}

// Автокликеры
function startAutoClickers() {
    if (userData.autoClickers > 0) {
        setInterval(() => {
            const autoIncome = userData.autoClickers * (userData.autoClickerPower || 1);
            userData.pBalance += autoIncome;
            userData.totalEarned += autoIncome;
            updateUI();
            saveUserData();
        }, 1000); // Каждую секунду
    }
}

// Ежедневные бонусы
function checkDailyBonus() {
    const now = Date.now();
    const lastDaily = userData.lastDailyBonus || 0;
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastDaily >= dayInMs) {
        const bonus = 100 + (userData.level * 50);
        userData.pBalance += bonus;
        userData.lastDailyBonus = now;
        
        showNotification(`🎁 Ежедневный бонус! +${bonus} ₽`);
        updateUI();
    }
}

// Магазин улучшений
function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    const canAfford = item.type === 'p' ? 
        userData.pBalance >= item.cost : 
        userData.jBalance >= item.cost;
    
    if (!canAfford) {
        showNotification('Недостаточно средств!');
        return;
    }
    
    // Списываем стоимость
    if (item.type === 'p') {
        userData.pBalance -= item.cost;
    } else {
        userData.jBalance -= item.cost;
    }
    
    // Применяем эффект
    if (item.effect.clickPower) {
        userData.clickPower = item.effect.clickPower;
    }
    if (item.effect.autoClickers) {
        userData.autoClickers += item.effect.autoClickers;
        userData.autoClickerPower = item.effect.autoClickerPower;
        startAutoClickers();
    }
    if (item.effect.multiplier) {
        userData.multiplier = item.effect.multiplier;
    }
    if (item.effect.premium) {
        userData.premiumUntil = Date.now() + item.effect.premium;
    }
    
    showNotification(`Куплено: ${item.name}!`);
    saveUserData();
    updateUI();
}

// Вывод TON
function withdrawTON() {
    if (userData.jBalance < 100) {
        showNotification('Минимальный вывод 100 J = 0.001 TON!');
        return;
    }
    
    const tonAmount = (userData.jBalance / 100000) * 1; // 100000 J = 1 TON
    
    if (confirm(`Вывести ${tonAmount.toFixed(3)} TON?`)) {
        userData.jBalance = 0;
        userData.totalWithdrawn += tonAmount;
        
        // Здесь должна быть логика реального вывода TON
        showNotification(`Заявка на вывод ${tonAmount.toFixed(3)} TON отправлена!`);
        
        saveUserData();
        updateUI();
    }
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

// Кликер механика с улучшениями
function initClicker() {
    const clickButton = document.getElementById('main-click');
    const floatingCoins = document.getElementById('floating-coins');
    
    clickButton.addEventListener('click', (e) => {
        // Расчет силы клика с бонусами
        const baseClick = userData.clickPower || 1;
        const multiplier = userData.multiplier || 1;
        const levelBonus = userData.level > 1 ? 1 + (userData.level - 1) * 0.1 : 1;
        const finalClick = Math.floor(baseClick * multiplier * levelBonus);
        
        // Увеличиваем баланс и опыт
        userData.pBalance += finalClick;
        userData.totalClicks += 1;
        userData.experience += 1;
        userData.totalEarned += finalClick;
        
        // Проверяем уровень
        checkLevelUp();
        
        // Проверяем достижения
        checkAchievements();
        
        saveUserData();
        updateUI();
        
        // Создаем анимацию монетки
        createFloatingCoin(e, finalClick);
        
        // Анимация кнопки
        clickButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickButton.style.transform = 'scale(1)';
        }, 100);
    });
}

// Создание анимации монетки с настройкой
function createFloatingCoin(e, amount = 1) {
    const floatingCoin = document.createElement('div');
    floatingCoin.className = 'floating-coin';
    floatingCoin.textContent = `+${amount} ₽`;
    
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

// Инициализация бонусных кнопок
function initBonusButtons() {
    document.getElementById('daily-bonus')?.addEventListener('click', () => {
        checkDailyBonus();
    });
    
    document.getElementById('hourly-bonus')?.addEventListener('click', () => {
        checkHourlyBonus();
        
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

// Инициализация приложения с новыми системами
function initApp() {
    initTelegramApp();
    loadUserData();
    initNavigation();
    initClicker();
    initChests();
    initAds();
    initReferral();
    initExchange();
    initBonusButtons();
    initShop();
    initAchievements();
    
    // Запускаем новые системы
    startAutoClickers();
    checkDailyBonus();
    checkHourlyBonus();
    updateExperienceBar();
    
    // Проверяем бонусы каждые 30 секунд
    setInterval(() => {
        checkDailyBonus();
        checkHourlyBonus();
        updateExperienceBar();
        renderAchievements();
    }, 30000);
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Автосохранение каждые 30 секунд
setInterval(() => {
    saveUserData();
}, 30000);

// Обработка закрытия приложения
window.addEventListener('beforeunload', saveUserData);
