import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  isLoading,
  onConfirm,
  onClose,
}) => (
  <Modal
    isOpen={isOpen}
    title={title}
    onClose={onClose}
    className="max-w-md"
    footer={
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" isLoading={isLoading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    }
  >
    <div className="flex gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  </Modal>
);
