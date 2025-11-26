"use client"
import { PostItem } from '@/components/post/PostItem'
import { useGetSinglePost } from '@/hooks/usePosts'
import { RootState } from '@/libs/redux/store'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

const PostPage = () => {

    const router = useRouter()
    const params = useParams()
    const { id } = params
    const { posts } = useSelector((state: RootState) => state.post)
    const { data, trigger } = useGetSinglePost(id as string)

    useEffect(() => {
      trigger();
    }, [])

    const reduxPost = posts.find((post) => post._id === id)
    const post = data?.post || reduxPost
     if (!post) {
    return (
      <div className="min-h-screen bg-black dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-white mb-4">{'Post not found'}</p>
          <div onClick={() => router.back()} className="text-blue-400 hover:text-blue-300 cursor-pointer">
            Go back
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className='max-w-4xl min-h-screen w-full items-center mx-auto justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
        <PostItem post={post} isModal={true}/>
    </div>
  )
}

export default PostPage