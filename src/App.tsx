import { BrowserRouter, Routes, Route } from "react-router-dom"
import Welcome from "@/pages/welcome"
import Register from "@/pages/register"
import Login from "@/pages/login"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

// 1. Connect to Supabase using the hidden keys from our .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. We tell TypeScript what an "Instrument" looks like
interface Instrument {
  id: number;
  name: string;
}

export default function App() {
  // We use <Instrument[]> to tell TypeScript this is an array of instruments
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    // 3. Fetch data from the database table named "instruments"
    const { data, error } = await supabase.from("instruments").select();

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    // Save the data to our React state so it shows on the screen
    setInstruments(data as Instrument[]);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
