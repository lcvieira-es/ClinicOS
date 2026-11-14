import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import IaPageClient from './ia-client';

export const metadata = { title: 'Assistente de IA' };

export default async function IaPage() {
  const access = await requireModule('ia');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }
  return <IaPageClient />;
}
