import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommands } from "../hooks/useCommands";

// =============================================================================
// MISSION COMMAND TERMINAL DRAWER
// Slide-down retro terminal drawer interface powered by the unified useCommands engine.
// =============================================================================

interface CommandTerminalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (destination: string) => void;
}

export default function CommandTerminal({ isOpen, onClose, onNavigate }: CommandTerminalProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { entries, currentPrompt, executeCommand, navigateHistoryUp, navigateHistoryDown } =
        useCommands({ onNavigate, onClose });

    // =============================================================================
    // INPUT HANDLING & TERMINAL HOTKEYS
    // Manages autofocus, auto-scroll, command submission, and arrow key history navigation.
    // =============================================================================

    // Auto-focus input when terminal opens
    useEffect(() => {
        if (isOpen) {
            window.setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Auto-scroll to bottom of terminal output
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries]);

    const handleSubmit = () => {
        if (!input.trim()) return;
        executeCommand(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            return;
        }
        if (e.key === "Enter") {
            handleSubmit();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = navigateHistoryUp();
            if (prev !== undefined) setInput(prev);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = navigateHistoryDown();
            if (next !== undefined) setInput(next);
        }
    };

    // =============================================================================
    // PRESENTATIONAL DRAWER LAYOUT
    // Header status bar, scrollable output stream, and dynamic command prompt input.
    // =============================================================================

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.section
                    aria-label="Mission command terminal drawer"
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="fixed inset-x-0 top-0 z-50 flex max-h-[50vh] flex-col border-b border-accent/40 bg-bg/95 font-mono shadow-2xl backdrop-blur-md"
                >
                    {/* Terminal Title Bar */}
                    <div className="flex h-8 items-center justify-between border-b border-line/80 px-4 text-xs text-muted">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
                            <span className="uppercase tracking-[.14em] text-accent font-semibold">
                                ORBITAL TERMINAL DECK // Sol-04
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline text-[11px] text-muted">
                                [PRESS ESC TO CLOSE]
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer border border-line bg-bg px-2 py-0.5 text-[10px] uppercase text-muted hover:border-accent hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                aria-label="Close terminal"
                            >
                                [ESC]
                            </button>
                        </div>
                    </div>

                    {/* Output History Log */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed space-y-1 sm:text-sm select-text"
                    >
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className={
                                    entry.type === "input"
                                        ? "text-text font-medium"
                                        : entry.type === "error"
                                          ? "text-red-400"
                                          : entry.type === "system"
                                            ? "text-accent-blue"
                                            : "text-accent"
                                }
                            >
                                {entry.text}
                            </div>
                        ))}
                    </div>

                    {/* Command Prompt Input */}
                    <div className="flex items-center border-t border-line/80 px-4 py-2 bg-black/40">
                        <span className="shrink-0 text-xs sm:text-sm text-accent font-bold select-none mr-2">
                            {currentPrompt}
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-text focus:outline-none"
                            placeholder="Type 'help'..."
                            aria-label="Terminal command prompt"
                        />
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    );
}
