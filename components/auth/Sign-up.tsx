"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";
import { AvatarUpload } from "../chat/FileUpload"; // Import your custom component
import { useRegister } from "@/hooks/useFetch";

const SignUp = () => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
 
  const handleOAuthLogin = (provider: string, intent = 'login') => {
    setLoading(provider);
    
    // Create state parameter with intent and redirect info
    const state = btoa(JSON.stringify({ 
      intent: intent, // 'login' or 'register'
      redirectUrl: intent === 'register' ? '/welcome' : '/dashboard',
      timestamp: Date.now() // for additional security
    }));
    
    // Redirect to OAuth endpoint with state
    window.location.href = `http://localhost:5000/api/users/auth/${provider}?state=${state}`;
  };
  const { errors, register, handleSubmit, isLoading, isPending, formMethods } = useRegister();

  // Handle avatar file selection
  const handleAvatarSelect = (file: File | null) => {
    setAvatarFile(file);
    // Update the form value
    formMethods.setValue('avatar', file);
  };

  // Custom submit handler
  const onSubmit = async (data: any) => {
    try {
      // The data will include the file object
      // Your API hook should handle FormData conversion
      const submitData = {
        ...data,
        avatar: avatarFile // This will be the File object
      };

      console.log('Submitting:', submitData);
      
      // Call your API
      await handleSubmit?.(submitData);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="qy:w-[500px] w-full px-7 flex flex-col items-center justify-center">
      <form
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="w-full px-8 flex flex-col gap-8 items-center"
      >
        <div className="flex gap-6 flex-col items-center w-full">
          <div className="flex w-full flex-col gap-4">
            <span className="w-full flex flex-col items-start gap-2">
              <Input
                label="Email"
                placeholder="Enter email address"
                register={register("email")}
              />
              {errors.email && (
                <p className="text-red-500">
                  {errors.email.message}
                </p>
              )}
            </span>

            {/* Custom File Upload Component */}
            <AvatarUpload
              label="Profile Avatar"
              accept="image/*"
              onFileSelect={handleAvatarSelect}
              error={errors.avatar?.message}
              preview={true}
              maxSize={5}
            />

            <span className="w-full flex flex-col items-start gap-2">
              <Input
                label="Username"
                placeholder="Enter username"
                register={register("username")}
              />
              {errors.username && (
                <p className="text-red-500">
                  {errors.username.message}
                </p>
              )}
            </span>

            <span className="w-full flex flex-col items-start gap-2">
              <PasswordInput
                label="Password"
                placeholder="****************"
                register={register("password")}
              />
              {errors.password && (
                <p className="text-red-500">
                  {errors.password.message}
                </p>
              )}
            </span>

             <div className="space-y-2">
          <Button 
            onClick={() => handleOAuthLogin('google', 'register')}
            className="w-full"
            variant="filled"
          >
            {loading === 'google' ? 'Redirecting...' : 'Sign up with Google'}
          </Button>
          <Button 
            onClick={() => handleOAuthLogin('github', 'register')}
            className="w-full"
            variant="filled"
          >
            {loading === 'github' ? 'Redirecting...' : 'Sign up with GitHub'}
          </Button>
        </div>

            <span className="text-end font-inter font-bold text-xs leading-[150%] text-[#EB5017]">
              Forgot Password?
            </span>
          </div>

          <Button
            text="Sign Up"
            loading={isPending || isLoading}
            width="100%"
            py="10px"
            type="submit"
            disabled={isPending}
            variant="gray"
          />
        </div>
        <span className="text-center flex items-center flex-row gap-2">
          <p className="font-geist font-[400] text-sm leading-[20%] text-[#4B5563]">
            Already have an account?
          </p>
          <Link
            href="/login"
            className="font-bold text-xs font-inter leading-[150%] text-[#EB5017]"
          >
            Login
          </Link>
        </span>
      </form>
    </div>
  );
};

export default SignUp;