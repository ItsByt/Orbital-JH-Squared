import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SemesterNavigationProps {
    semester: number;
}

export default function SemesterNavigation({ semester }: SemesterNavigationProps) {
    const navigate = useNavigate();

    return (
        <div className="w-full flex justify-start items-center gap-2 pt-2">
            <Button
                variant={semester === 1 ? "default" : "outline"}
                onClick={() => navigate("/timetable/sem-1")}
                className={`h-9 px-4 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    semester === 1 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border"
                }`}
            >
                Semester 1
            </Button>

            <Button
                variant={semester === 2 ? "default" : "outline"}
                onClick={() => navigate("/timetable/sem-2")}
                className={`h-9 px-4 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    semester === 2 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border"
                }`}
            >
                Semester 2
            </Button>
        </div>
    );
}
