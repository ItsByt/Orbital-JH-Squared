import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/GeneralComponents/AppSidebar";
import { Theme } from "@/components/ThemeComponents/Theme";

export default function Layout() {
    return (
        <Theme defaultTheme="dark" storageKey="vite-ui-theme">
            <SidebarProvider>
                <AppSidebar />

                <main className="w-full p-8 flex-1 h-screen overflow-y-auto bg-background text-foreground transition-colors duration-200">
                    {/* Opens and closes the sidebar */}
                    <SidebarTrigger className="mb-4" />

                    {/* Outlet for page specific stuff */}
                    <Outlet />
                </main>
            </SidebarProvider>
        </Theme>
    );
}
