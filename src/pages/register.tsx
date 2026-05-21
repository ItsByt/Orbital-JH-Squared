import { supabase } from '@/services/supabase'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field"


export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    async function handleRegister(e: React.SubmitEvent) {
        e.preventDefault();

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (signUpError) {
            setErrorMsg(signUpError.message)
        } else {
            console.log("Logged in successfully!", data)
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





