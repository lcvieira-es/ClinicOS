import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listWhatsappMessages, listWhatsappPatients } from '@/lib/clinic/whatsapp';
import WhatsappPageClient from './whatsapp-client';

export const metadata = { title: 'WhatsApp' };

export default async function WhatsappPage() {
  const access = await requireModule('whatsapp');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const user = access.user;
  const [messages, patients] = await Promise.all([
    listWhatsappMessages(user.id, user.activeClinicId),
    listWhatsappPatients(user.id, user.activeClinicId),
  ]);

  return <WhatsappPageClient messages={messages} patients={patients} />;
}
