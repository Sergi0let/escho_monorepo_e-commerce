import { LegalPlaceholder } from '@/components/LegalPlaceholder';

export const metadata = {
  title: 'Політика конфіденційності — Є що',
};

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Політика конфіденційності"
      lead="Обробка персональних даних згідно з законом України «Про захист персональних даних», cookie, права користувачів — розмістіть затверджений юридично текст."
    />
  );
}
