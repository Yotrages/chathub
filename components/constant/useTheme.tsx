'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';

export function useTheme() {
  const { background } = useSelector((state: RootState) => state.auth);
  const textColor = background.includes('gray') ? 'text-gray-800' : 'text-white';
  const secondaryBg = background.includes('gray') ? 'bg-gray-200' : 'bg-blue-200';

  return { background, textColor, secondaryBg };
}