import { FileText, Pill, ShieldCheck } from 'lucide-react';
import { requirePortalUser } from '@/lib/auth/guards';
import { getPortalOverview } from '@/lib/portal/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { formatDate } from '@/lib/format';

export default async function PortalDocumentsPage() {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const data = await getPortalOverview(user.id, access.clinicId, access.patientId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={access.clinicName}
        title="Documentos"
        description="Receitas emitidas e documentos registrados pela clínica."
        actions={
          <Badge tone="navy">
            {data.prescriptions.length + data.documents.length} documentos
          </Badge>
        }
      />

      <Alert variant="info" title="Download em preparação" className="mb-5">
        A visualização dos documentos está disponível. O download com URL assinada
        será habilitado junto com a integração de armazenamento seguro, na próxima
        etapa.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Receitas"
            description="Prescrições emitidas e assinadas."
            action={<Badge tone="mint">{data.prescriptions.length}</Badge>}
          />
          <CardBody className="space-y-3">
            {data.prescriptions.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="Nenhuma receita disponível"
                description="Receitas emitidas pelo profissional aparecerão aqui."
                className="py-6"
              />
            ) : (
              data.prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="rounded-xl border border-line bg-sky-25 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-navy-900">
                        {prescription.medication_names ?? 'Prescrição'}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-400">
                        Emitida em {formatDate(prescription.issued_at)} ·{' '}
                        <span className="capitalize">{prescription.type}</span>
                      </p>
                    </div>
                    <StatusBadge status={prescription.status} />
                  </div>
                  {prescription.verification_code ? (
                    <p className="mt-2 inline-flex items-center gap-1 rounded bg-white px-2 py-1 font-mono text-[9px] text-ink-500 ring-1 ring-line">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Código: {prescription.verification_code}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Outros documentos"
            description="Atestados, laudos e arquivos registrados."
            action={<Badge tone="navy">{data.documents.length}</Badge>}
          />
          <CardBody className="space-y-3">
            {data.documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhum documento disponível"
                description="Documentos registrados pela clínica aparecerão aqui."
                className="py-6"
              />
            ) : (
              data.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-start gap-2.5 rounded-xl border border-line bg-sky-25 px-3 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-navy-800 ring-1 ring-line">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-navy-900">
                      {document.title}
                    </p>
                    <p className="mt-0.5 text-[10px] capitalize text-ink-400">
                      {document.document_type} · {formatDate(document.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-5 text-[10px] text-ink-400">
        Documentos clínicos são mantidos conforme o prazo legal de guarda e as
        políticas de privacidade da clínica.
      </p>
    </div>
  );
}
