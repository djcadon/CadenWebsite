import { useEffect, useState, type CSSProperties } from "react";

interface TerminalBootProps {
    onComplete: () => void;
}

const BOOT_SESSION_KEY = "caden-orbital-boot-seen";

interface TerminalLineProps {
    segments: Array<{ text: string; className?: string }>;
    cursor?: boolean;
    isActive: boolean;
    isComplete: boolean;
    onComplete: () => void;
}

function TerminalLine({
    segments,
    cursor = false,
    isActive,
    isComplete,
    onComplete,
}: TerminalLineProps) {
    let characterIndex = 0;

    useEffect(() => {
        if (isActive && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            onComplete();
        }
    }, [isActive, onComplete]);

    if (!isActive && !isComplete) {
        return null;
    }

    return (
        <p className="terminal-boot-line">
            {segments.map((segment) => (
                <span className={segment.className} key={segment.text}>
                    {Array.from(segment.text).map((character) => {
                        const index = characterIndex;
                        characterIndex += 1;
                        return (
                            <span
                                className={`terminal-character ${isComplete ? "terminal-character-visible" : ""}`}
                                key={`${segment.text}-${index}`}
                                onAnimationEnd={
                                    isActive &&
                                    index ===
                                        segments.reduce(
                                            (total, current) => total + current.text.length,
                                            0,
                                        ) -
                                            1
                                        ? onComplete
                                        : undefined
                                }
                                style={
                                    {
                                        animationDelay: `${index * 35}ms`,
                                    } as CSSProperties
                                }
                            >
                                {character === " " ? "\u00a0" : character}
                            </span>
                        );
                    })}
                </span>
            ))}
            {cursor && <span className="terminal-cursor">_</span>}
        </p>
    );
}

function shouldShowBoot(): boolean {
    return sessionStorage.getItem(BOOT_SESSION_KEY) !== "true";
}

function TerminalBoot({ onComplete }: TerminalBootProps) {
    const [isVisible, setIsVisible] = useState(shouldShowBoot);
    const [isExiting, setIsExiting] = useState(false);
    const [activeLine, setActiveLine] = useState(0);
    const lines = [
        {
            segments: [
                { text: "C:/Users/Caden/", className: "text-accent" },
                { text: "> ", className: "text-text" },
                { text: "launch --orbital-interface" },
            ],
        },
        {
            segments: [
                { text: "[ok]", className: "text-[#a8c58c]" },
                { text: " initializing orbital workspace..." },
            ],
        },
        {
            segments: [
                { text: "[ok]", className: "text-[#a8c58c]" },
                { text: " loading navigation system..." },
            ],
        },
        {
            segments: [
                { text: "[ok]", className: "text-[#a8c58c]" },
                { text: " establishing visual link..." },
            ],
        },
        {
            segments: [{ text: "orbit system online", className: "text-text" }],
            cursor: true,
        },
    ];

    useEffect(() => {
        if (!isVisible) {
            onComplete();
            return;
        }

        if (activeLine < lines.length) {
            return;
        }

        const exitTimer = window.setTimeout(() => setIsExiting(true), 700);
        const completeTimer = window.setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem(BOOT_SESSION_KEY, "true");
        }, 1300);

        return () => {
            window.clearTimeout(exitTimer);
            window.clearTimeout(completeTimer);
        };
    }, [activeLine, isVisible, lines.length, onComplete]);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            aria-label="Initializing orbital navigation"
            aria-live="polite"
            className={`terminal-boot fixed inset-0 z-[100] flex items-center justify-center bg-[#101010] px-6 ${isExiting ? "terminal-boot-exiting" : ""}`}
            role="status"
        >
            <div className="w-full max-w-[620px] font-mono text-xs leading-6 text-muted sm:text-sm">
                {lines.map((line, index) => (
                    <TerminalLine
                        {...line}
                        isActive={index === activeLine}
                        isComplete={index < activeLine}
                        key={index}
                        onComplete={() => setActiveLine(index + 1)}
                    />
                ))}
            </div>
        </div>
    );
}

export default TerminalBoot;
