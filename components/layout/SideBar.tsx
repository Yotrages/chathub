import { Home, MessageCircleMore, Save, Settings, Users, Video } from 'lucide-react'
import React from 'react'
import { UserAvatar } from '../constant/UserAvatar'
import { useSelector } from 'react-redux'
import { RootState } from '@/libs/redux/store'
import Link from 'next/link'

const SideBar = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const sideBarLinks = [
    {
      icon: <Users size={36}/>,
      title: 'friends',
      route: `/profile/${user?._id}/connections`
    },
    {
      icon: <Save size={36}/>,
      title: 'Saved',
      route: '/saved'
    },
    {
      icon: <Home size={36}/>,
      title: 'Feeds',
      route: '/'
    },
    {
      icon: <MessageCircleMore size={36}/>,
      title: 'message',
      route: '/chat'
    },
    {
      icon: <Video size={36}/>,
      title: 'Reels',
      route: '/reels'
    },
    {
      icon: <Settings size={36}/>,
      title: 'Settings',
      route: '/settings'
    },
  ]

  return (
    <div className='flex flex-col h-full w-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-colors duration-200'>
      <div className='flex flex-col items-center w-full px-2 gap-3 py-4'>
        {/* User Profile Link */}
        <Link 
          href={`/profile/${user?._id}`} 
          className='flex items-center gap-2 w-full py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800 pl-2'
        >
          <UserAvatar 
            avatar={user?.avatar} 
            username={user?.username} 
            className='w-9 h-9'
          />
          <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
            {user?.username}
          </p>
        </Link>

        {/* Navigation Links */}
        <div className="w-full space-y-1">
          {sideBarLinks.map((link, index) => (
            <Link 
              href={link.route} 
              key={index} 
              className='flex transition-all duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800 items-center gap-3 w-full py-3 rounded-lg pl-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            >
              <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">{link.icon}</span>
              <span className="font-medium capitalize truncate">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SideBar