"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    orgId: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    orgId: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth State Changed. User UID:", user?.uid);
            setUser(user);
            if (user) {
                // Fetch user doc to get orgId
                try {
                    console.log("Fetching user doc for UID:", user.uid);
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        console.log("User doc found. orgId:", data.orgId);
                        setOrgId(data.orgId);
                    } else {
                        console.warn("User doc NOT found in Firestore 'users' collection for UID:", user.uid);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                }
            } else {
                setOrgId(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, orgId }}>
            {children}
        </AuthContext.Provider>
    );
};
