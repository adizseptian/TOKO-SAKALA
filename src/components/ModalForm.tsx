import React, { useEffect, useRef } from 'react';

export interface ModalFormProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  ariaLabelledBy?: string;
}

/**
 * ModalForm — Komponen Modal Dialog Formulir Standar TOKO MODE
 * Menggantikan penggunaan window.prompt() secara menyeluruh.
 * Mendukung navigasi keyboard:
 * - Tombol Escape untuk menutup modal
 * - Fokus otomatis pada elemen input pertama saat terbuka
 * - Sentuhan ramah mobile dengan target sentuh minimal 44x44px
 */
export function ModalForm({
  isOpen,
  title,
  onClose,
  children,
  maxWidth = '420px',
  ariaLabelledBy = 'modal-form-title',
}: ModalFormProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Fokus ke elemen interaktif pertama
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={modalRef}
        className="form-card"
        style={{
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '10px',
          }}
        >
          <h3 id={ariaLabelledBy} className="form-card-title" style={{ margin: 0 }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              minHeight: '44px',
              minWidth: '44px',
              fontWeight: 900,
              background: 'transparent',
              border: '1.5px solid var(--line)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--ink)',
            }}
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
