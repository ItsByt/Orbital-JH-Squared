import { getCurrentAcadSem } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { supabase } from '@/services/supabase' 
import { toast } from "sonner"
import logo from "@/assets/NUSModsPlusLogo.png"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    const navigate = useNavigate(); 
    const currentSem = getCurrentAcadSem();
    const buttonStyle = "w-full h-14 text-xl font-semibold rounded-xl"

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

    const goToSettings = () => {
        navigate("/settings");
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
                <img
                    src={logo}
                    alt="NUSMods Plus Logo"
                    className="w-55 h-auto"
                />
            </SidebarHeader>

            <SidebarContent className="p-4 gap-4">

                <Button onClick={goToTimetablePage} variant="outline" className= {buttonStyle}>
                    Timetable
                </Button>

                <Button onClick={goToCoursesPage} variant="outline" className={buttonStyle}>
                    Courses
                </Button>

                <Button onClick={goToPlannerPage} variant="outline" className={buttonStyle}>
                    Planner
                </Button>

                <Button onClick={goToPre_RequisitePage} variant="outline" className={buttonStyle}>
                    Pre-Requisite
                </Button>

                <Button onClick={goToSettings} variant="outline" className={buttonStyle}>
                    Settings
                </Button>

                <Button onClick={handleLogOut} variant="destructive" className={buttonStyle}>
                    Log Out
                </Button>
            </SidebarContent>
        </Sidebar>
    )
}
