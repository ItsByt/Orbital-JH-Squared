import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout() {
    return (
        <SidebarProvider>

            <AppSidebar />

            <main className="w-full p-8 min-h-screen bg-slate-50">

                {/* Opens and closes the sidebar */}
                <SidebarTrigger className="mb-4" />

                {/* Outlet for page specific stuff */}
                <Outlet />

            </main>

        </SidebarProvider>
    )
}
