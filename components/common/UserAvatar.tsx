// components/common/UserAvatar.tsx
'use client';
import { cn } from '@/libs/utils';

interface UserAvatarProps {
  username: string | undefined;
  avatar: string | null | undefined;
  className?: string;
}

export const UserAvatar = ({ username, avatar, className }: UserAvatarProps) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username || 'User avatar'}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  let initials = '';
  if (username) {
    initials = username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  } else {
    initials = '?';
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center',
        className
      )}
    >
      <span className="text-xs font-medium">{initials}</span>
    </div>
  );
};