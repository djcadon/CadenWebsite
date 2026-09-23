import { useEffect, useState, type CSSProperties } from "react";

interface TerminalBootProps {
    onComplete: () => void;
}

const BOOT_SESSION_KEY = "caden-orbital-boot-seen";
const CHARACTER_DELAY_MS = 55;
const EXIT_FADE_DELAY_MS = 1200;
const BOOT_COMPLETE_DELAY_MS = 1800;

interface TerminalLineProps {
    segments: Array<{
        text: string;
        className?: string;
        revealAfterComplete?: boolean;
    }>;
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
    const [lineComplete, setLineComplete] = useState(isComplete);

    useEffect(() => {
        if (isActive && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setLineComplete(true);
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
                    {Array.from(
                        segment.revealAfterComplete && !lineComplete
                            ? segment.text.replace(/[^\s]/g, " ")
                            : segment.text,
                    ).map((character) => {
                        const index = characterIndex;
                        characterIndex += 1;
                        return (
                            <span
                                className={`terminal-character ${isComplete || lineComplete ? "terminal-character-visible" : ""}`}
                                key={`${segment.text}-${index}`}
                                onAnimationEnd={
                                    isActive &&
                                    index ===
                                        segments.reduce(
                                            (total, current) => total + current.text.length,
                                            0,
                                        ) -
                                            1
                                        ? () => {
                                              setLineComplete(true);
                                              onComplete();
                                          }
                                        : undefined
                                }
                                style={
                                    {
                                        animationDelay: `${index * CHARACTER_DELAY_MS}ms`,
                                    } as CSSProperties
                                }
                            >
                                {character === " " ? "\u00a0" : character}
                            </span>
                        );
                    })}
                </span>
            ))}
            {cursor && (isComplete || lineComplete) && (
                <span className="terminal-cursor">_</span>
            )}
        </p>
    );
}

function shouldShowBoot(): boolean {
    // Keep the intro atmospheric on first visit without replaying it on every
    // navigation within the same browser session.
    return sessionStorage.getItem(BOOT_SESSION_KEY) !== "true";
}

function TerminalBoot({ onComplete }: TerminalBootProps) {
    const [isVisible, setIsVisible] = useState(shouldShowBoot);
    const [isExiting, setIsExiting] = useState(false);
    const [activeLine, setActiveLine] = useState(0);
    // The next line is activated by the previous line's final character rather
    // than fixed timers, so text speed changes cannot desynchronize the sequence.
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
                {
                    text: "[ok]",
                    className: "text-[#a8c58c]",
                    revealAfterComplete: true,
                },
                { text: " initializing orbital workspace..." },
            ],
        },
        {
            segments: [
                {
                    text: "[ok]",
                    className: "text-[#a8c58c]",
                    revealAfterComplete: true,
                },
                { text: " loading navigation system..." },
            ],
        },
        {
            segments: [
                {
                    text: "[ok]",
                    className: "text-[#a8c58c]",
                    revealAfterComplete: true,
                },
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

        const exitTimer = window.setTimeout(
            () => setIsExiting(true),
            EXIT_FADE_DELAY_MS,
        );
        const completeTimer = window.setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem(BOOT_SESSION_KEY, "true");
        }, BOOT_COMPLETE_DELAY_MS);

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
