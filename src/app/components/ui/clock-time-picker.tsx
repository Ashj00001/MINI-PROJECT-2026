import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Clock } from 'lucide-react';
import { cn } from './utils';

interface ClockTimePickerProps {
    value: string; // HH:mm format
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({ value, onChange, placeholder = 'Select time', className }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Internal state: 'hours' or 'minutes'
    const [mode, setMode] = useState<'hours' | 'minutes'>('hours');

    // AM/PM state
    const [isPM, setIsPM] = useState(false);

    // Parsed currently selected numbers
    const [selectedHour, setSelectedHour] = useState<number>(12);
    const [selectedMinute, setSelectedMinute] = useState<number>(0);

    // Initialize state from HH:mm prop
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setIsPM(h >= 12);
                setSelectedHour(h % 12 === 0 ? 12 : h % 12);
                setSelectedMinute(m);
            }
        }
    }, [value, isOpen]);

    // Format display string
    const displayValue = value ? (() => {
        const [h, m] = value.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return value;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const formattedH = displayH.toString().padStart(2, '0');
        const formattedM = m.toString().padStart(2, '0');
        return `${formattedH}:${formattedM} ${period}`;
    })() : '';

    const clockRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const stateRef = useRef({ mode, selectedHour, selectedMinute, isPM, onChange });

    useEffect(() => {
        stateRef.current = { mode, selectedHour, selectedMinute, isPM, onChange };
    }, [mode, selectedHour, selectedMinute, isPM, onChange]);

    const calculateTimeFromAngle = (clientX: number, clientY: number) => {
        if (!clockRef.current) return;
        const rect = clockRef.current.getBoundingClientRect();
        const x = clientX - rect.left - 100;
        const y = clientY - rect.top - 100;
        
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        const { mode: currentMode, selectedHour: curH, selectedMinute: curM, isPM: curPM, onChange: curOnChange } = stateRef.current;

        const emit = (h: number, m: number, pm: boolean) => {
            let hour24 = h;
            if (pm && h < 12) hour24 += 12;
            if (!pm && h === 12) hour24 = 0;

            const formattedH = hour24.toString().padStart(2, '0');
            const formattedM = m.toString().padStart(2, '0');
            curOnChange(`${formattedH}:${formattedM}`);
        };

        if (currentMode === 'hours') {
            let h = Math.round(angle / 30);
            if (h === 0) h = 12;
            if (h === 12 && angle > 345) h = 12;
            if (curH !== h) {
                setSelectedHour(h);
                emit(h, curM, curPM);
            }
        } else {
            let m = Math.round(angle / 6);
            if (m === 60) m = 0;
            if (curM !== m) {
                setSelectedMinute(m);
                emit(curH, m, curPM);
            }
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                calculateTimeFromAngle(e.clientX, e.clientY);
            }
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                setIsDragging(false);
                calculateTimeFromAngle(e.clientX, e.clientY);
                if (stateRef.current.mode === 'hours') {
                    setMode('minutes');
                } else {
                    setIsOpen(false);
                }
            }
        };
        
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                if (e.cancelable) e.preventDefault();
                calculateTimeFromAngle(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const handleTouchEnd = (e: TouchEvent) => {
            if (isDragging) {
                setIsDragging(false);
                if (stateRef.current.mode === 'hours') {
                    setMode('minutes');
                } else {
                    setIsOpen(false);
                }
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging]);

    const handleAmPmToggle = (newIsPM: boolean) => {
        setIsPM(newIsPM);
        emitChange(selectedHour, selectedMinute, newIsPM);
    };

    const emitChange = (h: number, m: number, pm: boolean) => {
        let hour24 = h;
        if (pm && h < 12) hour24 += 12;
        if (!pm && h === 12) hour24 = 0;

        const formattedH = hour24.toString().padStart(2, '0');
        const formattedM = m.toString().padStart(2, '0');
        onChange(`${formattedH}:${formattedM}`);
    };

    // Generate positions for 12 numbers in a circle
    const renderClockNumbers = () => {
        const radius = 90;
        const center = 100; // Half of 200px container
        const numbers = mode === 'hours'
            ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        return numbers.map((num, i) => {
            // 12 is at top (same as 0 index here), so angle starts at -90 deg
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const isSelected = mode === 'hours' ? num === selectedHour : num === selectedMinute;

            return (
                <div
                    key={num}
                    className={cn(
                        "absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm transition-colors z-10",
                        isSelected ? "bg-primary text-primary-foreground font-bold shadow-md" : "text-foreground hover:bg-primary/20 hover:text-primary"
                    )}
                    style={{ left: `${x}px`, top: `${y}px` }}
                >
                    {mode === 'minutes' ? num.toString().padStart(2, '0') : num}
                </div>
            );
        });
    };

    // Calculate hand position
    const handAngle = mode === 'hours'
        ? (selectedHour % 12) * 30 - 90
        : (selectedMinute / 5) * 30 - 90;

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) setMode('hours');
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal border-input bg-input/50",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value ? displayValue : <span className="text-muted-foreground">{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 flex flex-col items-center border-primary/20 glass shadow-2xl">

                {/* Header Displays */}
                <div className="flex w-full justify-between items-end mb-6">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold tracking-widest text-primary/70 uppercase mb-1">Select Time</span>
                        <div className="flex items-baseline text-4xl font-light tracking-tighter text-foreground">
                            <button
                                type="button"
                                onClick={() => setMode('hours')}
                                className={cn("hover:text-primary transition-colors", mode === 'hours' ? "text-primary font-bold" : "")}
                            >
                                {selectedHour.toString().padStart(2, '0')}
                            </button>
                            <span className="mx-1 text-primary/50 animate-pulse">:</span>
                            <button
                                type="button"
                                onClick={() => setMode('minutes')}
                                className={cn("hover:text-primary transition-colors", mode === 'minutes' ? "text-primary font-bold" : "")}
                            >
                                {selectedMinute.toString().padStart(2, '0')}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col ml-4">
                        <button
                            type="button"
                            onClick={() => handleAmPmToggle(false)}
                            className={cn("text-sm px-2 py-1 rounded-t-md font-bold transition-colors", !isPM ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                        >
                            AM
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAmPmToggle(true)}
                            className={cn("text-sm px-2 py-1 rounded-b-md font-bold transition-colors", isPM ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                        >
                            PM
                        </button>
                    </div>
                </div>

                {/* Clock Face */}
                <div 
                    ref={clockRef}
                    className="relative w-[200px] h-[200px] rounded-full bg-muted/30 border border-primary/10 select-none cursor-pointer touch-none"
                    onMouseDown={(e) => {
                        setIsDragging(true);
                        calculateTimeFromAngle(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                        setIsDragging(true);
                        calculateTimeFromAngle(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                >
                    {/* Center Dot */}
                    <div className="absolute left-[100px] top-[100px] w-2 h-2 -ml-1 -mt-1 rounded-full bg-primary z-20 shadow-[0_0_10px_rgba(0,236,255,0.8)]" />

                    {/* Animated Hand Line */}
                    <div
                        className={cn(
                            "absolute left-[100px] top-[100px] h-[75px] w-0.5 bg-primary origin-bottom -mt-[75px] -ml-[1px] z-10",
                            isDragging ? "transition-none" : "transition-transform duration-300 ease-out"
                        )}
                        style={{ transform: `rotate(${handAngle + 90}deg)` }}
                    >
                        <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 rounded-full bg-primary shadow-lg" />
                    </div>

                    {renderClockNumbers()}
                </div>

                <div className="w-full flex justify-end mt-6">
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-xs uppercase tracking-widest">
                        Done
                    </Button>
                </div>

            </PopoverContent>
        </Popover>
    );
};
