import { supabase } from "@/services/supabase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeComponents/ThemeToggle";
import logo from "@/assets/NUSModsPlusLogo.png";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister(e: React.SubmitEvent) {
        e.preventDefault();

        const { error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (signUpError) {
            toast.error("Registration Failed", { description: getErrorMessage(signUpError) });
        } else {
            toast.success("Account created! 🎉", {
                description:
                    "Remember, if you fail to plan, you plan to fail!",
            });
            navigate("/login");
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
                    onSubmit={handleRegister}
                    className="w-full bg-card p-6 rounded-xl border border-border shadow-sm space-y-5"
                >
                    <h3 className="text-xl font-bold text-foreground text-center mb-2">Sign Up</h3>

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
                            Choose a unique email for your account.
                        </FieldDescription>
                    </Field>

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
                            Choose a unique password for your account (6 characters or longer).
                        </FieldDescription>
                    </Field>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full h-11 text-base font-medium rounded-lg border-[#749c83] text-[#749c83] hover:bg-[#749c83] hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                        >
                            Submit
                        </Button>
                    </div>
                </form>

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
