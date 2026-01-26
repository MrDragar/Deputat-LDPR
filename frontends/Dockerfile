# Используем официальный образ Node.js на основе Alpine (легковесный)
FROM node:18-alpine as builder_reports

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY reports/package.json reports/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY reports .

# Собираем приложение
RUN npm run build

# Используем официальный образ Node.js на основе Alpine (легковесный)
FROM node:18-alpine as builder_registration_form

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY registration_form/package.json registration_form/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY registration_form .

# Собираем приложение
RUN npm run build


# Используем официальный образ Node.js на основе Alpine (легковесный)
FROM node:18-alpine as builder_dashboard

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY dashboard/package.json dashboard/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY dashboard .

# Собираем приложение
RUN npm run build

# Используем официальный образ Node.js на основе Alpine (легковесный)
FROM node:18-alpine as builder_congrats

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY congrats/package.json congrats/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY congrats .

# Собираем приложение
RUN npm run build

# Используем официальный образ Node.js на основе Alpine (легковесный)
FROM node:18-alpine as builder_host

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY host/package.json host/package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY host .

# Собираем приложение
RUN npm run build


# Шаг 2: Сервер для статики
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder_host /app/dist /usr/share/nginx/html
COPY --from=builder_reports /app/dist /usr/share/nginx/html/reports/
COPY --from=builder_dashboard /app/dist /usr/share/nginx/html/dashboard/
COPY --from=builder_congrats /app/dist /usr/share/nginx/html/congrats/
COPY --from=builder_registration_form /app/dist /usr/share/nginx/html/registration_form/
RUN mkdir -p  /usr/share/nginx/html/images/
COPY --from=builder_reports /app/dist/images/reposts /usr/share/nginx/html/images/reposts
COPY host/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

## Copy the runtime injection script into the container
#COPY host/env.sh /docker-entrypoint.d/env.sh
#RUN dos2unix /docker-entrypoint.d/env.sh
#RUN chmod +x /docker-entrypoint.d/env.sh

# Let Docker run your script before starting Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

