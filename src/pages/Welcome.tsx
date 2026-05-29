import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/NUSModsPlusLogo.png";


export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground px-4 transition-colors duration-200">
            
            <div className="w-full max-w-2xl text-center space-y-8 flex flex-col items-center">
                
                <div className="w-full">
                    <img 
                        src={logo}
                        alt="NUSMods Plus Logo" 
                        className="w-[500px] md:w-[700px] h-auto object-contain mx-auto drop-shadow-sm" 
                    />
                    <p className="text-muted-foreground text-base md:text-lg tracking-wide mt-4 font-medium">
                        The future of mod planning
                    </p>
                </div>

                {/* 3. Button Layout Group */}
                <div className="w-full space-y-4">
                    

                    <Button 
                        onClick={() => navigate("/login")}
                        variant="outline"
                        className="w-full h-12 text-base font-medium rounded-lg border-[#749c83] text-[#749c83] hover:bg-[#749c83] hover:text-white dark:border-[#749c83] dark:text-[#749c83] dark:hover:bg-[#749c83] dark:hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                    >
                        Login
                    </Button>

                    <Button 
                        onClick={() => navigate("/register")}
                        variant="outline"
                        className="w-full h-12 text-base font-medium rounded-lg border-[#749c83] text-[#749c83] hover:bg-[#749c83] hover:text-white dark:border-[#749c83] dark:text-[#749c83] dark:hover:bg-[#749c83] dark:hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                    >
                        Sign Up
                    </Button>

                </div>

            </div>
        </div>
    )
}





