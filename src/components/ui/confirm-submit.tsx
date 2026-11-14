'use client';

import type { ReactNode } from 'react';

export function ConfirmSubmitButton({
  children,
  confirm,
  className,
  disabled,
}: {
  children: ReactNode;
  confirm: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
