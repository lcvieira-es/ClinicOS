import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    return NextResponse.json({ erro: true }, { status: 400 });
  }

  // Tenta BrasilAPI primeiro (mais confiável em ambientes locais), depois ViaCEP.
  const sources = [
    async () => {
      const res = await fetch('https://brasilapi.com.br/api/cep/v1/' + digits, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (d.erro || !d.street) return null;
      return {
        cep: d.cep,
        logradouro: d.street,
        complemento: '',
        bairro: d.neighborhood || '',
        localidade: d.city,
        uf: d.state,
        erro: false,
      };
    },
    async () => {
      const res = await fetch('https://viacep.com.br/ws/' + digits + '/json/', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const d = await res.json();
      if (d.erro) return null;
      return d;
    },
  ];

  for (const source of sources) {
    try {
      const data = await source();
      if (data) return NextResponse.json(data);
    } catch {
      // tenta a próxima fonte
    }
  }

  return NextResponse.json({ erro: true }, { status: 502 });
}
