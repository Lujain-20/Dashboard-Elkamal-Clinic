// src/hooks/useConfirm.tsx
import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; message: string } & ConfirmOptions>({
    open: false,
    message: '',
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    setState({ open: true, message, ...options });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(true);
    resolver.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(false);
    resolver.current = null;
  }, []);

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={state.open}
      message={state.message}
      title={state.title}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      danger={state.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogElement };
}