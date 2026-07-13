import { getCurrentAcadSem } from "@/utils/generalUtils/time";
import { supabase } from "@/services/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeComponents/ThemeToggle";
import logo from "@/assets/NUSModsPlusLogo.png";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            toast.error("Login Failed", { description: getErrorMessage(signInError) });
        } else {
            toast.success("Logged in Successfully!");
            const currentSem = getCurrentAcadSem();
            navigate(`/timetable/sem-${currentSem}`);
        }
    }

    async function handleForgotPassword() {
        if (!email) {
            toast.error("Email required", {
                description: "Please enter your email to reset your password.",
            });
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
            toast.error("Error", { description: error.message });
        } else {
            toast.success("Check your email", {
                description: "We've sent you a password reset link.",
            });
        }
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground px-4 transition-colors duration-200">
            <ThemeToggle />
            <div className="w-full max-w-md space-y-8 flex flex-col items-center">
                <div className="text-center w-full cursor-pointer" onClick={() => navigate("/")}>
                    <img
                        src={logo}
                        alt="NUSMods Plus Logo"
                        className="w-[450px] max-w-full h-auto object-contain mx-auto drop-shadow-sm"
                    />
                </div>

                <form
                    onSubmit={handleLogin}
                    className="w-full bg-card p-6 rounded-xl border border-border shadow-sm space-y-5"
                >
                    <h3 className="text-xl font-bold text-foreground text-center mb-2">Login</h3>

                    <Field className="space-y-1.5 text-left">
                        <FieldLabel htmlFor="email" className="text-sm font-medium">
                            Email
                        </FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-11 px-3"
                        />
                    </Field>

                    <Field className="space-y-1.5 text-left">
                        <FieldLabel htmlFor="password" className="text-sm font-medium">
                            Password
                        </FieldLabel>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-11 px-3"
                        />
                    </Field>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-[#749c83] hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full h-11 text-base font-medium rounded-lg border-[#749c83] text-[#749c83] hover:bg-[#749c83] hover:text-white"
                    >
                        Login
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-xs text-muted-foreground hover:text-[#749c83] cursor-pointer"
                >
                    ← Return to Welcome
                </button>
            </div>
        </div>
    );
}
