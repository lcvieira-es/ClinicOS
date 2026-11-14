import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { UnitForm } from '@/components/clinic/unit-form';

export const metadata = { title: 'Nova unidade' };

export default async function NewUnitPage() {
  const access = await requireModule('unidades');
  if (!access.allowed || !access.permissions.has('unidades:create')) {
    return <AccessRestricted homeHref="/app/unidades" homeLabel="Voltar" />;
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Nova unidade"
        description="Matriz, filial ou consultório vinculado à clínica."
        actions={
          <ButtonLink href="/app/unidades" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <UnitForm mode="create" />
        </CardBody>
      </Card>
    </div>
  );
}
