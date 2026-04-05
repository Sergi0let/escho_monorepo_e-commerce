# PostgreSQL на Easypanel

Документ фіксує, як піднімати базу для цього монорепо та з чим можна зіткнутися.

## Створення сервісу

1. У Easypanel: проєкт → **Add service** → шаблон **PostgreSQL**.
2. Задай ім’я сервісу (наприклад `service_escho-db`).
3. Дочекайся статусу **Running** і рядка в логах на кшталт `database system is ready to accept connections`.

## Змінні середовища (credentials)

У вкладці **Variables / Environment** сервісу Postgres шукай:

| Змінна | Призначення |
|--------|-------------|
| `POSTGRES_USER` | ім’я ролі в PostgreSQL (**не завжди** `postgres`) |
| `POSTGRES_PASSWORD` | пароль |
| `POSTGRES_DB` | ім’я бази |

З них збирається рядок підключення:

```text
postgresql://POSTGRES_USER:POSTGRES_PASSWORD@HOST:5432/POSTGRES_DB
```

Якщо в паролі є `@`, `:`, `/`, `#` тощо — закодуй їх у URL (percent-encoding).

## Нюанс: `FATAL: role "postgres" does not exist`

Часто шаблон створює суперкористувача з іменем **`POSTGRES_USER`**, а не `postgres`. Тоді підключення з юзером `postgres` дає цю помилку.

**Що робити:** у всіх клієнтах (DbGate, PgWeb, `DATABASE_URL`) використовуй **саме `POSTGRES_USER`** з панелі.

## Внутрішній vs зовнішній host

- **Внутрішній hostname** (наприклад `project_service-name-db:5432`) резолвиться **тільки всередині мережі Docker/Easypanel** — з ноутбука зазвичай **не** пінгується.
- **`catalog-api` у тому ж проєкті** має в `DATABASE_URL` саме **внутрішній** URL (як у підказці Easypanel для “internal”).
- **З локальної машини** для `prisma db push` та `catalog-import` потрібен **доступний з інтернету** хост: зазвичай **IP сервера + опублікований порт Postgres** (якщо увімкнено expose у панелі / файрвол), або тунель / SSH.

Приклад зовнішнього підключення (плейсхолдери):

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@YOUR_SERVER_IP:5432/your_db?sslmode=disable'
```

`sslmode` вистав за вимогами твого Postgres (інколи `require`).

## Розширення для UUID

Якщо `prisma db push` або міграції скаржаться на `gen_random_uuid`, один раз у БД:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Безпека

- Не коміть реальні паролі в git.
- Публічний порт Postgres відкривай лише якщо свідомо потрібен доступ ззовні; інакше обмеж firewall або працюй через Easypanel/SSH.

## Пов’язані документи

- Наповнення схеми та товарів: [deployment-catalog-import.md](./deployment-catalog-import.md)
- API на Easypanel: [deployment-easypanel-catalog-api.md](./deployment-easypanel-catalog-api.md)
