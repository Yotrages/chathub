import { Home, MessageCircleMore, Save, Settings, Users, Video } from 'lucide-react'
import React from 'react'
import { UserAvatar } from '../constant/UserAvatar'
import { useSelector } from 'react-redux'
import { RootState } from '@/libs/redux/store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SideBar = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const pathname = usePathname()

  const sideBarLinks = [
    {
      icon: <Home size={20} />,
      title: 'Feeds',
      route: '/'
    },
    {
      icon: <MessageCircleMore size={20} />,
      title: 'Messages',
      route: '/chat'
    },
    {
      icon: <Users size={20} />,
      title: 'Friends',
      route: `/profile/${user?._id}/connections`
    },
    {
      icon: <Video size={20} />,
      title: 'Reels',
      route: '/reels'
    },
    {
      icon: <Save size={20} />,
      title: 'Saved',
      route: '/saved'
    },
    {
      icon: <Settings size={20} />,
      title: 'Settings',
      route: '/settings'
    },
  ]

  return (
    <div className='flex flex-col h-full w-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-colors duration-200'>
      
      {/* User Profile Section */}
      <div className='px-3 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800'>
        <Link
          href={`/profile/${user?._id}`}
          className='flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group'
        >
          <div className="relative flex-shrink-0">
            <UserAvatar
              avatar={user?.avatar}
              username={user?.username}
              className='w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-gray-300 dark:group-hover:ring-gray-600 transition-all duration-200'
            />
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
              {user?.username}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">View profile</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className='flex flex-col flex-1 px-3 py-4 gap-0.5 overflow-y-auto'>
        {sideBarLinks.map((link, index) => {
          const isActive = pathname === link.route

          return (
            <Link
              href={link.route}
              key={index}
              className={`
                flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                transition-all duration-200 ease-in-out group relative
                ${isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gray-700 dark:bg-gray-300 rounded-r-full" />
              )}

              <span className={`
                flex-shrink-0 transition-transform duration-200 group-hover:scale-110
                ${isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}
              `}>
                {link.icon}
              </span>

              <span className="font-medium text-sm capitalize tracking-wide truncate">
                {link.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default SideBar
