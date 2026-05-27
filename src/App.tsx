import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useEffect, useState } from "react";

import { createClient } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react";

import Welcome from "@/pages/Welcome"
import Register from "@/pages/Register"
import Login from "@/pages/Login"
import Layout from "@/components/Layout"
import TimetablePage from "@/pages/Timetable"
import Planner from "@/pages/Planner"
import Courses from "@/pages/Courses"
import Pre_Requisite from "@/pages/Pre_Requisite"


// Connect to Supabase using the hidden keys from our .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {

  //session starts as null, any is the data type of session
  //loading starts as true
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  //useEffect is used to run the function at specific timings
  //array as 2nd input means run exactly once when the app loads
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-3 text-lg font-medium text-slate-700">Checking session...</span>
      </div>
    );
  }

  return (
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
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
