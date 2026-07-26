import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";

import { type Session } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useSettingsStore } from "./store/useSettingsStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { supabase } from "./services/supabase";
import Welcome from "@/pages/authentication/Welcome";
import Register from "@/pages/authentication/Register";
import Login from "@/pages/authentication/Login";
import UpdatePassword from "./pages/authentication/UpdatePassword";
import Layout from "@/components/GeneralComponents/Layout";
import TimetablePage from "@/pages/webpages/Timetable";
import Planner from "@/pages/webpages/Planner";
import Courses from "@/pages/webpages/Courses";
import Pre_Requisite from "@/pages/webpages/Pre_Requisite";
import Settings from "@/pages/webpages/Settings";
import { getCurrentAcadSem } from "./utils/generalUtils/time";

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

    // use User-Specific Settings on logging back in
    const hydrateSettings = useSettingsStore((state) => state.hydrateSettings);
    useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from("accessibilities")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (data && !error) {
                hydrateSettings({
                    startHour: data.start_hour,
                    endHour: data.end_hour,
                    cardFontSize: data.card_font_size,
                    cardFontFamily: data.card_font_family,
                });
            }
        };

        fetchSettings();
    }, [session, hydrateSettings]);

    const currentSem = getCurrentAcadSem();
    const defaultAppPath = `/timetable/sem-${currentSem}`;

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
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <BrowserRouter>
                    <Routes>
                        {/* Guest-Only Routes */}
                        <Route
                            element={
                                session ? <Navigate to={defaultAppPath} replace /> : <Outlet />
                            }
                        >
                            <Route path="/" element={<Welcome />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Route>

                        {/* STANDALONE Route - do not move elsewhere */}
                        <Route path="/update-password" element={<UpdatePassword />} />

                        {/* Protected Routes */}
                        <Route element={session ? <Layout /> : <Navigate to="/" replace />}>
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
            </ThemeProvider>
        </QueryClientProvider>
    );
}
