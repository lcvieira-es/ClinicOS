'use client';

import { useEffect } from 'react';
import { lookupCep } from '@/lib/utils/cep';

export function CepAutoFill() {
  useEffect(() => {
    const cepInput = document.getElementById('cep') as HTMLInputElement | null;
    if (!cepInput) return;
    const handler = async () => {
      const data = await lookupCep(cepInput.value);
      if (!data) return;
      const set = (name: string, val: string) => {
        const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
        if (el) el.value = val;
      };
      set('address', data.logradouro);
      set('complement', data.complemento);
      set('neighborhood', data.bairro);
      set('city', data.localidade);
      set('state', data.uf);
    };
    cepInput.addEventListener('blur', handler);
    return () => cepInput.removeEventListener('blur', handler);
  }, []);
  return null;
}
