'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, Input } from '@/components/ui/input';

interface Professional {
  id: string;
  name: string;
}

export function ConsultasFilter({ professionals }: { professionals: Professional[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const de = searchParams.get('de') ?? '';
  const ate = searchParams.get('ate') ?? '';
  const situacao = searchParams.get('situacao') ?? '';
  const profissional = searchParams.get('profissional') ?? '';

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/app/consultas?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
          De
        </label>
        <Input
          type="date"
          defaultValue={de}
          onChange={(e) => update('de', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
          Até
        </label>
        <Input
          type="date"
          defaultValue={ate}
          onChange={(e) => update('ate', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
          Situação
        </label>
        <Select
          value={situacao}
          onChange={(e) => update('situacao', e.target.value)}
          className="w-full"
        >
          <option value="">Todas as situações</option>
          <option value="agendada">Agendada</option>
          <option value="confirmada">Confirmada</option>
          <option value="aguardando">Aguardando</option>
          <option value="em_atendimento">Em atendimento</option>
          <option value="realizada">Realizada</option>
          <option value="cancelada">Cancelada</option>
          <option value="faltou">Faltou</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
          Profissional
        </label>
        <Select
          value={profissional}
          onChange={(e) => update('profissional', e.target.value)}
          className="w-full"
        >
          <option value="">Todos os profissionais</option>
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
