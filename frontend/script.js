// CareerFinder - Enhanced Main JavaScript
class CareerFinder {
    constructor() {
        this.currentUser = null;
        this.favorites = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setActiveNavLink();
        this.initSmoothScrolling();
        this.initializeCounters();
        this.checkAuthState();
        
        // Загрузка контента в зависимости от страницы
        const path = window.location.pathname;
        if (path.includes('vacancies.html')) {
            this.loadVacancies();
        } else if (path.includes('companies.html')) {
            this.loadCompanies();
        } else if (path.includes('events.html')) {
            this.loadEvents();
        } else if (path.includes('blog.html')) {
            this.loadBlogPosts();
        } else if (path.includes('index.html') || path === '/') {
            this.loadVacancies();
        }
    }

    setupEventListeners() {
        // Search forms
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        const vacancyFilters = document.getElementById('vacancyFilters');
        if (vacancyFilters) {
            vacancyFilters.addEventListener('submit', (e) => this.handleVacancySearch(e));
        }

        // Auth forms
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Global event listeners
        document.addEventListener('click', (e) => {
            // Favorite buttons
            if (e.target.closest('[data-favorite]')) {
                this.toggleFavorite(e.target.closest('[data-favorite]'));
            }
            
            // Apply buttons
            if (e.target.closest('[data-apply]')) {
                this.handleApplication(e.target.closest('[data-apply]'));
            }
            
            // Load more buttons
            if (e.target.closest('[data-load-more]')) {
                this.loadMoreContent(e.target.closest('[data-load-more]'));
            }
        });

        // Modal handlers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Form validation
        document.addEventListener('input', (e) => {
            if (e.target.type === 'email') {
                this.validateEmail(e.target);
            }
            if (e.target.type === 'password') {
                this.validatePassword(e.target);
            }
        });
    }

    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    initSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initializeCounters() {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            this.animateCounter(counter, target);
        });
    }

    animateCounter(element, target) {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString() + '+';
        }, 20);
    }

    async loadVacancies() {
        const container = document.getElementById('vacanciesContainer') || document.getElementById('vacanciesList');
        if (!container) return;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            const vacancies = this.getSampleVacancies();
            this.renderVacancies(container, vacancies);
        } catch (error) {
            console.error('Error loading vacancies:', error);
            this.showNotification('Ошибка при загрузке вакансий', 'error');
        }
    }

    getSampleVacancies() {
        return [
            {
                id: 1,
                title: 'Frontend Developer',
                company: 'TechCorp',
                location: 'Москва',
                type: 'Полная занятость',
                salary: 'от 150 000 ₽',
                description: 'Разработка пользовательских интерфейсов для веб-приложений. Требуется опыт работы с React.',
                tags: ['JavaScript', 'React', 'Vue.js'],
                featured: true,
                date: '2024-03-15'
            },
            {
                id: 2,
                title: 'Backend Developer',
                company: 'DataSoft',
                location: 'Санкт-Петербург',
                type: 'Удалённая работа',
                salary: 'от 180 000 ₽',
                description: 'Разработка серверной части приложений. Опыт с Node.js, Python Django.',
                tags: ['Node.js', 'Python', 'PostgreSQL'],
                featured: false,
                date: '2024-03-14'
            },
            {
                id: 3,
                title: 'UX/UI Designer',
                company: 'DesignStudio',
                location: 'Екатеринбург',
                type: 'Гибкий график',
                salary: 'от 120 000 ₽',
                description: 'Создание пользовательских интерфейсов и прототипов. Работа в Figma, Adobe XD.',
                tags: ['Figma', 'UI/UX', 'Prototyping'],
                featured: false,
                date: '2024-03-13'
            }
        ];
    }

    renderVacancies(container, vacancies) {
        container.innerHTML = vacancies.map(vacancy => `
            <div class="vacancy-card ${vacancy.featured ? 'featured' : ''}">
                <h3>${this.escapeHtml(vacancy.title)}</h3>
                <div class="meta">${this.escapeHtml(vacancy.company)} • ${this.escapeHtml(vacancy.location)} • ${this.escapeHtml(vacancy.type)}</div>
                <div class="salary">${this.escapeHtml(vacancy.salary)}</div>
                <p>${this.escapeHtml(vacancy.description)}</p>
                <div class="vacancy-tags">
                    ${vacancy.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="vacancy-actions">
                    <button class="btn btn-outline" data-favorite="${vacancy.id}">
                        ${this.favorites.has(vacancy.id) ? '❤️ В избранном' : '🤍 В избранное'}
                    </button>
                    <button class="btn btn-primary" data-apply="${vacancy.id}">Откликнуться</button>
                </div>
            </div>
        `).join('');
    }

    async handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const position = formData.get('position') || e.target.querySelector('input[type="text"]').value;
        const location = formData.get('location') || e.target.querySelectorAll('input[type="text"]')[1]?.value;

        if (!position && !location) {
            this.showNotification('Введите данные для поиска', 'warning');
            return;
        }

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        try {
            button.disabled = true;
            button.classList.add('loading');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showNotification(`Поиск: "${position}" в ${location || 'любом регионе'}`, 'info');
            
            // Redirect to vacancies page with search parameters
            const params = new URLSearchParams();
            if (position) params.set('q', position);
            if (location) params.set('location', location);
            
            window.location.href = `vacancies.html?${params.toString()}`;
            
        } catch (error) {
            this.showNotification('Ошибка при поиске', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = originalText;
        }
    }

    async handleVacancySearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const filters = Object.fromEntries(formData.entries());
        
        this.showNotification('Применены фильтры поиска', 'info');
        console.log('Search filters:', filters);
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!this.validateEmail({ value: email }) || !password) {
            this.showNotification('Пожалуйста, заполните все поля корректно', 'error');
            return;
        }

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        try {
            button.disabled = true;
            button.classList.add('loading');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock successful login
            this.currentUser = {
                name: 'Иван Иванов',
                email: email,
                profession: 'Frontend Developer'
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('Вход выполнен успешно!', 'success');
            this.closeModal('loginModal');
            this.updateUserUI();
            
        } catch (error) {
            this.showNotification('Ошибка при входе в систему', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = originalText;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const profession = formData.get('profession');

        if (!name || !this.validateEmail({ value: email }) || !this.validatePassword({ value: password }) || !profession) {
            this.showNotification('Пожалуйста, заполните все поля корректно', 'error');
            return;
        }

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        try {
            button.disabled = true;
            button.classList.add('loading');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock successful registration
            this.currentUser = { name, email, profession };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('Регистрация прошла успешно!', 'success');
            this.closeModal('registerModal');
            this.updateUserUI();
            
        } catch (error) {
            this.showNotification('Ошибка при регистрации', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = originalText;
        }
    }

    validateEmail(input) {
        const email = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        if (input.parentElement) {
            if (email && !isValid) {
                input.parentElement.classList.add('error');
            } else {
                input.parentElement.classList.remove('error');
            }
        }
        
        return isValid;
    }

    validatePassword(input) {
        const password = input.value;
        const isValid = password.length >= 6;
        
        if (input.parentElement) {
            if (password && !isValid) {
                input.parentElement.classList.add('error');
            } else {
                input.parentElement.classList.remove('error');
            }
        }
        
        return isValid;
    }

    toggleFavorite(button) {
        if (!this.currentUser) {
            this.showNotification('Войдите в систему, чтобы добавлять в избранное', 'warning');
            this.openModal('loginModal');
            return;
        }

        const vacancyId = button.getAttribute('data-favorite');
        const vacancyCard = button.closest('.vacancy-card');
        const vacancyTitle = vacancyCard.querySelector('h3').textContent;
        
        if (this.favorites.has(vacancyId)) {
            this.favorites.delete(vacancyId);
            button.textContent = '🤍 В избранное';
            button.classList.remove('favorited');
            this.showNotification(`Вакансия "${vacancyTitle}" удалена из избранного`, 'info');
        } else {
            this.favorites.add(vacancyId);
            button.textContent = '❤️ В избранном';
            button.classList.add('favorited');
            this.showNotification(`Вакансия "${vacancyTitle}" добавлена в избранное`, 'success');
        }

        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }

    handleApplication(button) {
        if (!this.currentUser) {
            this.showNotification('Войдите в систему, чтобы откликаться на вакансии', 'warning');
            this.openModal('loginModal');
            return;
        }

        const vacancyId = button.getAttribute('data-apply');
        const vacancyCard = button.closest('.vacancy-card');
        const vacancyTitle = vacancyCard.querySelector('h3').textContent;

        // Simulate application process
        button.disabled = true;
        button.textContent = 'Отправка...';
        button.classList.add('loading');

        setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Отклик отправлен ✓';
            button.classList.remove('loading');
            this.showNotification(`Отклик на вакансию "${vacancyTitle}" отправлен!`, 'success');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                button.textContent = 'Откликнуться';
            }, 3000);
        }, 2000);
    }

    loadMoreContent(button) {
        button.disabled = true;
        button.textContent = 'Загрузка...';
        button.classList.add('loading');

        // Simulate loading more content
        setTimeout(() => {
            this.showNotification('Дополнительный контент загружен', 'info');
            button.disabled = false;
            button.textContent = 'Загрузить еще';
            button.classList.remove('loading');
        }, 1500);
    }

    checkAuthState() {
        const savedUser = localStorage.getItem('currentUser');
        const savedFavorites = localStorage.getItem('favorites');
        
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserUI();
        }
        
        if (savedFavorites) {
            this.favorites = new Set(JSON.parse(savedFavorites));
        }
    }

    updateUserUI() {
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons || !this.currentUser) return;

        authButtons.innerHTML = `
            <div class="user-menu">
                <button class="user-avatar">${this.getUserInitials(this.currentUser.name)}</button>
                <div class="user-dropdown">
                    <a href="profile.html">Мой профиль</a>
                    <a href="resumes.html">Мои резюме</a>
                    <a href="favorites.html">Избранное</a>
                    <a href="settings.html">Настройки</a>
                    <hr>
                    <a href="#" onclick="careerFinder.logout()">Выйти</a>
                </div>
            </div>
        `;
    }

    getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    logout() {
        this.currentUser = null;
        this.favorites.clear();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('favorites');
        
        this.showNotification('Вы вышли из системы', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <span>${this.escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()" aria-label="Закрыть уведомление">×</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Modal functions
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('overlay');
        
        if (modal && overlay) {
            modal.style.display = 'block';
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus first input in modal
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('overlay');
        
        if (modal && overlay) {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('overlay');
        
        modals.forEach(modal => modal.style.display = 'none');
        if (overlay) {
            overlay.style.display = 'none';
        }
        document.body.style.overflow = '';
    }

    async loadCompanies() {
        const container = document.getElementById('companiesContainer');
        if (!container) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const companies = this.getSampleCompanies();
            this.renderCompanies(container, companies);
        } catch (error) {
            console.error('Error loading companies:', error);
            this.showNotification('Ошибка при загрузке компаний', 'error');
        }
    }

    getSampleCompanies() {
        return [
            {
                id: 1,
                name: 'TechCorp',
                industry: 'IT',
                employees: '1000+',
                location: 'Москва',
                description: 'Ведущая IT-компания, специализирующаяся на разработке инновационных решений',
                logo: '🚀',
                vacancies: 54,
                rating: 4.8
            },
            {
                id: 2,
                name: 'FinBank',
                industry: 'Финансы',
                employees: '5000+',
                location: 'Россия',
                description: 'Крупный финансовый институт с современным подходом к банковским услугам',
                logo: '🏦',
                vacancies: 32,
                rating: 4.5
            },
            {
                id: 3,
                name: 'MarketPlus',
                industry: 'Ритейл',
                employees: '2500+',
                location: 'Москва',
                description: 'Сеть супермаркетов премиум-класса с развитой инфраструктурой',
                logo: '🛍️',
                vacancies: 28,
                rating: 4.3
            }
        ];
    }

    renderCompanies(container, companies) {
        container.innerHTML = companies.map(company => `
            <div class="company-card">
                <div class="company-logo">${this.escapeHtml(company.logo)}</div>
                <h3>${this.escapeHtml(company.name)}</h3>
                <div class="company-meta">${this.escapeHtml(company.industry)} • ${this.escapeHtml(company.employees)} сотрудников • ${this.escapeHtml(company.location)}</div>
                <p>${this.escapeHtml(company.description)}</p>
                <div class="company-stats">
                    <div class="stat">
                        <strong>${company.vacancies}</strong>
                        <span>Вакансии</span>
                    </div>
                    <div class="stat">
                        <strong>${company.rating}</strong>
                        <span>Рейтинг</span>
                    </div>
                </div>
                <button class="btn btn-primary" style="width: 100%; margin-top: var(--space-4);" onclick="careerFinder.viewCompany(${company.id})">Смотреть вакансии</button>
            </div>
        `).join('');
    }

    async loadEvents() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const events = this.getSampleEvents();
            this.renderEvents(container, events);
            
            this.initEventFilters();
        } catch (error) {
            console.error('Error loading events:', error);
            this.showNotification('Ошибка при загрузке мероприятий', 'error');
        }
    }

    getSampleEvents() {
        return [
            {
                id: 1,
                title: 'IT Career Day 2024',
                date: '2024-03-15',
                type: 'offline',
                category: 'conference',
                location: 'Технопарк • Москва',
                description: 'Крупнейшая IT-ярмарка вакансий с участием ведущих технологических компаний.'
            },
            {
                id: 2,
                title: 'Digital Marketing Conference',
                date: '2024-03-22',
                type: 'online',
                category: 'conference',
                location: 'Онлайн',
                description: 'Конференция для маркетологов и специалистов по digital.'
            }
        ];
    }

    renderEvents(container, events) {
        container.innerHTML = events.map(event => {
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const month = eventDate.toLocaleString('ru', { month: 'short' });
            
            return `
                <div class="event-card" data-type="${event.type}" data-category="${event.category}">
                    <div class="event-date">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <h3>${this.escapeHtml(event.title)}</h3>
                    <div class="event-meta">
                        <span>${this.escapeHtml(event.location)}</span>
                        <span class="event-type">${event.type === 'online' ? 'Онлайн' : 'Офлайн'}</span>
                    </div>
                    <p>${this.escapeHtml(event.description)}</p>
                    <div class="event-actions">
                        <button class="btn btn-outline">Подробнее</button>
                        <button class="btn btn-primary">Зарегистрироваться</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    initEventFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const filter = tab.getAttribute('data-filter');
                this.filterEvents(filter);
            });
        });
    }

    filterEvents(filter) {
        const events = document.querySelectorAll('.event-card');
        
        events.forEach(event => {
            if (filter === 'all') {
                event.style.display = 'block';
            } else {
                const eventType = event.getAttribute('data-type');
                const eventCategory = event.getAttribute('data-category');
                
                if (eventType === filter || eventCategory === filter) {
                    event.style.display = 'block';
                } else {
                    event.style.display = 'none';
                }
            }
        });
    }

    async loadBlogPosts() {
        const container = document.getElementById('blogContainer');
        if (!container) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const posts = this.getSampleBlogPosts();
            this.renderBlogPosts(container, posts);
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.showNotification('Ошибка при загрузке статей', 'error');
        }
    }

    getSampleBlogPosts() {
        return [
            {
                id: 1,
                title: 'Как составить резюме, которое заметят',
                category: 'Карьера',
                excerpt: 'Советы от HR-специалистов по созданию эффективного резюме.',
                author: 'Анна Иванова',
                readTime: '5 мин чтения',
                image: '📊'
            },
            {
                id: 2,
                title: 'Тренды в разработке на 2024 год',
                category: 'IT',
                excerpt: 'Обзор новых технологий и подходов в IT-индустрии.',
                author: 'Петр Сидоров',
                readTime: '7 мин чтения',
                image: '💻'
            }
        ];
    }

    renderBlogPosts(container, posts) {
        container.innerHTML = posts.map(post => `
            <div class="blog-card">
                <div class="blog-image">${this.escapeHtml(post.image)}</div>
                <div class="blog-content">
                    <span class="blog-category">${this.escapeHtml(post.category)}</span>
                    <h3>${this.escapeHtml(post.title)}</h3>
                    <p class="blog-excerpt">${this.escapeHtml(post.excerpt)}</p>
                    <div class="blog-meta">
                        <div class="blog-author">
                            <div class="author-avatar">${this.getUserInitials(post.author)}</div>
                            <span>${this.escapeHtml(post.author)}</span>
                        </div>
                        <span>${this.escapeHtml(post.readTime)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewCompany(companyId) {
        this.showNotification(`Переход к вакансиям компании #${companyId}`, 'info');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.careerFinder = new CareerFinder();
});

// Global functions for HTML onclick attributes
function openModal(modalId) {
    if (window.careerFinder) {
        window.careerFinder.openModal(modalId);
    }
}

function closeModal(modalId) {
    if (window.careerFinder) {
        window.careerFinder.closeModal(modalId);
    }
}

function closeAllModals() {
    if (window.careerFinder) {
        window.careerFinder.closeAllModals();
    }
}
// API базовый URL
const API_BASE_URL = 'http://localhost:5000/api';

// Функция для API запросов
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Ошибка API');
  }

  return data;
}

// Обновляем функцию handleLogin
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    this.currentUser = data.user;
    this.showNotification('Вход выполнен успешно!', 'success');
    this.closeModal('loginModal');
    this.updateUserUI();
  } catch (error) {
    this.showNotification(error.message, 'error');
  }
}

