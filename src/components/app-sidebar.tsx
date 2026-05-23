import { useNavigate } from "react-router-dom"
import { supabase } from '@/services/supabase' 
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    const navigate = useNavigate(); 

    const goToModulePlanningPage = () => {
        navigate("/planner"); 
    }

    const goToTimetablePage = () => {
        navigate("/home");
    }

    async function handleLogOut() {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            toast.error("Log Out Failed", { description: signOutError.message });
        } else {
            toast.success("Logged Out Successfully!");
            navigate("/"); 
        }
    }

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <h2 className="text-lg font-bold text-blue-600">NUSMods Plus</h2>
            </SidebarHeader>

            <SidebarContent className="p-4 gap-4">

                <Button onClick={goToTimetablePage} variant="outline" className="w-full">
                    Timetable Planning
                </Button>

                <Button onClick={goToModulePlanningPage} variant="outline" className="w-full">
                    Module Planning
                </Button>

                <Button onClick={handleLogOut} variant="destructive" className="w-full">
                    Log Out
                </Button>
            </SidebarContent>
        </Sidebar>
    )
}
