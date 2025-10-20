// Firebase конфигурация и функции
class FirebaseApp {
    constructor() {
        this.config = {
            apiKey: "your-firebase-api-key",
            authDomain: "careerfinder-12345.firebaseapp.com",
            projectId: "careerfinder-12345",
            storageBucket: "careerfinder-12345.appspot.com",
            messagingSenderId: "123456789",
            appId: "your-app-id"
        };
        
        this.init();
    }

    async init() {
        try {
            // Инициализация Firebase
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(this.config);
                
                // Инициализация сервисов
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.storage = firebase.storage();
                
                console.log('Firebase инициализирован');
                this.setupAuthListener();
            }
        } catch (error) {
            console.warn('Firebase не доступен, используем localStorage:', error);
            this.useFallback = true;
        }
    }

    setupAuthListener() {
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('Пользователь вошел:', user.email);
                    this.syncUserData(user);
                } else {
                    console.log('Пользователь вышел');
                }
            });
        }
    }

    async syncUserData(user) {
        if (this.useFallback) return;

        try {
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                // Синхронизируем данные с localStorage
                const userData = userDoc.data();
                localStorage.setItem('careerFinderCurrentUser', JSON.stringify(userData));
                
                // Обновляем UI
                if (window.authSystem) {
                    window.authSystem.currentUser = userData;
                    window.authSystem.updateUI();
                }
            }
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
        }
    }

    // Аутентификация
    async register(email, password, userData) {
        if (this.useFallback) {
            return this.fallbackRegister(userData);
        }

        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            await this.saveUserData(userCredential.user.uid, userData);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        if (this.useFallback) {
            return this.fallbackLogin(email, password);
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Ошибка входа:', error);
            return { success: false, error: error.message };
        }
    }

    async saveUserData(uid, userData) {
        if (this.useFallback) return;

        try {
            await this.db.collection('users').doc(uid).set({
                ...userData,
                uid: uid,
                lastLogin: new Date().toISOString()
            });
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
        }
    }

    // Fallback методы для работы без Firebase
    fallbackRegister(userData) {
        const users = JSON.parse(localStorage.getItem('careerFinderUsers')) || [];
        
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'Пользователь уже существует' };
        }

        users.push(userData);
        localStorage.setItem('careerFinderUsers', JSON.stringify(users));
        localStorage.setItem('careerFinderCurrentUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
    }

    fallbackLogin(email, password) {
        const users = JSON.parse(localStorage.getItem('careerFinderUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('careerFinderCurrentUser', JSON.stringify(user));
            return { success: true, user: user };
        } else {
            return { success: false, error: 'Неверный email или пароль' };
        }
    }

    // Работа с вакансиями
    async getVacancies(filters = {}) {
        if (this.useFallback) {
            return this.getFallbackVacancies(filters);
        }

        try {
            let query = this.db.collection('vacancies').where('active', '==', true);
            
            // Применяем фильтры
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.location) {
                query = query.where('location', '==', filters.location);
            }
            if (filters.salaryMin) {
                query = query.where('salary', '>=', parseInt(filters.salaryMin));
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Ошибка загрузки вакансий:', error);
            return this.getFallbackVacancies(filters);
        }
    }

    getFallbackVacancies(filters) {
        const fallbackVacancies = [
            {
                id: 1,
                title: "Frontend Developer",
                company: "TechCorp",
                location: "Москва",
                salary: "150000",
                category: "IT",
                description: "Разработка пользовательских интерфейсов",
                tags: ["JavaScript", "React", "Vue"],
                featured: true,
                active: true
            },
            // ... больше вакансий
        ];

        return fallbackVacancies.filter(vacancy => {
            if (filters.category && vacancy.category !== filters.category) return false;
            if (filters.location && !vacancy.location.includes(filters.location)) return false;
            if (filters.salaryMin && parseInt(vacancy.salary) < parseInt(filters.salaryMin)) return false;
            return true;
        });
    }
}

// Инициализация Firebase
const firebaseApp = new FirebaseApp();

// Интеграция с существующей системой аутентификации
if (window.authSystem) {
    const originalRegister = window.authSystem.register;
    const originalLogin = window.authSystem.login;

    window.authSystem.register = async function() {
        const isJobseeker = document.querySelector('[data-type="jobseeker"]').classList.contains('active');
        let userData;

        if (isJobseeker) {
            userData = {
                type: 'jobseeker',
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                profession: document.getElementById('regProfession').value,
                experience: document.getElementById('regExperience').value,
                registrationDate: new Date().toISOString()
            };
        } else {
            userData = {
                type: 'employer',
                companyName: document.getElementById('companyName').value,
                email: document.getElementById('companyEmail').value,
                password: document.getElementById('companyPassword').value,
                industry: document.getElementById('companyIndustry').value,
                website: document.getElementById('companyWebsite').value,
                registrationDate: new Date().toISOString()
            };
        }

        const result = await firebaseApp.register(userData.email, userData.password, userData);
        
        if (result.success) {
            showToast('Регистрация прошла успешно!', 'success');
            closeModal('registerModal');
            this.updateUI();
        } else {
            showToast(result.error, 'error');
        }
    };

    window.authSystem.login = async function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await firebaseApp.login(email, password);
        
        if (result.success) {
            showToast('Вход выполнен!', 'success');
            closeModal('loginModal');
            this.updateUI();
        } else {
            showToast(result.error, 'error');
        }
    };
}