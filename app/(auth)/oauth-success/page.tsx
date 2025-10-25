"use client";
import { setUserCredentials } from "@/libs/redux/authSlice";
import { AppDispatch } from "@/libs/redux/store";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

const OAuthSuccess = () => {
  const router = useRouter();
  const hasRun = useRef(false);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    const name = queryParams.get("name");
    const id = queryParams.get("id");
    const email = queryParams.get("email");
    const avatar = queryParams.get("avatar");
    const from = queryParams.get("from");

    console.log("Received:", { token, name, email });

    if (token && name && email && id && avatar) {
      setCookie("auth-token", token);
      dispatch(
        setUserCredentials({
          user: {
            _id: id,
            email: email,
            username: name,
            online: true,
            avatar: avatar,
          },
        })
      );

      router.push(from && from || '/');
    } else {
      console.error("OAuth data missing from URL");
      router.push(
        `/login?error=${encodeURIComponent("OAuth data missing from URL")}`
      );
    }
  }, [router, dispatch]);

  return <p>Logging you in...</p>;
};

export default OAuthSuccess;
