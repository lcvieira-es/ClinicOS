'use client';

import { useEffect } from 'react';
import { formatPhoneBR } from '@/lib/utils/phone';

export function PhoneAutoFill() {
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target || target.tagName !== 'INPUT') return;
      if (target.name !== 'phone' && target.name !== 'whatsapp') return;
      target.value = formatPhoneBR(target.value);
    };
    document.addEventListener('input', handler);
    return () => document.removeEventListener('input', handler);
  }, []);
  return null;
}
