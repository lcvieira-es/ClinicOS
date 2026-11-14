import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listInventoryItems, listInventoryUnits } from '@/lib/clinic/estoque';
import { createInventoryItemAction, addInventoryMovementAction } from '@/lib/clinic/actions/estoque';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/format';

export const metadata = { title: 'Estoque' };

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('estoque');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('estoque:create');
  const canEdit = access.permissions.has('estoque:edit');

  const [items, units] = await Promise.all([
    listInventoryItems(user.id, user.activeClinicId),
    listInventoryUnits(user.id, user.activeClinicId),
  ]);

  const lowStock = items.filter((item) => item.is_low);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Gestão"
        title="Estoque"
        description="Itens, movimentações e alertas de mínimo."
      />

      {sp.erro ? (
        <Alert variant="danger" className="mb-4">
          {decodeURIComponent(sp.erro)}
        </Alert>
      ) : null}
      {sp.msg ? (
        <Alert variant="success" className="mb-4">
          {decodeURIComponent(sp.msg)}
        </Alert>
      ) : null}

      {lowStock.length > 0 ? (
        <Alert variant="warning" className="mb-4" title={`${lowStock.length} item(ns) abaixo do mínimo`}>
          {lowStock.map((item) => item.name).join(', ')}.
        </Alert>
      ) : null}

      <Card>
        <CardHeader title="Itens" description={`${items.length} registro(s)`} />
        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum item cadastrado"
              description="Cadastre o primeiro item do estoque."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th className="hidden md:table-cell">Categoria</Th>
                    <Th>Quantidade</Th>
                    <Th className="hidden sm:table-cell">Mínimo</Th>
                    <Th className="hidden lg:table-cell">Custo unit.</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">{item.name}</p>
                        {item.sku ? (
                          <p className="text-[10px] text-ink-400">SKU: {item.sku}</p>
                        ) : null}
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">{item.category ?? '—'}</span>
                      </Td>
                      <Td>
                        <span className={`text-xs font-semibold ${item.is_low ? 'text-red-600' : 'text-navy-900'}`}>
                          {item.quantity} {item.unit_of_measure}
                        </span>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="text-xs text-ink-600">
                          {item.minimum_quantity} {item.unit_of_measure}
                        </span>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <span className="text-xs text-ink-600">{formatCurrency(item.unit_cost)}</span>
                      </Td>
                      <Td>
                        <StatusBadge status={item.status} />
                        {item.is_low ? <Badge tone="danger" className="ml-1">Baixo</Badge> : null}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </CardBody>
      </Card>

      {canCreate ? (
        <Card id="novo" className="mt-5">
          <CardHeader title="Novo item" description="Cadastre um item no estoque." />
          <CardBody>
            <form action={createInventoryItemAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome *" htmlFor="name">
                  <Input id="name" name="name" required minLength={2} />
                </Field>
                <Field label="Categoria" htmlFor="category">
                  <Input id="category" name="category" />
                </Field>
                <Field label="SKU" htmlFor="sku">
                  <Input id="sku" name="sku" />
                </Field>
                <Field label="Unidade de medida" htmlFor="unitOfMeasure">
                  <Input id="unitOfMeasure" name="unitOfMeasure" defaultValue="un" required />
                </Field>
                <Field label="Quantidade inicial" htmlFor="quantity">
                  <Input id="quantity" name="quantity" inputMode="decimal" defaultValue="0" />
                </Field>
                <Field label="Quantidade mínima" htmlFor="minimumQuantity">
                  <Input id="minimumQuantity" name="minimumQuantity" inputMode="decimal" defaultValue="0" />
                </Field>
                <Field label="Custo unitário (R$)" htmlFor="unitCost">
                  <Input id="unitCost" name="unitCost" inputMode="decimal" defaultValue="0" />
                </Field>
                <Field label="Preço de venda (R$)" htmlFor="salePrice">
                  <Input id="salePrice" name="salePrice" inputMode="decimal" />
                </Field>
                <Field label="Fornecedor" htmlFor="supplier">
                  <Input id="supplier" name="supplier" />
                </Field>
                <Field label="Lote" htmlFor="batch">
                  <Input id="batch" name="batch" />
                </Field>
                <Field label="Validade" htmlFor="expiresAt">
                  <Input id="expiresAt" name="expiresAt" type="date" />
                </Field>
                <Field label="Localização" htmlFor="location">
                  <Input id="location" name="location" />
                </Field>
                <Field label="Unidade" htmlFor="unitId">
                  <Select id="unitId" name="unitId" defaultValue="">
                    <option value="">—</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
                >
                  Cadastrar item
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {canEdit && items.length > 0 ? (
        <Card className="mt-5">
          <CardHeader title="Movimentação" description="Entrada, saída, ajuste ou perda." />
          <CardBody>
            <form action={addInventoryMovementAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Item *" htmlFor="itemId">
                  <Select id="itemId" name="itemId" required defaultValue="">
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo *" htmlFor="type">
                  <Select id="type" name="type" required defaultValue="entrada">
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="ajuste">Ajuste</option>
                    <option value="perda">Perda</option>
                  </Select>
                </Field>
                <Field label="Quantidade *" htmlFor="quantity">
                  <Input id="quantity" name="quantity" inputMode="decimal" required placeholder="10" />
                </Field>
                <Field label="Custo unitário (R$)" htmlFor="unitCost">
                  <Input id="unitCost" name="unitCost" inputMode="decimal" />
                </Field>
                <Field label="Motivo" htmlFor="reason">
                  <Input id="reason" name="reason" />
                </Field>
                <Field label="Referência" htmlFor="reference">
                  <Input id="reference" name="reference" />
                </Field>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
                >
                  Registrar movimentação
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
