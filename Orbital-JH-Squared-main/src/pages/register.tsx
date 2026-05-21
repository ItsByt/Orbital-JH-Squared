import { supabase } from '@/services/supabase'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Field,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field"


export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister(e: React.SubmitEvent) {
        e.preventDefault();

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (signUpError) {
            toast.error("Registration Failed", {
            description: signUpError.message, 
            });
            console.error("Registration error:", signUpError.message);
        } else {
            toast.success("Account created! 🎉", {
                description: "Please check your email to confirm your registration. Then log in again.",
            });
            console.log("Registered successfully! Please exit and login again.", data)
        }
    }

    return (
        <>
            <h1>NUSMods Plus</h1>

            <h2>Sign up</h2>

            <form onSubmit={handleRegister}>

                <Field>
                    <FieldLabel htmlFor="input-field-username">Email</FieldLabel>
                    <Input
                        id="input-field-email"
                        type="text"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FieldDescription>
                        Choose a unique email for your account.
                    </FieldDescription>
                </Field>

                <br></br>

                <Field>
                    <FieldLabel htmlFor="input-field-username">Password</FieldLabel>
                    <Input
                        id="input-field-password"
                        type="text"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FieldDescription>
                        Choose a unique password for your account.
                        The password must be 6 letters or longer.
                    </FieldDescription>
                </Field>

                <br></br>

                <div className="flex flex-wrap items-center gap-2 md:flex-row">
                    <Button type="submit" variant="outline">Submit</Button>
                </div>
            </form>
        </>
    )
}





