// Система аутентификации и регистрации (обновленная)
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('careerFinderUsers')) || [];
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadUserProfile();
    }

    setupEventListeners() {
        // Обработка входа
        document.getElementById('loginModal')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });

        // Обработка регистрации
        document.getElementById('registerModal')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.register();
            }
        });
    }

    // Выбор типа пользователя при регистрации
    selectUserType(type) {
        const jobseekerBtn = document.querySelector('[data-type="jobseeker"]');
        const employerBtn = document.querySelector('[data-type="employer"]');
        const jobseekerForm = document.getElementById('jobseekerForm');
        const employerForm = document.getElementById('employerForm');

        jobseekerBtn.classList.toggle('active', type === 'jobseeker');
        employerBtn.classList.toggle('active', type === 'employer');
        jobseekerForm.style.display = type === 'jobseeker' ? 'block' : 'none';
        employerForm.style.display = type === 'employer' ? 'block' : 'none';
    }

    // Регистрация нового пользователя
    register() {
        const isJobseeker = document.querySelector('[data-type="jobseeker"]').classList.contains('active');
        const agreeTerms = document.getElementById('agreeTerms').checked;

        if (!agreeTerms) {
            showToast('Необходимо согласие с условиями использования', 'error');
            return;
        }
        
        let userData;
        if (isJobseeker) {
            userData = {
                type: 'jobseeker',
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                profession: document.getElementById('regProfession').value,
                experience: document.getElementById('regExperience').value,
                registrationDate: new Date().toISOString(),
                profileComplete: false
            };
        } else {
            userData = {
                type: 'employer',
                companyName: document.getElementById('companyName').value,
                email: document.getElementById('companyEmail').value,
                password: document.getElementById('companyPassword').value,
                industry: document.getElementById('companyIndustry').value,
                website: document.getElementById('companyWebsite').value,
                registrationDate: new Date().toISOString(),
                profileComplete: false
            };
        }

        // Валидация
        if (!userData.email || !userData.password) {
            showToast('Заполните обязательные поля', 'error');
            return;
        }

        if (userData.password.length < 6) {
            showToast('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        // Проверка на существующего пользователя
        if (this.users.find(u => u.email === userData.email)) {
            showToast('Пользователь с таким email уже существует', 'error');
            return;
        }

        // Сохранение пользователя
        this.users.push(userData);
        localStorage.setItem('careerFinderUsers', JSON.stringify(this.users));

        // Автоматический вход
        this.currentUser = userData;
        localStorage.setItem('careerFinderCurrentUser', JSON.stringify(userData));

        // Добавляем уведомление
        careerFeatures.addNotification(
            'Добро пожаловать!', 
            `Регистрация ${isJobseeker ? 'соискателя' : 'компании'} прошла успешно`,
            'success'
        );

        closeModal('registerModal');
        this.updateUI();
    }

    // Вход пользователя
    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Заполните все поля', 'error');
            return;
        }

        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('careerFinderCurrentUser', JSON.stringify(user));
            
            careerFeatures.addNotification(
                'С возвращением!',
                `Рады видеть вас снова${user.type === 'jobseeker' ? '' : ', ' + user.companyName}`,
                'success'
            );
            
            closeModal('loginModal');
            this.updateUI();
        } else {
            showToast('Неверный email или пароль', 'error');
        }
    }

    // Выход пользователя
    logout() {
        this.currentUser = null;
        localStorage.removeItem('careerFinderCurrentUser');
        
        careerFeatures.addNotification('До свидания!', 'Вы вышли из системы', 'info');
        
        this.updateUI();
    }

    // Проверка статуса авторизации
    checkAuthStatus() {
        const savedUser = localStorage.getItem('careerFinderCurrentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    }

    // Загрузка профиля в форму
    loadUserProfile() {
        if (this.currentUser) {
            if (this.currentUser.type === 'jobseeker') {
                document.getElementById('profileName').value = this.currentUser.name || '';
                document.getElementById('profileEmail').value = this.currentUser.email || '';
                document.getElementById('profileProfession').value = this.currentUser.profession || '';
                document.getElementById('profileExperience').value = this.currentUser.experience || '';
            } else {
                document.getElementById('profileName').value = this.currentUser.companyName || '';
                document.getElementById('profileEmail').value = this.currentUser.email || '';
            }
            
            // Загружаем аватар
            if (this.currentUser.avatar) {
                careerFeatures.updateAvatar(this.currentUser);
            }
        }
    }

    // Сохранение профиля
    saveProfile() {
        if (!this.currentUser) return;

        const updatedUser = { ...this.currentUser };
        
        if (this.currentUser.type === 'jobseeker') {
            updatedUser.name = document.getElementById('profileName').value;
            updatedUser.email = document.getElementById('profileEmail').value;
            updatedUser.phone = document.getElementById('profilePhone').value;
            updatedUser.location = document.getElementById('profileLocation').value;
            updatedUser.profession = document.getElementById('profileProfession').value;
            updatedUser.experience = document.getElementById('profileExperience').value;
            updatedUser.bio = document.getElementById('profileBio').value;
            updatedUser.skills = document.getElementById('profileSkills').value;
            updatedUser.profileComplete = true;
        } else {
            updatedUser.companyName = document.getElementById('profileName').value;
            updatedUser.email = document.getElementById('profileEmail').value;
            updatedUser.phone = document.getElementById('profilePhone').value;
            updatedUser.location = document.getElementById('profileLocation').value;
            updatedUser.profileComplete = true;
        }

        // Обновляем в массиве пользователей
        const userIndex = this.users.findIndex(u => u.email === this.currentUser.email);
        if (userIndex !== -1) {
            this.users[userIndex] = updatedUser;
            localStorage.setItem('careerFinderUsers', JSON.stringify(this.users));
        }

        // Обновляем текущего пользователя
        this.currentUser = updatedUser;
        localStorage.setItem('careerFinderCurrentUser', JSON.stringify(updatedUser));

        careerFeatures.addNotification('Профиль обновлён', 'Изменения успешно сохранены', 'success');
        closeModal('profileModal');
        this.updateUI();
    }

    // Обновление интерфейса
    updateUI() {
        const authControls = document.getElementById('authControls');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            authControls.style.display = 'none';
            userMenu.style.display = 'flex';
            
            if (this.currentUser.type === 'jobseeker') {
                userName.textContent = this.currentUser.name || 'Пользователь';
            } else {
                userName.textContent = this.currentUser.companyName || 'Компания';
            }

            this.updateNavigationForEmployer();
            this.loadUserProfile();
        } else {
            authControls.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    // Обновление навигации для работодателей
    updateNavigationForEmployer() {
        if (this.currentUser?.type === 'employer') {
            let employerLink = document.querySelector('.employer-dashboard-link');
            if (!employerLink) {
                employerLink = document.createElement('a');
                employerLink.className = 'nav-link employer-dashboard-link';
                employerLink.textContent = 'Кабинет';
                employerLink.onclick = () => openModal('employerModal');
                
                const nav = document.querySelector('nav');
                nav.appendChild(employerLink);
            }
        }
    }

    // Проверка авторизации для защищенных действий
    requireAuth(action) {
        if (!this.currentUser) {
            showToast('Для выполнения этого действия необходимо войти в систему', 'warning');
            openModal('loginModal');
            return false;
        }
        return true;
    }
}

// Глобальные функции для HTML
function selectUserType(type) {
    authSystem.selectUserType(type);
}

function register() {
    authSystem.register();
}

function login() {
    authSystem.login();
}

function logout() {
    authSystem.logout();
}

function saveProfile() {
    authSystem.saveProfile();
}

// Инициализация системы аутентификации
const authSystem = new AuthSystem();