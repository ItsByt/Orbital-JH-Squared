import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect, useState } from "react";

import { createClient } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react";
import { Theme } from "@/components/theme";

import Welcome from "@/pages/welcome"
import Register from "@/pages/register"
import Login from "@/pages/login"
import Layout from "@/components/Layout"
import TimetablePage from "@/pages/Timetable"
import Planner from "@/pages/Planner"
import Courses from "@/pages/Courses"
import Pre_Requisite from "@/pages/Pre_Requisite"
import Settings from "@/pages/Settings";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {


  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    //Used to upload ui and session 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    //Only runs when component is cleaned up or closed
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
        <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
        <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">Checking session...</span>
      </div>
    );
  }

  return (
    <Theme defaultTheme="dark" storageKey="nusmods-plus-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={session ? <Layout /> : <Login />}>
            <Route path="/timetable/sem-1" element={<TimetablePage semester={1} />} />
            <Route path="/timetable/sem-2" element={<TimetablePage semester={2} />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/pre-requisite" element={<Pre_Requisite />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        
        <Toaster 
          theme="dark" 
          toastOptions={{
            classNames: {
              toast: "!bg-[#18181b] backdrop-blur-none opacity-100 border border-neutral-800 text-zinc-100 rounded-xl p-4 shadow-xl flex items-center",
              title: "text-zinc-100 font-semibold text-sm",
              description: "text-zinc-400 text-xs font-normal mt-1 block leading-relaxed",
            },
          }}
        />
      </BrowserRouter>
    </Theme>
  );
}