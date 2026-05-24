import { supabase } from "@/services/supabase";
import { getUserModules } from "@/services/timetableDB"
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";



export default function Home() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPageData() {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                alert("Please log in to add modules to your timetable!");
                return;
            }

            const myModules = await getUserModules(user.id);
            setModules(myModules);
        } 

        loadPageData();
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
        <>  
            <h2> Timetable </h2>
        </>
    )
}










