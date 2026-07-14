import { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";

// Logic for the download capture + clone functionality
export function useTimetableExport(semester: number) {
    const timetableRef = useRef<HTMLDivElement>(null);
    const [captureMode, setCaptureMode] = useState(false);

    const downloadTimetable = async () => {
        if (!timetableRef.current) return;
        const element = timetableRef.current;

        setCaptureMode(true);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const originalStyle = {
            width: element.style.width,
            height: element.style.height,
            overflow: element.style.overflow,
        };

        try {
            const fullWidth = element.scrollWidth;
            const fullHeight = element.scrollHeight;

            // Temporarily expand only for capture
            element.style.width = `${fullWidth}px`;
            element.style.height = `${fullHeight}px`;
            element.style.overflow = "visible";

            await new Promise((resolve) => requestAnimationFrame(resolve));

            const dataUrl = await htmlToImage.toPng(element, {
                backgroundColor: "#121212",
                pixelRatio: 2,
                width: fullWidth,
                height: fullHeight,
                cacheBust: true,
            });

            const link = document.createElement("a");
            link.download = `semester-${semester}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to export timetable:", err);
        } finally {
            element.style.width = originalStyle.width;
            element.style.height = originalStyle.height;
            element.style.overflow = originalStyle.overflow;
            setCaptureMode(false);
        }
    };

    return { timetableRef, captureMode, downloadTimetable };
}
