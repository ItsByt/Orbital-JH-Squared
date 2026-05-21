import { supabase } from '@/services/supabase'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Field,
    FieldDescription,
    FieldLabel
} from "@/components/ui/field"

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()

    async function userExists(email: String) {
        const { data, error } = await supabase
            .from("profiles")
            .select("email")
            .eq("email", email)
            .maybeSingle();
        
        console.log("userExists called")
        if (data != null && error) {
            console.log("userExists failed")
            return false;
        } else {
            console.log("userExists success")
            return true;
        }
    } 

    async function handleLogin(e: React.SubmitEvent) {     
        e.preventDefault();
        const valid = await userExists(email)

        if (!valid) {
            console.log("user does not exist")
            return 
        }
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (signInError) {
            toast.error("Login Failed", {
            description: signInError.message, 
            });
            console.log("Invalid email or password. Please try again")
        } else {
            toast.success("Logged in Successfully!");
            navigate("/home")
            console.log("Logged in successfully!", data)
        }
    }

    return (
        <>
            <h1>NUSMods Plus</h1>

            <h2>Login</h2>

            <form onSubmit={handleLogin}>

                <Field>
                    <FieldLabel htmlFor="input-field-username">Email</FieldLabel>
                    <Input
                        id="input-field-email"
                        type="text"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        required
                    />
                    <FieldDescription>
                        Type your email here.
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
                        Type your password here.
                    </FieldDescription>
                </Field>

                <br></br>

                <div className="flex flex-wrap items-center gap-2 md:flex-row">
                    <Button type="submit" variant="outline">Login</Button>
                </div>
                
                </form>
        </>
    )
}





