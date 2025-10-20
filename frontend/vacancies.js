// Логика для страницы вакансий
document.addEventListener('DOMContentLoaded', function() {
    loadVacancies();
    setupFilterHandlers();
});

// Загрузка вакансий
function loadVacancies() {
    const loadingState = document.getElementById('loadingState');
    const vacanciesList = document.getElementById('vacanciesList');
    
    // Имитация загрузки данных
    setTimeout(() => {
        loadingState.style.display = 'none';
        vacanciesList.innerHTML = generateVacanciesHTML();
    }, 1500);
}

function generateVacanciesHTML() {
    const vacancies = [
        {
            title: "Senior Frontend Developer",
            company: "TechCorp",
            location: "Москва",
            type: "Полная занятость",
            salary: "от 200 000 ₽",
            description: "Разработка сложных пользовательских интерфейсов для финансовых приложений.",
            tags: ["React", "TypeScript", "Redux"],
            featured: true
        },
        {
            title: "Backend Engineer",
            company: "DataSoft",
            location: "Санкт-Петербург",
            type: "Удалённая работа",
            salary: "от 180 000 ₽",
            description: "Разработка высоконагруженных API и микросервисов.",
            tags: ["Node.js", "Python", "PostgreSQL"],
            featured: false
        },
        {
            title: "Product Manager",
            company: "StartupLab",
            location: "Екатеринбург",
            type: "Полная занятость",
            salary: "от 150 000 ₽",
            description: "Управление продуктом от идеи до реализации.",
            tags: ["Product", "Analytics", "Agile"],
            featured: false
        },
        {
            title: "DevOps Engineer",
            company: "CloudSystems",
            location: "Новосибирск",
            type: "Полная занятость",
            salary: "от 220 000 ₽",
            description: "Настройка CI/CD и облачной инфраструктуры.",
            tags: ["AWS", "Docker", "Kubernetes"],
            featured: true
        },
        {
            title: "UX Designer",
            company: "DesignStudio",
            location: "Казань",
            type: "Гибкий график",
            salary: "от 120 000 ₽",
            description: "Создание пользовательских интерфейсов и прототипов.",
            tags: ["Figma", "UI/UX", "Research"],
            featured: false
        },
        {
            title: "Data Scientist",
            company: "AIAnalytics",
            location: "Москва",
            type: "Полная занятость",
            salary: "от 250 000 ₽",
            description: "Анализ больших данных и машинное обучение.",
            tags: ["Python", "ML", "SQL"],
            featured: true
        }
    ];

    return vacancies.map(vacancy => `
        <div class="vacancy-card ${vacancy.featured ? 'featured' : ''}">
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

// Фильтры
function setupFilterHandlers() {
    const filterInputs = document.querySelectorAll('.filter-input, .salary-input, select');
    filterInputs.forEach(input => {
        input.addEventListener('change', applyFilters);
        input.addEventListener('input', applyFilters);
    });
}

function applyFilters() {
    showToast('Фильтры применены', 'info');
    // В реальном приложении здесь был бы AJAX запрос с фильтрами
}

function resetFilters() {
    const filterInputs = document.querySelectorAll('.filter-input, .salary-input, select');
    filterInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });
    showToast('Фильтры сброшены', 'info');
    applyFilters();
}

function addToFavorites(button) {
    button.textContent = '❤️ В избранном';
    button.style.color = 'var(--accent)';
    showToast('Вакансия добавлена в избранное', 'success');
}