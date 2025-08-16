import { useGetSuggestedUsers } from '@/hooks/useUser'
import { RootState } from '@/libs/redux/store'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { UserAvatar } from '../constant/UserAvatar'
import { ArrowRight } from 'lucide-react'

const SuggestedFollow = () => {

    const { suggestedUsers, pagination } = useSelector((state: RootState) => state.auth)
    const { trigger } = useGetSuggestedUsers(pagination?.currentPage || 1)
    const hasMore = pagination?.hasNextPage ?? false

    useEffect(() => {
      trigger()
    }, [])
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">People you may like to follow</h2>
          </div>
          {/* Horizontal scrollable users */}
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedUsers && suggestedUsers.map((user, index) => (
              <Link key={index} className='flex flex-col gap-2 items-start' href={user.id}>
                <UserAvatar username={user.username || user.name} avatar={user.avatar}/>
                <p className='text-gray-600 font-inter font-semibold'>{user.username || user.name}</p>
              </Link>
            ))}
            {hasMore && (
                <button onClick={() => trigger()} className='py-3 px-2'>
                    <ArrowRight />
                </button>
            )}
          </div>
        </div>
  )
}

export default SuggestedFollow