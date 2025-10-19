"use client"

import { User } from "@/types"
import { getCookie, setCookie } from "cookies-next";
import { createContext, useContext, useState } from "react";

interface Awesome {
    user: Partial<User> | null
    token: string | null;
    setUserCV: (user: Partial<User>, token: string) => void
    logout: () => void;
}

const AwesomeContext = createContext<Awesome>({
    user: null,
    token: null,
    setUserCV: (user: Partial<User>, token: string) => {},
    logout() {    
    },
})

export const useAwesome = () => {
    const context = useContext(AwesomeContext)
    if (!context) {
        throw new Error("no authentication provider")
    }
    return context
}

interface AwesomeProviderProps {
    children: React.ReactNode;
}

export const AwesomeProvider = ({children}: AwesomeProviderProps) => {
    const [user, setUser] = useState<Partial<User> | null>(null)
    const setUserCV = (user: Partial<User>, token: string) => {
        setUser(user)
        setCookie('token', token)
    }

    const token = JSON.stringify(getCookie('token'))
    const logout = () => {
        setUser(null)
        setCookie('token', '')
    }
    return (
        <AwesomeContext.Provider value={{user, token, setUserCV, logout}}>
            {children}
        </AwesomeContext.Provider>
    )
} 