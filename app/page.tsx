"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/libs/redux/store";

import { PostList } from "../components/post/PostList";
import { CreatePost } from "../components/post/CreatePost";
import { getCookie } from "cookies-next";
import Header from "@/components/layout/Header";
import StorySection from "@/components/story/StorySection";
import SideBar from "@/components/layout/SideBar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import SuggestedFollow from "@/components/layout/SuggestedFollow";

const HomePage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const validateAuth = async () => {
      const token = getCookie("auth-token");

      if (!token || !isAuthenticated) {
        router.push("/login");
        return;
      }
    };

    validateAuth();
  }, [isAuthenticated, router, dispatch]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-sm transition-transform duration-300 ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-[105%]"
        }`}
      >
        <Header />
      </div>

      <div className="flex">
        <div
          className={`fixed sm:flex hidden left-0 bottom-0 sm:w-[250px] z-40 overflow-y-auto bg-white border-r border-gray-200 transition-all duration-300 ${
            isHeaderVisible ? "top-[88px]" : "top-0"
          }`}
        >
          <SideBar />
        </div>

        <div className="flex-1 sm:ml-[250px] max-w-full overflow-hidden lg:mr-80 min-h-screen pt-24">
          {/* Main Content */}
          <div className="md:py-6 sm:px-6 max-w-full overflow-hidden space-y-6">
            <div className="bg-white px-2 rounded-lg shadow-sm p-6">
              <CreatePost />
            </div>

            <div className="max-w-full overflow-auto">
              <StorySection />
            </div>

            <div className="max-w-full overflow-auto">
              <SuggestedFollow />
            </div>

            <div className="space-y-4 overflow-auto">
              <PostList />
            </div>
          </div>
        </div>

        <div
          className={`fixed right-0 bottom-0 w-80 z-40 overflow-y-auto bg-white border-l border-gray-200 hidden lg:flex flex-col transition-all duration-300 ${
            isHeaderVisible ? "top-[88px]" : "top-0"
          }`}
        >
          <ChatSidebar isHomepage={true} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
