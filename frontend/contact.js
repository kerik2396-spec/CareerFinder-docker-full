// Функции для контактной формы
class ContactManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Валидация формы
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', this.submitContactForm.bind(this));
        }
    }

    submitContactForm(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value,
            timestamp: new Date().toISOString()
        };

        // Валидация
        if (!this.validateForm(formData)) {
            return;
        }

        // Сохраняем в localStorage (в реальном приложении отправляем на сервер)
        const contacts = JSON.parse(localStorage.getItem('contactSubmissions')) || [];
        contacts.push(formData);
        localStorage.setItem('contactSubmissions', JSON.stringify(contacts));

        // Показываем уведомление
        showToast('Сообщение отправлено! Мы ответим вам в течение 24 часов.', 'success');
        
        // Очищаем форму
        document.getElementById('contactForm').reset();
    }

    validateForm(data) {
        if (!data.name.trim()) {
            showToast('Пожалуйста, введите ваше имя', 'error');
            return false;
        }

        if (!this.validateEmail(data.email)) {
            showToast('Пожалуйста, введите корректный email', 'error');
            return false;
        }

        if (!data.message.trim()) {
            showToast('Пожалуйста, введите сообщение', 'error');
            return false;
        }

        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

const contactManager = new ContactManager();

function submitContactForm(event) {
    contactManager.submitContactForm(event);
}