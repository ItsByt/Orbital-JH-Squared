import { useEffect, type RefObject } from "react";

export function useDragScroll(scrollContainerRef: RefObject<HTMLDivElement>, isDragging: boolean) {
    useEffect(() => {
        // We only run this loop when a module is actively being dragged
        if (!isDragging) return;

        let animationFrameId: number;
        let currentMouseX = 0;

        // Track the mouse location on the screen
        const handleMouseMove = (e: MouseEvent) => {
            currentMouseX = e.clientX;
        };
        window.addEventListener("mousemove", handleMouseMove);

        const scrollLoop = () => {
            const container = scrollContainerRef.current;
            if (container && currentMouseX > 0) {
                const { left, right } = container.getBoundingClientRect();
                const threshold = 150; // Triggers when mouse is within 150px of the edge
                const maxSpeed = 18; // Max scroll speed

                // If mouse is near the left edge
                if (currentMouseX < left + threshold) {
                    const intensity = 1 - Math.max(0, currentMouseX - left) / threshold;
                    container.scrollLeft -= maxSpeed * intensity;
                }
                // If mouse is near the right edge
                else if (currentMouseX > right - threshold) {
                    const intensity = 1 - Math.max(0, right - currentMouseX) / threshold;
                    container.scrollLeft += maxSpeed * intensity;
                }
            }
            // Loop at 60 FPS
            animationFrameId = requestAnimationFrame(scrollLoop);
        };

        animationFrameId = requestAnimationFrame(scrollLoop);

        return () => {
            // Clean up when drag finishes
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDragging, scrollContainerRef]);
}
