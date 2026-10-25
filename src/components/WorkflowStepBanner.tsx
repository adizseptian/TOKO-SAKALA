import { HelpCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface WorkflowStepBannerProps {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  ruleTip?: string;
  onOpenGuide: () => void;
}

const STEP_COLORS: Record<1 | 2 | 3 | 4, {
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  bgColor: string;
}> = {
  1: {
    badgeBg: 'bg-[#ffeae5] dark:bg-[#e06346]/25',
    badgeText: 'text-[#8c2612] dark:text-[#ff927f]',
    borderColor: 'border-[#fccfca] dark:border-[#ff725e]/30',
    bgColor: 'bg-[#fff7f5] dark:bg-[#16223b]/60'
  },
  2: {
    badgeBg: 'bg-[#e7f7f0] dark:bg-[#2dd4bf]/25',
    badgeText: 'text-[#056045] dark:text-[#5eead4]',
    borderColor: 'border-[#c3ecdc] dark:border-[#2dd4bf]/30',
    bgColor: 'bg-[#f4fbf8] dark:bg-[#16223b]/60'
  },
  3: {
    badgeBg: 'bg-[#f2eafa] dark:bg-[#a78bfa]/25',
    badgeText: 'text-[#5519b5] dark:text-[#c4b5fd]',
    borderColor: 'border-[#e0cef7] dark:border-[#a78bfa]/30',
    bgColor: 'bg-[#faf6fd] dark:bg-[#16223b]/60'
  },
  4: {
    badgeBg: 'bg-[#eaf4fb] dark:bg-[#38bdf8]/25',
    badgeText: 'text-[#034f78] dark:text-[#7dd3fc]',
    borderColor: 'border-[#c5e1f7] dark:border-[#38bdf8]/30',
    bgColor: 'bg-[#f5fafe] dark:bg-[#16223b]/60'
  }
};

export function WorkflowStepBanner({
  step,
  title,
  subtitle,
  ruleTip,
  onOpenGuide
}: WorkflowStepBannerProps) {
  const theme = STEP_COLORS[step];

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border ${theme.borderColor} ${theme.bgColor} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print-hidden`}>
      <div className="flex items-start gap-3">
        <span className={`w-7 h-7 rounded-xl ${theme.badgeBg} ${theme.badgeText} text-xs font-black flex items-center justify-center shrink-0 mt-0.5`}>
          {step}
        </span>
        <div className="space-y-0.5">
          <div className="flex items-center flex-wrap gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.badgeText}`}>
              Langkah {step} dari 4 Alur Toko
            </span>
            <span className="text-[10px] text-[var(--text-dim)] hidden sm:inline">·</span>
            <strong className="text-xs font-bold text-[var(--text-main)]">
              {title}
            </strong>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {subtitle}
          </p>
          {ruleTip && (
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
              <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{ruleTip}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenGuide}
        className="sakala-btn sakala-btn-secondary text-[11px] h-8 px-3 rounded-xl shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        title="Buka penjelasan alur lengkap 4 langkah Toko Sakala"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span>Panduan Alur Toko</span>
      </button>
    </div>
  );
}
