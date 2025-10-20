// Дополнительные функции для CareerFinder
class CareerFeatures {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('careerFinderNotifications')) || [];
        this.init();
    }

    init() {
        this.loadFeaturedVacancies();
        this.setupSearchSuggestions();
        this.updateNotificationCount();
        this.loadUserProfile();
        this.initChatBot();
    }

    // Загрузка популярных вакансий
    loadFeaturedVacancies() {
        const featuredVacancies = [
            {
                title: "Senior Frontend Developer (React)",
                company: "TechCorp",
                location: "Москва",
                type: "Полная занятость",
                salary: "от 200 000 ₽",
                description: "Разработка современных веб-приложений на React. Удалённая работа возможна.",
                tags: ["React", "TypeScript", "Redux"],
                featured: true,
                urgent: true
            },
            {
                title: "Data Scientist",
                company: "AIAnalytics",
                location: "Санкт-Петербург",
                type: "Полная занятость",
                salary: "от 250 000 ₽",
                description: "Разработка ML моделей для анализа больших данных.",
                tags: ["Python", "ML", "SQL", "TensorFlow"],
                featured: true,
                urgent: false
            },
            {
                title: "Product Manager",
                company: "StartupLab",
                location: "Удалённая работа",
                type: "Полная занятость",
                salary: "от 180 000 ₽",
                description: "Управление продуктом от исследования до запуска.",
                tags: ["Product", "Analytics", "Agile"],
                featured: true,
                urgent: true
            }
        ];

        const container = document.getElementById('featuredVacancies');
        if (container) {
            container.innerHTML = featuredVacancies.map(vacancy => `
                <div class="vacancy-card ${vacancy.featured ? 'featured' : ''} ${vacancy.urgent ? 'urgent' : ''}">
                    ${vacancy.urgent ? '<div class="urgent-badge">Срочно</div>' : ''}
                    <h3>${vacancy.title}</h3>
                    <div class="meta">${vacancy.company} • ${vacancy.location} • ${vacancy.type}</div>
                    <div class="salary">${vacancy.salary}</div>
                    <p>${vacancy.description}</p>
                    <div class="vacancy-tags">
                        ${vacancy.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="vacancy-actions">
                        <button class="btn" onclick="addToFavorites(this)">🤍 В избранное</button>
                        <button class="btn primary" onclick="openModal('applyModal')">Откликнуться</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Подсказки поиска
    setupSearchSuggestions() {
        const searchInput = document.getElementById('searchInput');
        const suggestions = document.getElementById('searchSuggestions');
        
        if (!searchInput || !suggestions) return;

        const popularSearches = [
            "Frontend разработчик",
            "Backend developer",
            "UX/UI дизайнер",
            "Data Scientist",
            "Product Manager",
            "DevOps engineer",
            "Маркетинг менеджер",
            "Аналитик данных"
        ];

        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            suggestions.innerHTML = '';

            if (value.length > 1) {
                const filtered = popularSearches.filter(search => 
                    search.toLowerCase().includes(value)
                );

                if (filtered.length > 0) {
                    suggestions.classList.add('show');
                    filtered.forEach(search => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.textContent = search;
                        div.onclick = () => {
                            searchInput.value = search;
                            suggestions.classList.remove('show');
                            searchJobs();
                        };
                        suggestions.appendChild(div);
                    });
                } else {
                    suggestions.classList.remove('show');
                }
            } else {
                suggestions.classList.remove('show');
            }
        });

        // Закрытие подсказок при клике вне
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.remove('show');
            }
        });
    }

    // Поиск по категории
    searchByCategory(category) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = category;
            searchJobs();
        }
    }

    // Управление уведомлениями
    addNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            date: new Date().toLocaleString(),
            read: false
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateNotificationCount();
        this.showNotification(notification);
    }

    showNotification(notification) {
        if (document.hidden) return; // Не показывать, если вкладка не активна

        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = `${notification.title}: ${notification.message}`;
            toast.className = `toast ${notification.type}`;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }

    updateNotificationCount() {
        const countElement = document.getElementById('notificationCount');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (countElement) {
            countElement.textContent = unreadCount;
            countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    saveNotifications() {
        localStorage.setItem('careerFinderNotifications', JSON.stringify(this.notifications));
    }

    // Загрузка профиля пользователя
    loadUserProfile() {
        const savedUser = localStorage.getItem('careerFinderCurrentUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.updateAvatar(user);
        }
    }

    updateAvatar(user) {
        const avatarImg = document.getElementById('avatarImg');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const profileAvatarImg = document.getElementById('profileAvatarImg');
        const profileAvatarPlaceholder = document.getElementById('profileAvatarPlaceholder');

        if (user.avatar) {
            if (avatarImg) {
                avatarImg.src = user.avatar;
                avatarImg.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            }
            if (profileAvatarImg) {
                profileAvatarImg.src = user.avatar;
                profileAvatarImg.style.display = 'block';
                profileAvatarPlaceholder.style.display = 'none';
            }
        }
    }

    // Загрузка аватара
    handleAvatarUpload(input) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarUrl = e.target.result;
                
                // Обновляем аватар в интерфейсе
                const avatarImg = document.getElementById('avatarImg');
                const avatarPlaceholder = document.getElementById('avatarPlaceholder');
                const profileAvatarImg = document.getElementById('profileAvatarImg');
                const profileAvatarPlaceholder = document.getElementById('profileAvatarPlaceholder');

                if (avatarImg) {
                    avatarImg.src = avatarUrl;
                    avatarImg.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                }
                if (profileAvatarImg) {
                    profileAvatarImg.src = avatarUrl;
                    profileAvatarImg.style.display = 'block';
                    profileAvatarPlaceholder.style.display = 'none';
                }

                // Сохраняем в профиль пользователя
                const savedUser = localStorage.getItem('careerFinderCurrentUser');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    user.avatar = avatarUrl;
                    localStorage.setItem('careerFinderCurrentUser', JSON.stringify(user));
                }

                showToast('Аватар успешно обновлён', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    // Чат-бот
    initChatBot() {
        this.chatMessages = [
            {
                question: "привет",
                answer: "Привет! Я ваш помощник по карьере. Могу помочь с поиском работы, составлением резюме или подготовкой к собеседованию."
            },
            {
                question: "резюме",
                answer: "Используйте наш конструктор резюме! Он поможет создать профессиональное резюме за несколько минут."
            },
            {
                question: "собеседование",
                answer: "Подготовьтесь к собеседованию с помощью наших тренировочных вопросов и советов от HR-специалистов."
            },
            {
                question: "зарплата",
                answer: "Посмотрите актуальные данные о зарплатах в разделе 'Анализ зарплат'. Мы обновляем информацию ежемесячно."
            }
        ];
    }

    handleChatInput(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(message, 'user');
            input.value = '';

            // Имитация ответа бота
            setTimeout(() => {
                this.generateBotResponse(message);
            }, 1000);
        }
    }

    addChatMessage(message, sender) {
        const chatBody = document.getElementById('chatBody');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
        
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    generateBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = "Извините, я не понял вопрос. Можете переформулировать?";

        for (const item of this.chatMessages) {
            if (lowerMessage.includes(item.question)) {
                response = item.answer;
                break;
            }
        }

        this.addChatMessage(response, 'bot');
    }

    // Генерация резюме
    generateResume() {
        const name = document.getElementById('profileName')?.value || 'Иван Иванов';
        const profession = document.getElementById('profileProfession')?.value || 'Frontend Developer';
        
        const resumeName = document.getElementById('resumeName');
        const resumeProfession = document.getElementById('resumeProfession');
        
        if (resumeName) resumeName.textContent = name;
        if (resumeProfession) resumeProfession.textContent = profession;
        
        showToast('Резюме сгенерировано!', 'success');
    }

    downloadResume() {
        showToast('Функция скачивания PDF будет доступна в ближайшее время', 'info');
    }

    // Тренировка с AI
    startAIPractice() {
        showToast('AI-тренировка запущена! Готовьтесь отвечать на вопросы.', 'success');
        // В реальном приложении здесь была бы интеграция с AI API
    }

    // Восстановление пароля
    resetPassword() {
        const email = document.getElementById('resetEmail').value;
        if (email) {
            showToast(`Инструкции по восстановлению отправлены на ${email}`, 'success');
            closeModal('forgotPasswordModal');
        } else {
            showToast('Введите email', 'error');
        }
    }
}

// Глобальные функции
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('show');
}

function toggleChat() {
    const chat = document.getElementById('chatWidget');
    chat.classList.toggle('open');
}

function searchByCategory(category) {
    careerFeatures.searchByCategory(category);
}

function handleAvatarUpload(input) {
    careerFeatures.handleAvatarUpload(input);
}

function handleChatInput(event) {
    careerFeatures.handleChatInput(event);
}

function sendMessage() {
    careerFeatures.sendMessage();
}

function generateResume() {
    careerFeatures.generateResume();
}

function downloadResume() {
    careerFeatures.downloadResume();
}

function startAIPractice() {
    careerFeatures.startAIPractice();
}

function resetPassword() {
    careerFeatures.resetPassword();
}

// Инициализация при загрузке
const careerFeatures = new CareerFeatures();