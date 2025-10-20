// Функции для FAQ
class FAQManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Поиск по FAQ
        const searchInput = document.getElementById('faqSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.searchFAQ.bind(this));
        }
    }

    toggleFAQ(element) {
        const faqItem = element.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const toggle = element.querySelector('.faq-toggle');

        // Закрываем все остальные
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.display = 'none';
                item.querySelector('.faq-toggle').textContent = '+';
            }
        });

        // Переключаем текущий
        faqItem.classList.toggle('active');
        if (faqItem.classList.contains('active')) {
            answer.style.display = 'block';
            toggle.textContent = '−';
        } else {
            answer.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    searchFAQ() {
        const query = document.getElementById('faqSearch').value.toLowerCase();
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            if (question.includes(query) || answer.includes(query)) {
                item.style.display = 'block';
                // Подсветка найденного текста
                this.highlightText(item, query);
            } else {
                item.style.display = 'none';
            }
        });
    }

    highlightText(element, query) {
        // Простая реализация подсветки
        const text = element.innerHTML;
        const highlighted = text.replace(
            new RegExp(query, 'gi'),
            match => `<mark>${match}</mark>`
        );
        element.innerHTML = highlighted;
    }

    showCategory(category) {
        const faqItems = document.querySelectorAll('.faq-item');
        const categoryButtons = document.querySelectorAll('.category-btn');
        
        // Обновляем активную кнопку
        categoryButtons.forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(category));
        });

        // Показываем/скрываем элементы
        faqItems.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    openChat() {
        showToast('Чат поддержки откроется в ближайшее время', 'info');
    }
}

// Глобальные функции
function toggleFAQ(element) {
    faqManager.toggleFAQ(element);
}

function searchFAQ() {
    faqManager.searchFAQ();
}

function showCategory(category) {
    faqManager.showCategory(category);
}

function openChat() {
    faqManager.openChat();
}

const faqManager = new FAQManager();