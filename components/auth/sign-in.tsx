"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";
import { useLogin } from "@/hooks/useFetch";

const SignIn = ({from}: {from?: string}) => {
  const { errors, register, handleSubmit, isLoading, isPending } = useLogin(from);
  const [loading, setLoading] = useState<string | null>(null);
 
  const handleOAuthLogin = (provider: string, intent = 'login') => {
    setLoading(provider);
    
    const state = btoa(JSON.stringify({ 
      intent: intent, 
      redirectUrl: intent === 'register' ? 'login' : 'oauth-success',
      from: from,
      timestamp: Date.now()
    }));
    
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}?state=${state}`;
  };
  return (
    <div className="qy:w-[500px] w-full px-7 flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col gap-8 items-center"
      >
        <div className="flex gap-6 flex-col items-center w-full">
          <div className="flex w-full flex-col gap-4">
            <span className="w-full flex flex-col items-start gap-2">
              <Input
               width="100%"
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

            <span className="w-full flex flex-col gap-2">
              <PasswordInput
              width="100%"
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

            <span className="text-end font-inter font-bold text-sm leading-[150%] text-[#EB5017]">
              Forgot Password?
            </span>
          </div>

          <Button
            text="Sign In"
            loading={isPending || isLoading}
            width="100%"
            py="10px"
            type="submit"
            disabled={isPending}
            variant="gray"
          />
        </div>

        <div className="space-y-2 w-full">
          <Button 
          width="100%"
            onClick={() => handleOAuthLogin('google', 'login')}
            className="w-full"
          >
            {loading === 'google' ? 'Redirecting...' : 'Sign in with Google'}
          </Button>
          <Button 
          width="100%"
            onClick={() => handleOAuthLogin('github', 'login')}
            className="w-full"
          >
            {loading === 'github' ? 'Redirecting...' : 'Sign in with GitHub'}
          </Button>
        </div>

        <span className="text-center flex items-center flex-row gap-2">
          <p className="font-geist font-[400] text-sm leading-[20%] text-[#4B5563]">
            Don&apos;t have an account?
          </p>
          <Link
            href="/register"
            className="font-bold text-sm font-inter leading-[150%] text-[#EB5017]"
          >
            Register
          </Link>
        </span>
      </form>
    </div>
  );
};

export default SignIn;
