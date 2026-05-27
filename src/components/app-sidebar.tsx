import { getCurrentAcadSem } from "@/lib/utils"
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
    const currentSem = getCurrentAcadSem();

    const goToPlannerPage = () => {
        navigate("/planner"); 
    }

    const goToTimetablePage = () => {
        navigate(`/timetable/sem-${currentSem}`);
    }

    const goToCoursesPage = () => {
        navigate("/courses");
    }

    const goToPre_RequisitePage = () => {
        navigate("/pre-requisite");
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
                    Timetable
                </Button>

                <Button onClick={goToCoursesPage} variant="outline" className="w-full">
                    Courses
                </Button>

                <Button onClick={goToPlannerPage} variant="outline" className="w-full">
                    Planner
                </Button>

                <Button onClick={goToPre_RequisitePage} variant="outline" className="w-full">
                    Pre-Requisite
                </Button>

                <Button onClick={handleLogOut} variant="destructive" className="w-full">
                    Log Out
                </Button>
            </SidebarContent>
        </Sidebar>
    )
}
