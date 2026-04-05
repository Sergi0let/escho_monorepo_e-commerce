/** Головні посилання в хедері (як у типових інтернет-магазинах). */
export const headerNavLinks = [
  { href: '/', label: 'Головна' },
  { href: '/#catalog', label: 'Каталог' },
  { href: '/about', label: 'Про нас' },
  { href: '/delivery', label: 'Доставка' },
  { href: '/payment', label: 'Оплата' },
  { href: '/returns', label: 'Повернення' },
  { href: '/contacts', label: 'Контакти' },
] as const;

/** Посилання для футера та мобільного меню (повний список). */
export const shopInfoLinks = [
  { href: '/about', label: 'Про нас' },
  { href: '/delivery', label: 'Доставка' },
  { href: '/payment', label: 'Оплата' },
  { href: '/returns', label: 'Повернення та обмін' },
  { href: '/warranty', label: 'Гарантія' },
  { href: '/contacts', label: 'Контакти' },
  { href: '/privacy', label: 'Конфіденційність' },
  { href: '/terms', label: 'Публічна оферта' },
] as const;
