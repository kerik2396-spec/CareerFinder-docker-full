// services.js - Управление дополнительными услугами
class ServicesManager {
    constructor() {
        this.services = {
            highlightVacancy: { 
                id: 'highlight',
                name: 'Выделение вакансии',
                price: 500, 
                duration: 7,
                description: 'Ваша вакансия будет выделена цветом в поиске',
                icon: '🔍'
            },
            urgentTag: { 
                id: 'urgent',
                name: 'Срочный тэг "Urgent"',
                price: 300, 
                duration: 3,
                description: 'Пометка "Срочно" для быстрого найма',
                icon: '⚡'
            },
            topPlacement: { 
                id: 'top',
                name: 'Топ-размещение',
                price: 1500, 
                duration: 7,
                description: 'Размещение вакансии в топе поисковой выдачи',
                icon: '⭐'
            },
            candidateDatabase: { 
                id: 'database',
                name: 'Полный доступ к базе',
                price: 5000, 
                duration: 30,
                description: 'Неограниченный доступ ко всей базе резюме',
                icon: '📊'
            },
            vacancyAnalytics: {
                id: 'analytics',
                name: 'Расширенная аналитика',
                price: 800,
                duration: 30,
                description: 'Подробная статистика по вакансии',
                icon: '📈'
            },
            candidateTesting: {
                id: 'testing',
                name: 'Профессиональное тестирование',
                price: 2000,
                duration: 30,
                description: 'Автоматическое тестирование кандидатов',
                icon: '🎯'
            }
        };
        
        this.selectedServices = new Set();
        this.init();
    }

    init() {
        this.loadSelectedServices();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчики для динамически создаваемых элементов
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-service]')) {
                const serviceId = e.target.closest('[data-service]').getAttribute('data-service');
                this.toggleService(serviceId);
            }
        });
    }

    toggleService(serviceId) {
        if (!this.services[serviceId]) {
            console.error('Service not found:', serviceId);
            return;
        }

        if (this.selectedServices.has(serviceId)) {
            this.selectedServices.delete(serviceId);
            this.showNotification(`Услуга "${this.services[serviceId].name}" удалена`, 'info');
        } else {
            this.selectedServices.add(serviceId);
            this.showNotification(`Услуга "${this.services[serviceId].name}" добавлена`, 'success');
        }

        this.saveSelectedServices();
        this.updateServiceUI();
    }

    addServiceToCart(serviceId) {
        if (!this.services[serviceId]) {
            console.error('Service not found:', serviceId);
            return false;
        }

        this.selectedServices.add(serviceId);
        this.saveSelectedServices();
        this.updateServiceUI();
        
        return true;
    }

    removeServiceFromCart(serviceId) {
        this.selectedServices.delete(serviceId);
        this.saveSelectedServices();
        this.updateServiceUI();
    }

    getSelectedServices() {
        return Array.from(this.selectedServices).map(serviceId => this.services[serviceId]);
    }

    calculateTotal() {
        return Array.from(this.selectedServices).reduce((total, serviceId) => {
            return total + this.services[serviceId].price;
        }, 0);
    }

    getServicePrice(serviceId) {
        return this.services[serviceId]?.price || 0;
    }

    getAllServices() {
        return Object.values(this.services);
    }

    getServicesByCategory(category) {
        // Группировка услуг по категориям (можно расширить)
        return this.getAllServices();
    }

    createServiceInvoice() {
        const selected = this.getSelectedServices();
        const total = this.calculateTotal();
        
        return {
            services: selected,
            subtotal: total,
            tax: Math.round(total * 0.2), // 20% НДС
            total: total + Math.round(total * 0.2),
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date().toISOString().split('T')[0]
        };
    }

    saveSelectedServices() {
        localStorage.setItem('selectedServices', JSON.stringify(Array.from(this.selectedServices)));
    }

    loadSelectedServices() {
        const saved = localStorage.getItem('selectedServices');
        if (saved) {
            this.selectedServices = new Set(JSON.parse(saved));
        }
    }

    updateServiceUI() {
        // Обновление UI корзины и счетчика
        const cartCounter = document.getElementById('servicesCartCounter');
        if (cartCounter) {
            cartCounter.textContent = this.selectedServices.size;
            cartCounter.style.display = this.selectedServices.size > 0 ? 'flex' : 'none';
        }

        // Обновление общей стоимости
        const totalElement = document.getElementById('servicesTotal');
        if (totalElement) {
            totalElement.textContent = this.calculateTotal().toLocaleString() + ' ₽';
        }

        // Обновление кнопок услуг
        this.getAllServices().forEach(service => {
            const button = document.querySelector(`[data-service="${service.id}"]`);
            if (button) {
                const isSelected = this.selectedServices.has(service.id);
                button.textContent = isSelected ? '✓ В корзине' : `Добавить за ${service.price} ₽`;
                button.className = isSelected ? 
                    'btn btn-success btn-sm' : 
                    'btn btn-outline btn-sm';
            }
        });
    }

    clearCart() {
        this.selectedServices.clear();
        this.saveSelectedServices();
        this.updateServiceUI();
        this.showNotification('Корзина очищена', 'info');
    }

    processPayment(paymentMethod) {
        const invoice = this.createServiceInvoice();
        
        if (invoice.services.length === 0) {
            this.showNotification('Выберите хотя бы одну услугу', 'warning');
            return false;
        }

        // Симуляция процесса оплаты
        this.showNotification('Обработка платежа...', 'info');
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // В реальном приложении здесь будет интеграция с платежной системой
                const success = Math.random() > 0.1; // 90% успешных платежей
                
                if (success) {
                    this.showNotification('Оплата прошла успешно!', 'success');
                    this.clearCart();
                    resolve(true);
                } else {
                    this.showNotification('Ошибка оплаты. Попробуйте еще раз.', 'error');
                    resolve(false);
                }
            }, 2000);
        });
    }

    showNotification(message, type = 'info') {
        if (window.careerFinder) {
            window.careerFinder.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Глобальная инициализация
document.addEventListener('DOMContentLoaded', function() {
    window.servicesManager = new ServicesManager();
});

// API для использования в других модулях
window.ServicesManager = ServicesManager;