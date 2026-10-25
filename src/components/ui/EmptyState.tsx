import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)]/50">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary)]/10 text-[var(--accent-mint)] border border-[var(--primary)]/20 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[var(--text-main)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
