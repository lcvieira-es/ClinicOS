'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Confirmação de exclusão para botões `.delete-trigger` em tabelas.
 *
 * Usa delegação de eventos em `document` dentro de `useEffect`, então funciona
 * tanto em carga total quanto em navegação client-side (o React não re-executa
 * `<script>` injetado ao trocar de rota). O modal é renderizado via portal em
 * `document.body`, ficando fora de qualquer boundary de Suspense.
 */
export function DeleteConfirm() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pendingForm = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setMounted(true);

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target && target.closest ? target.closest('.delete-trigger') : null;
      if (!trigger) return;
      event.preventDefault();
      pendingForm.current = trigger.closest('form');
      setOpen(true);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!mounted) return null;

  function close() {
    setOpen(false);
    pendingForm.current = null;
  }

  function confirm() {
    const form = pendingForm.current;
    close();
    if (form) form.requestSubmit();
  }

  return createPortal(
    open ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar exclusão"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '384px',
            borderRadius: '12px',
            background: '#fff',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Confirmar exclusão!
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={close}
              style={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '8px 16px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#334155',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Não
            </button>
            <button
              type="button"
              onClick={confirm}
              style={{
                borderRadius: '8px',
                background: '#dc2626',
                padding: '8px 16px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
}
