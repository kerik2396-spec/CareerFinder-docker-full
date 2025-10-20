# CareerFinder — Полный проект (Docker-ready)

Это собранный проект CareerFinder (frontend + backend) с готовой конфигурацией Docker и PostgreSQL.

## Что включено
- `frontend/` — React-приложение
- `backend/` — Node.js (Express) сервер
- `docker-compose.yml` — конфигурация для запуска `db`, `backend`, `frontend`
- `Dockerfile.backend` — Dockerfile для backend
- `Dockerfile.frontend` — Dockerfile для frontend (с nginx)
- `.env.example` — пример переменных окружения

## Быстрый старт (требуется Docker Desktop)
1. Установите Docker Desktop и WSL2 (если ещё не установлены).
2. В корне проекта выполните:
   ```bash
   docker compose up --build
   ```
3. Откройте фронтенд: http://localhost:3000
   Backend доступен на: http://localhost:5000

## Переменные окружения
Скопируйте `.env.example` в `.env` и при необходимости измените значения.

## Примечания
- Если backend не использует PostgreSQL — переменная `DATABASE_URL` будет проигнорирована. 
- При разработке можно запускать сервисы локально (без Docker): запустить `npm install` в `frontend` и `backend`, затем `npm start` в каждой папке.
- Для настройки API URL в frontend используется `REACT_APP_API_URL`

---
С уважением, твоя автоматическая сборка.
