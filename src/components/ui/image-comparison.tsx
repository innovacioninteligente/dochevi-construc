'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageComparisonProps {
    beforeImage: string;
    afterImage: string;
    className?: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export function ImageComparisonSlider({
    beforeImage,
    afterImage,
    className,
    beforeLabel = "Antes",
    afterLabel = "Después"
}: ImageComparisonProps) {
    const [sliderChecked, setSliderChecked] = useState(false);
    const [position, setPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setPosition(percentage);
    }, []);

    const handleMouseDown = useCallback(() => {
        setSliderChecked(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setSliderChecked(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => { // Use native MouseEvent for window listener
        if (sliderChecked) {
            handleMove(e.clientX);
        }
    }, [sliderChecked, handleMove]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    // Global mouse up/move to handle dragging outside container
    useEffect(() => {
        if (sliderChecked) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
        } else {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [sliderChecked, handleMouseUp, handleMouseMove]);

    if (!beforeImage || !afterImage) return null;


    return (
        <div
            ref={containerRef}
            className={cn("relative select-none overflow-hidden rounded-lg cursor-col-resize group", className)}
            onMouseDown={(e) => {
                handleMove(e.clientX);
                handleMouseDown();
            }}
            onTouchMove={handleTouchMove}
        >
            {/* Background Image (After - Full Width) */}
            <div className="relative w-full h-full">
                <Image
                    src={afterImage}
                    alt="After"
                    fill
                    className="object-cover"
                    priority
                />
                {afterLabel && (
                    <span className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 text-xs rounded-full backdrop-blur-sm pointer-events-none z-10">
                        {afterLabel}
                    </span>
                )}
            </div>

            {/* Foreground Image (Before - Clipped) */}
            <div
                className="absolute top-0 left-0 bottom-0 w-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
                <Image
                    src={beforeImage}
                    alt="Before"
                    fill
                    className="object-cover"
                    priority
                />
                {beforeLabel && (
                    <span className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 text-xs rounded-full backdrop-blur-sm pointer-events-none z-10">
                        {beforeLabel}
                    </span>
                )}
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20"
                style={{ left: `${position}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-lg">
                    <GripVertical className="h-4 w-4 text-purple-600" />
                </div>
            </div>

        </div>
    );
}