// Загрузка вакансий с API
async function loadVacancies() {
  const container = document.getElementById('vacanciesContainer');
  if (!container) return;

  try {
    const data = await apiRequest('/vacancies');
    this.renderVacancies(container, data.vacancies);
  } catch (error) {
    console.error('Error loading vacancies:', error);
    this.showNotification('Ошибка при загрузке вакансий', 'error');
  }
}
// CareerFinder - Enhanced Main JavaScript with API Integration
class CareerFinder {
    constructor() {
        this.currentUser = null;
        this.favorites = new Set();
        this.API_BASE_URL = 'http://localhost:5000/api'; // Измените на ваш URL бэкенда
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setActiveNavLink();
        this.initSmoothScrolling();
        this.initializeCounters();
        this.checkAuthState();
        
        // Загрузка данных в зависимости от страницы
        this.loadPageSpecificData();
    }

    setupEventListeners() {
        // ... существующие обработчики ...

        // Обработчики для API форм
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }
    }

    // API методы
    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Добавляем токен авторизации, если пользователь авторизован
        if (this.currentUser && this.currentUser.token) {
            config.headers.Authorization = `Bearer ${this.currentUser.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка сервера');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Авторизация
    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;

        try {
            button.disabled = true;
            button.classList.add('loading');

            const data = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            this.currentUser = {
                ...data.data.user,
                token: data.data.token
            };

            // Сохраняем в localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('Вход выполнен успешно!', 'success');
            this.closeModal('loginModal');
            this.updateUserUI();
            
        } catch (error) {
            this.showNotification(error.message || 'Ошибка при входе в систему', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = originalText;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            profile: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName')
            },
            type: 'candidate' // По умолчанию регистрируем как соискателя
        };

        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.textContent;

        try {
            button.disabled = true;
            button.classList.add('loading');

            const data = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            this.currentUser = {
                ...data.data.user,
                token: data.data.token
            };

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification('Регистрация прошла успешно!', 'success');
            this.closeModal('registerModal');
            this.updateUserUI();
            
        } catch (error) {
            this.showNotification(error.message || 'Ошибка при регистрации', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = originalText;
        }
    }

    // Загрузка вакансий
    async loadVacancies() {
        const container = document.getElementById('vacanciesContainer') || 
                         document.getElementById('vacanciesList');
        if (!container) return;

        try {
            const data = await this.apiCall('/vacancies');
            this.renderVacancies(container, data.data.vacancies);
        } catch (error) {
            console.error('Error loading vacancies:', error);
            this.showNotification('Ошибка при загрузке вакансий', 'error');
        }
    }

    // Загрузка компаний
    async loadCompanies() {
        const container = document.getElementById('companiesContainer');
        if (!container) return;

        try {
            const data = await this.apiCall('/companies');
            this.renderCompanies(container, data.data.companies);
        } catch (error) {
            console.error('Error loading companies:', error);
            this.showNotification('Ошибка при загрузке компаний', 'error');
        }
    }

    // Поиск вакансий
    async handleSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const searchParams = new URLSearchParams();

        if (formData.get('position')) searchParams.append('search', formData.get('position'));
        if (formData.get('location')) searchParams.append('location', formData.get('location'));

        try {
            const data = await this.apiCall(`/vacancies?${searchParams.toString()}`);
            
            if (window.location.pathname.includes('vacancies.html')) {
                // Обновляем список на странице вакансий
                const container = document.getElementById('vacanciesList');
                if (container) {
                    this.renderVacancies(container, data.data.vacancies);
                }
            } else {
                // Перенаправляем на страницу вакансий с результатами поиска
                window.location.href = `vacancies.html?${searchParams.toString()}`;
            }
        } catch (error) {
            this.showNotification('Ошибка при поиске вакансий', 'error');
        }
    }

    // Загрузка данных в зависимости от страницы
    loadPageSpecificData() {
        const path = window.location.pathname;
        
        if (path.includes('vacancies.html')) {
            this.loadVacancies();
        } else if (path.includes('companies.html')) {
            this.loadCompanies();
        } else if (path.includes('index.html') || path === '/') {
            this.loadVacancies();
        }
    }

    // Остальные методы остаются без изменений...
    // ... (оставшиеся методы из предыдущей версии)
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.careerFinder = new CareerFinder();
});