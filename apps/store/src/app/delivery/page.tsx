import { LegalPlaceholder } from '@/components/LegalPlaceholder';

export const metadata = {
  title: 'Доставка — Є що',
  description: 'Умови та терміни доставки',
};

export default function DeliveryPage() {
  return (
    <LegalPlaceholder
      title="Доставка"
      lead="Тут будуть терміни відправлення, зони доставки, перевізники (Нова Пошта, Укрпошта тощо) та вартість."
    />
  );
}
