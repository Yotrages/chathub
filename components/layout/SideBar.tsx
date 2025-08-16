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
      route: `/profile/${user?.id}/connections`
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
    <div className='flex flex-col h-full w-full'>
      <div className='flex flex-col items-center w-full px-2 gap-3 py-4'>
        {/* User Profile Link */}
        <Link 
          href={`/profile/${user?.id}`} 
          className='flex items-center gap-2 w-full py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-100 pl-2'
        >
          <UserAvatar 
            avatar={user?.avatar} 
            username={user?.username || user?.name} 
            className='w-9 h-9'
          />
          <p className="font-medium text-gray-800 truncate">
            {user?.username || user?.name}
          </p>
        </Link>

        {/* Navigation Links */}
        <div className="w-full space-y-1">
          {sideBarLinks.map((link, index) => (
            <Link 
              href={link.route} 
              key={index} 
              className='flex transition-all duration-300 ease-in-out hover:bg-gray-100 items-center gap-3 w-full py-3 rounded-lg pl-2 text-gray-700 hover:text-gray-900'
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span className="font-medium capitalize truncate">{link.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SideBar