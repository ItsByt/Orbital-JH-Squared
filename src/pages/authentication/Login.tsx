import { getCurrentAcadSem } from "@/utils/generalUtils/time";
import { supabase } from "@/services/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/NUSModsPlusLogo.png";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function userExists(email: string) {
        const { data, error } = await supabase
            .from("profiles")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        console.log("userExists called");
        if (data != null && error) {
            console.log("userExists failed");
            return false;
        } else {
            console.log("userExists success");
            return true;
        }
    }

    async function handleLogin(e: React.SubmitEvent) {
        e.preventDefault();
        const valid = await userExists(email);

        if (!valid) {
            toast.error("Account does not exist", {
                description: "Please check your email address or register.",
            });
            console.log("user does not exist");
            return;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (signInError) {
            toast.error("Login Failed", { description: getErrorMessage(signInError) });
            console.log("Invalid email or password. Please try again");
        } else {
            toast.success("Logged in Successfully!");
            const currentSem = getCurrentAcadSem();
            navigate(`/timetable/sem-${currentSem}`);
            console.log("Logged in successfully!", data);
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground px-4 transition-colors duration-200">
            <div className="w-full max-w-md space-y-8 flex flex-col items-center">
                {/* Massive centered Png Logo */}
                <div className="text-center w-full cursor-pointer" onClick={() => navigate("/")}>
                    <img
                        src={logo}
                        alt="NUSMods Plus Logo"
                        className="w-[450px] max-w-full h-auto object-contain mx-auto drop-shadow-sm"
                    />
                </div>

                {/* UI Container */}
                <form
                    onSubmit={handleLogin}
                    className="w-full bg-card p-6 rounded-xl border border-border shadow-sm space-y-5"
                >
                    <h3 className="text-xl font-bold text-foreground text-center mb-2">Login</h3>

                    {/* Email  */}
                    <Field className="space-y-1.5 text-left">
                        <FieldLabel
                            htmlFor="input-field-email"
                            className="text-sm font-medium text-foreground"
                        >
                            Email
                        </FieldLabel>
                        <Input
                            id="input-field-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-11 px-3 bg-background border-border text-foreground placeholder:text-muted-foreground/50 rounded-md focus-visible:ring-1 focus-visible:ring-[#749c83]/50"
                        />
                        <FieldDescription className="text-xs text-muted-foreground">
                            Type your email here.
                        </FieldDescription>
                    </Field>

                    {/* Password */}
                    <Field className="space-y-1.5 text-left">
                        <FieldLabel
                            htmlFor="input-field-password"
                            className="text-sm font-medium text-foreground"
                        >
                            Password
                        </FieldLabel>
                        <Input
                            id="input-field-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-11 px-3 bg-background border-border text-foreground placeholder:text-muted-foreground/50 rounded-md focus-visible:ring-1 focus-visible:ring-[#749c83]/50"
                        />
                        <FieldDescription className="text-xs text-muted-foreground">
                            Type your password here.
                        </FieldDescription>
                    </Field>

                    {/* Submit */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full h-11 text-base font-medium rounded-lg border-[#749c83] text-[#749c83] hover:bg-[#749c83] hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                        >
                            Login
                        </Button>
                    </div>
                </form>

                {/* Return */}
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-xs text-muted-foreground hover:text-[#749c83] transition-colors cursor-pointer"
                >
                    ← Return to Welcome
                </button>
            </div>
        </div>
    );
}
