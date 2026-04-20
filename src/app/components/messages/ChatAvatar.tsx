import { Truck, Package } from 'lucide-react';
import type { ChatContact } from '../../api/chatStore';
import { getInitials } from './helpers';

interface ChatAvatarProps {
  contact: ChatContact;
  hasUnread: boolean;
  size?: number;
}

export function ChatAvatar({ contact, hasUnread, size = 52 }: ChatAvatarProps) {
  const initials = getInitials(contact.name);

  return (
    <div className="relative shrink-0">
      {contact.avatar ? (
        <img
          src={contact.avatar}
          alt={contact.name}
          className="object-cover rounded-2xl"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-2xl flex items-center justify-center font-black text-[15px] text-white"
          style={{
            width: size,
            height: size,
            background: hasUnread
              ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
              : 'linear-gradient(135deg, #1e3a5f, #243b55)',
          }}
        >
          {initials || '?'}
        </div>
      )}
      {contact.online ? (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0e1621]" />
      ) : (
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-xl flex items-center justify-center border-2 border-[#0e1621]"
          style={{ background: contact.role === 'driver' ? '#5ba3f5' : '#10b981' }}
        >
          {contact.role === 'driver'
            ? <Truck className="w-2.5 h-2.5 text-white" />
            : <Package className="w-2.5 h-2.5 text-white" />
          }
        </div>
      )}
    </div>
  );
}
