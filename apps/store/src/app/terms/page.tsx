import { LegalPlaceholder } from '@/components/LegalPlaceholder';

export const metadata = {
  title: 'Публічна оферта — Є що',
};

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Публічна оферта"
      lead="Договір публічної оферти між продавцем і покупцем: предмет, порядок оформлення, оплата, доставка, відповідальність сторін."
    />
  );
}
