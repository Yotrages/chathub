// components/common/UserAvatar.tsx
'use client';
import { cn } from '@/libs/utils';

interface UserAvatarProps {
  username: string | undefined;
  avatar: string | null | undefined;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLImageElement | HTMLDivElement>;
}

export const UserAvatar = ({ username, avatar, className, onClick }: UserAvatarProps) => {
  if (avatar) {
    return (
      <img
      onClick={onClick}
        src={avatar}
        alt={username || 'User avatar'}
        className={cn('rounded-full object-cover cursor-pointer', className)}
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
    onClick={onClick}
      className={cn(
        'bg-gradient-to-br cursor-pointer from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center',
        className
      )}
    >
      <span className="text-xs font-medium">{initials}</span>
    </div>
  );
};