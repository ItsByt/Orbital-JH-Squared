import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

// 1. Connect to Supabase using the hidden keys from your .env.local file
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
    <div style={{ padding: '20px' }}>
      <h1>My First Supabase Fetch!</h1>
      <ul>
        {instruments.map((instrument) => (
          <li key={instrument.name}>{instrument.name}</li>
        ))}
      </ul>
      <Button onClick={() => console.log("Button clicked!")}>
      Click me
    </Button>
    </div>    
  );
}
