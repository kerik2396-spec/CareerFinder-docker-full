// Функции для блога
class BlogManager {
    constructor() {
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Фильтрация по категориям
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    filterBlog(category) {
        this.currentFilter = category;
        const blogCards = document.querySelectorAll('.blog-card');
        
        blogCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    loadNextPage() {
        // В реальном приложении здесь был бы AJAX запрос
        showToast('Загрузка следующих статей...', 'info');
        setTimeout(() => {
            showToast('Следующая страница загружена', 'success');
        }, 1000);
    }

    subscribeNewsletter() {
        const email = document.getElementById('newsletterEmail').value;
        if (email && this.validateEmail(email)) {
            // Сохраняем в localStorage
            const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions')) || [];
            if (!subscriptions.includes(email)) {
                subscriptions.push(email);
                localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));
            }
            showToast('Спасибо за подписку!', 'success');
            document.getElementById('newsletterEmail').value = '';
        } else {
            showToast('Пожалуйста, введите корректный email', 'error');
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Глобальные функции
function filterBlog(category) {
    blogManager.filterBlog(category);
}

function loadNextPage() {
    blogManager.loadNextPage();
}

function subscribeNewsletter() {
    blogManager.subscribeNewsletter();
}

const blogManager = new BlogManager();