"use client"
import SignIn from '@/components/auth/sign-in'
import { errorNotification } from '@/libs/feedback/notification';
import { useSearchParams } from 'next/navigation';
import React from 'react'

const Page = () => {
   const queryParams = useSearchParams()
   const error = queryParams.get('error')
   const from = queryParams.get('from')
   if (error) {
    errorNotification(error)
   }
   
  return (
    <div className='w-full mx-auto flex items-center justify-center py-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
        <SignIn from={from ? from : undefined}/>
    </div>
  )
}

export default Page