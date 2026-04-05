# catalog-admin (Vite + React 19)

Адмін-панель перенесена з `apps/admin-example` (Next.js): той самий UI (shadcn/Radix), маршрути через **React Router 7**.

## Команди

```bash
# з кореня монорепо
npm run dev -w catalog-admin
npm run build -w catalog-admin
npm run preview -w catalog-admin
```

Дев-сервер: [http://localhost:3003](http://localhost:3003).

## Дані

Табличні дані користувачів / продуктів / платежів — **моки** з `src/mocks/tableMocks.ts` (витягнуті з оригінальних Next-сторінок).

## Відмінності від Next-версії

- `next/image` → `<img>`, `next/link` → `react-router-dom` `Link` (`to` замість `href`).
- `react-day-picker` прибрано через конфлікт peer з React 19; у **Todo List** дата обирається через нативний `<input type="date">` (поведінка збережена).
- Маршрут `/products/:id` — коротка заглушка (у прикладі Next не було сторінки товару).
