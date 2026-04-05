import { LegalPlaceholder } from '@/components/LegalPlaceholder';

export const metadata = {
  title: 'Контакти — Є що',
};

export default function ContactsPage() {
  return (
    <LegalPlaceholder title="Контакти" lead="Телефон, email, графік роботи, адреса шоуруму (за наявності) — замініть на дійсні контакти.">
      <ul className="mt-4 list-inside list-disc space-y-1">
        <li>Телефон: +380 (00) 000-00-00</li>
        <li>Email: hello@example.com</li>
        <li>Пн–Пт: 10:00 — 19:00</li>
      </ul>
    </LegalPlaceholder>
  );
}
