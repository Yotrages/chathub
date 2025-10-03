'use client';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Monitor, Check } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 transition-colors duration-300">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
            ${theme === value 
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-600/50'
            }
          `}
          title={`Switch to ${label} theme`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};

export const ThemeToggleDropdown = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        {currentTheme && <currentTheme.icon size={18} className="text-gray-600 dark:text-gray-400" />}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              {themes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-200
                    ${theme === value 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={16} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  {theme === value && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;