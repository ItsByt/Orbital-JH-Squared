import { useNavigate } from "react-router-dom";
import { supabase } from '@/services/supabase'
import { Button } from "@/components/ui/button";
import { toast } from "sonner"

export default function Layout() {
    const navigate = useNavigate();

    async function goToModulePlanningPage(e: React.MouseEvent<HTMLButtonElement>) {
        navigate("/planner")
    }

    async function handleLogOut(e: React.MouseEvent<HTMLButtonElement>) {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            toast.error("Log Out Failed", {
                description: signOutError.message,
            });
            console.log("Failed to log out for some reason")
        } else {
            toast.success("Logged Out Successfully!");
            navigate("/")
            console.log("Logged Out successfully!")
        }
    }

    return (
        <>
            <h1>NUSMods Plus</h1>

            <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button onClick={handleLogOut} variant="outline">Log Out</Button>
            </div>

            <br></br>

            <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button onClick={goToModulePlanningPage} variant="outline">Module Planning</Button>
            </div>
        </>
    )


}
