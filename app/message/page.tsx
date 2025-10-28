"use client";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatProfile } from "@/components/chat/ChatProfile";
import { useState, useEffect } from "react";

export default function Page() {
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const setVH = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      } else {
        // Fallback to innerHeight
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }
    };

    setVH();

    // Listen to visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVH);
      window.visualViewport.addEventListener("scroll", setVH);
    }

    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVH);
        window.visualViewport.removeEventListener("scroll", setVH);
      }
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100 w-full max-w-full overflow-hidden"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          height: "calc(var(--vh) * 100)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <ChatWindow onShowProfile={() => setShowProfile(true)} />
      </div>
      {showProfile && <ChatProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}
