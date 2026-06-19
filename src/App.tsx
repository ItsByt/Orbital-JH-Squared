import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import { createClient, type Session } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { Theme } from "@/components/ThemeComponents/Theme";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Welcome from "@/pages/authentication/Welcome";
import Register from "@/pages/authentication/Register";
import Login from "@/pages/authentication/Login";
import Layout from "@/components/GeneralComponents/Layout";
import TimetablePage from "@/pages/webpages/Timetable";
import Planner from "@/pages/webpages/Planner";
import Courses from "@/pages/webpages/Courses";
import Pre_Requisite from "@/pages/webpages/Pre_Requisite";
import Settings from "@/pages/webpages/Settings";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const queryClient = new QueryClient();

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        //Used to upload ui and session
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        //Only runs when component is cleaned up or closed
        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">
                    Checking session...
                </span>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Theme defaultTheme="dark" storageKey="nusmods-plus-theme">
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={session ? <Layout /> : <Login />}>
                            <Route
                                path="/timetable/sem-1"
                                element={<TimetablePage semester={1} />}
                            />
                            <Route
                                path="/timetable/sem-2"
                                element={<TimetablePage semester={2} />}
                            />
                            <Route path="/planner" element={<Planner />} />
                            <Route path="/pre-requisite" element={<Pre_Requisite />} />
                            <Route path="/courses" element={<Courses />} />
                            <Route path="/settings" element={<Settings />} />
                        </Route>
                    </Routes>

                    <Toaster
                        theme="system"
                        toastOptions={{
                            classNames: {
                                toast: "bg-background border border-border text-foreground rounded-xl p-4 shadow-xl flex items-center",
                                title: "text-foreground font-semibold text-sm",
                                description:
                                    "text-muted-foreground dark:!text-[#e4e4e7] text-xs font-normal mt-1 block leading-relaxed",
                            },
                        }}
                    />
                </BrowserRouter>
            </Theme>
        </QueryClientProvider>
    );
}
