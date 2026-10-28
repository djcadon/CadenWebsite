import { useEffect, useState } from "react";

// =============================================================================
// TERMINAL BOOT SPLASH SEQUENCE
// Retro CRT terminal boot-up animation played once per session upon initial visit.
// =============================================================================

interface TerminalBootProps {
    onComplete: () => void;
}

const BOOT_SESSION_KEY = "caden-orbital-boot-seen";
const CHARACTER_DELAY_MS = 55;
const EXIT_FADE_DELAY_MS = 1500;
const BOOT_COMPLETE_DELAY_MS = 2000;

// =============================================================================
// TYPEWRITER LINE SIMULATOR
// Emulates character-by-character typing with blinking phosphor cursor and delays.
// =============================================================================

interface TerminalSegment {
    text: string;
    className?: string;
    revealAfterComplete?: boolean;
    isPrompt?: boolean;
}

interface TerminalLineProps {
    segments: TerminalSegment[];
    cursor?: boolean;
    isCommand?: boolean;
    processingDelay?: number;
    isActive: boolean;
    isComplete: boolean;
    onComplete: () => void;
}

function TerminalLine({
    segments,
    cursor = false,
    isCommand = false,
    processingDelay = 400,
    isActive,
    isComplete,
    onComplete,
}: TerminalLineProps) {
    const totalTypedCharacters = segments.reduce(
        (sum, seg) => (seg.isPrompt ? sum : sum + seg.text.length),
        0,
    );
    // If it is an output line (not a command), it instantly prints all characters
    const [visibleCount, setVisibleCount] = useState(
        isComplete ||
            !isCommand ||
            (isActive && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            ? totalTypedCharacters
            : 0,
    );
    // Track when the line has finished its "processing" delay
    const [lineDone, setLineDone] = useState(isComplete);

    useEffect(() => {
        if (!isActive || isComplete) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const timer = setTimeout(() => {
                setVisibleCount(totalTypedCharacters);
                setLineDone(true);
                onComplete();
            }, 0);
            return () => clearTimeout(timer);
        }

        if (isCommand) {
            // Typing effect for the command line
            if (visibleCount < totalTypedCharacters) {
                const isPause = Math.random() > 0.85;
                const isFast = Math.random() > 0.5;
                let delay = CHARACTER_DELAY_MS;

                if (isPause) delay += 100;
                else if (isFast) delay -= 30;

                const timer = setTimeout(() => {
                    setVisibleCount((prev) => prev + 1);
                }, delay);
                return () => clearTimeout(timer);
            } else {
                const completeTimer = setTimeout(() => {
                    setLineDone(true);
                    onComplete();
                }, 150); // slight pause after typing before running
                return () => clearTimeout(completeTimer);
            }
        } else {
            // Output lines instantly appear, but take time to "process"
            const processTimer = setTimeout(() => {
                setLineDone(true);
                onComplete();
            }, processingDelay);
            return () => clearTimeout(processTimer);
        }
    }, [
        isActive,
        isComplete,
        visibleCount,
        totalTypedCharacters,
        onComplete,
        isCommand,
        processingDelay,
    ]);

    if (!isActive && !isComplete) {
        return null;
    }

    let currentTypedIdx = 0;
    // Only show typing cursor if this line is actively being typed out
    const showTypingCursor = isActive && isCommand && visibleCount < totalTypedCharacters;
    // Show final cursor if this line is marked to hold the cursor at the end (blinking while active and complete)
    const showFinalCursor = cursor && (isActive || isComplete);

    return (
        <p className="terminal-boot-line">
            {segments.map((segment, segIndex) => {
                const segmentChars = Array.from(segment.text);
                return (
                    <span className={segment.className} key={segIndex}>
                        {segmentChars.map((character, charIndex) => {
                            const isVisible =
                                isComplete || segment.isPrompt || currentTypedIdx < visibleCount;

                            if (!segment.isPrompt) {
                                currentTypedIdx++;
                            }

                            if (!isVisible) return null;

                            let displayChar = character;
                            // For segments that reveal their text only after the line is completely done processing
                            if (segment.revealAfterComplete && !lineDone) {
                                displayChar = character.replace(/[^\s]/g, "\u00a0");
                            }

                            return (
                                <span
                                    className="terminal-character"
                                    key={`${segIndex}-${charIndex}`}
                                >
                                    {displayChar === " " ? "\u00a0" : displayChar}
                                </span>
                            );
                        })}
                    </span>
                );
            })}
            {showTypingCursor && <span className="terminal-cursor">_</span>}
            {showFinalCursor && <span className="terminal-cursor">_</span>}
        </p>
    );
}

// =============================================================================
// TERMINAL BOOT ORCHESTRATOR
// Steps sequentially through boot sequences and dispatches completion fade-out.
// =============================================================================

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
            isCommand: true,
            segments: [
                {
                    text: "C:/Users/Caden/",
                    className: "text-accent hidden sm:inline",
                    isPrompt: true,
                },
                { text: "~/", className: "text-accent sm:hidden", isPrompt: true },
                { text: "> ", className: "text-text", isPrompt: true },
                { text: "launch --orbital-interface" },
            ],
        },
        {
            processingDelay: 500,
            segments: [
                {
                    text: "[ok]",
                    className: "text-accent",
                    revealAfterComplete: true,
                },
                { text: " initializing orbital workspace..." },
            ],
        },
        {
            processingDelay: 600,
            segments: [
                {
                    text: "[ok]",
                    className: "text-accent",
                    revealAfterComplete: true,
                },
                { text: " loading navigation system..." },
            ],
        },
        {
            processingDelay: 500,
            segments: [
                {
                    text: "[ok]",
                    className: "text-accent",
                    revealAfterComplete: true,
                },
                { text: " establishing visual link..." },
            ],
        },
        {
            processingDelay: 800,
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

        const exitTimer = window.setTimeout(() => setIsExiting(true), EXIT_FADE_DELAY_MS);
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

    const handleSkip = () => {
        if (isExiting) return;
        setIsExiting(true);
        window.setTimeout(() => {
            sessionStorage.setItem(BOOT_SESSION_KEY, "true");
            setIsVisible(false);
        }, 600);
    };

    return (
        <div
            aria-label="Initializing orbital navigation"
            aria-live="polite"
            className={`terminal-boot fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6 ${isExiting ? "terminal-boot-exiting" : ""}`}
            role="status"
        >
            {/* Give the terminal block a fixed height so it doesn't push the layout around as lines appear */}
            <div className="w-full max-w-2xl h-32 font-mono text-xs leading-6 text-muted sm:text-sm">
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

            <button
                aria-label="Skip boot sequence"
                className={`mt-16 font-mono text-xs text-muted/40 transition-colors hover:text-text focus:outline-none focus:ring-1 focus:ring-accent ${isExiting ? "pointer-events-none opacity-0" : ""}`}
                onClick={handleSkip}
            >
                [skip]
            </button>
        </div>
    );
}

export default TerminalBoot;
