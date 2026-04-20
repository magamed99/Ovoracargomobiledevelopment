import { MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  isSearch: boolean;
  hint: string;
}

export function EmptyState({ isSearch, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 px-8">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
        <MessageSquare className="w-9 h-9 text-[#607080]" />
      </div>
      <div className="text-center">
        <p className="text-[16px] font-black text-white">
          {isSearch ? 'Ничего не найдено' : 'Нет сообщений'}
        </p>
        {!isSearch && (
          <p className="text-[13px] text-[#607080] mt-1.5 leading-snug">{hint}</p>
        )}
      </div>
    </div>
  );
}
