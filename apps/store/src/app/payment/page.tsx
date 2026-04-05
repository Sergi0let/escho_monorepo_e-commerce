import { LegalPlaceholder } from '@/components/LegalPlaceholder';

export const metadata = {
  title: 'Оплата — Є що',
  description: 'Способи оплати замовлення',
};

export default function PaymentPage() {
  return (
    <LegalPlaceholder
      title="Оплата"
      lead="Опис прийнятих способів оплати: карта, LiqPay, накладений платіж тощо — додайте під ваші реальні методи."
    />
  );
}
