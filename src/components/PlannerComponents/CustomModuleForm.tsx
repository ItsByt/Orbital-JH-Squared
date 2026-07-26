import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomModuleFormProps {
    semesterKey: string;
    isProcessing: boolean;
    onSubmit: (code: string, title: string, units: number) => void;
}

const DEFAULT_FORM_STATE: {
    code: string;
    title: string;
    units: number | "";
} = {
    code: "",
    title: "",
    units: 4,
};

export default function CustomModuleForm({ isProcessing, onSubmit }: CustomModuleFormProps) {
    // Unified State Object
    const [formData, setFormData] = useState({ ...DEFAULT_FORM_STATE });

    // Helper to update individual fields
    const updateField = <K extends keyof typeof DEFAULT_FORM_STATE>(
        field: K,
        value: (typeof DEFAULT_FORM_STATE)[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        const normalizedCode = formData.code.trim();
        const normalizedTitle = formData.title.trim();

        if (!normalizedCode) {
            toast.error("Missing Input", { description: "Please enter a valid Module Code." });
            return false;
        }
        if (!normalizedTitle) {
            toast.error("Missing Input", { description: "Please enter a Module Title." });
            return false;
        }
        if (formData.units === "" || formData.units < 0 || formData.units > 20) {
            toast.error("Invalid units", { description: "Units must be between 0 and 20." });
            return false;
        }

        return true;
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) return;

        onSubmit(formData.code, formData.title, Number(formData.units));

        setFormData({ ...DEFAULT_FORM_STATE });
    };

    return (
        <form data-testid="custom-module-form" onSubmit={handleSubmit} className="p-4 space-y-5">
            <div className="space-y-1.5">
                <Label
                    htmlFor="custom-code"
                    className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider"
                >
                    Module Code
                </Label>
                <Input
                    id="custom-code"
                    data-testid="custom-module-code-input"
                    required
                    placeholder="e.g. MA4271"
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-sm text-zinc-200 focus-visible:ring-[#56A58B]"
                />
            </div>

            <div className="space-y-1.5">
                <Label
                    htmlFor="custom-title"
                    className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider"
                >
                    Title
                </Label>
                <Input
                    id="custom-title"
                    data-testid="custom-module-title-input"
                    required
                    placeholder="e.g. Differential Geometry of Curves and Surfaces"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-sm text-zinc-200 focus-visible:ring-[#56A58B]"
                />
            </div>

            <div className="space-y-1.5">
                <Label
                    htmlFor="custom-units"
                    className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider"
                >
                    Units
                </Label>
                <Input
                    id="custom-units"
                    data-testid="custom-module-units-input"
                    required
                    type="number"
                    min={0}
                    max={20}
                    value={formData.units}
                    onChange={(e) => {
                        const val = e.target.value;
                        updateField("units", val === "" ? "" : Number(val));
                    }}
                    className="bg-zinc-900 border-zinc-800 text-sm text-zinc-200 focus-visible:ring-[#56A58B]"
                />
            </div>

            <Button
                type="submit"
                data-testid="submit-custom-module-btn"
                disabled={isProcessing}
                className="w-full bg-[#56A58B] hover:bg-[#468973] text-white mt-2"
            >
                {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Plus className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? "Adding..." : "Add to Planner"}
            </Button>
        </form>
    );
}
