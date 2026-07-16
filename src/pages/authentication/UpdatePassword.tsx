import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [isProcessing, setIsProcessing] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the session was already established while App.tsx was loading
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsProcessing(false);
            }
        });

        // Listen for auth events in case it fires after mounting
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) {
                setIsProcessing(false);
            }
        });

        // Safety timeout
        const timer = setTimeout(() => {
            if (isProcessing) {
                toast.error("Invalid link or expired.", {
                    description: "Please request a new password reset link.",
                });
                navigate("/login");
            }
        }, 5000);

        return () => {
            data.subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [isProcessing, navigate]);

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault();

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast.error("Update Failed", { description: error.message });
        } else {
            toast.success("Password updated successfully!");
            // Sign out to prevent the active session from teleporting the user to the timetable
            await supabase.auth.signOut();
            navigate("/login");
        }
    }

    if (isProcessing)
        return (
            <div className="flex h-screen items-center justify-center">
                Verifying recovery link...
            </div>
        );

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <form onSubmit={handleUpdatePassword} className="w-full max-w-sm space-y-4">
                <h2 className="text-lg font-bold">Set New Password</h2>
                <Input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button type="submit" className="w-full">
                    Update Password
                </Button>
            </form>
        </div>
    );
}
