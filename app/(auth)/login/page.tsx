"use client"
import SignIn from '@/components/auth/sign-in'
import { errorNotification } from '@/libs/feedback/notification';
import React from 'react'

const Page = () => {
   const queryParams = new URLSearchParams(window.location.search);
   const error = queryParams.get('error')
   if (error) {
    errorNotification(error)
   }
  return (
    <div className='w-full mx-auto flex items-center justify-center py-6'>
        <SignIn />
    </div>
  )
}

export default Page