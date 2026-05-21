import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";


export default function Welcome() {
    const navigate = useNavigate();

    return (
        <>
            <h1>NUSMods Plus</h1>

            <h2>Welcome</h2>
                <div className="flex flex-wrap items-center gap-2 md:flex-row">
                    <Button onClick={() => navigate("/login")}>
                        Go to Login
                    </Button>
                </div>

                <br></br>

                <div className="flex flex-wrap items-center gap-2 md:flex-row">
                <Button onClick={() => navigate("/register")}>
                    Go to Register
                </Button>
                </div>
        </>
    )
}





