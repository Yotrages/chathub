"use client"
import SignUp from '@/components/auth/Sign-up'
import { errorNotification } from '@/libs/feedback/notification';
import React from 'react'

const Page = () => {
   const queryParams = new URLSearchParams(window.location.search);
     const error = queryParams.get('error')
     if (error) {
      errorNotification(error)
     }
  return (
    <div className='w-full mx-auto flex items-center justify-center py-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
        <SignUp />
    </div>
  )
}

export default Page