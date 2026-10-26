import { useState, useCallback } from "react";
import type { Planet } from "../components/orbital/planets";

// =============================================================================
// UNIFIED COMMAND ENGINE & USECOMMANDS HOOK
// Single source of truth for orbital CLI parsing, history management,
// on-screen terminal state, and DevTools (window.orbit) integration.
// =============================================================================

export const STARLIGHT_STORAGE_KEY = "caden-starlight-captured";

export const VALID_DESTINATIONS = [
    "about",
    "work",
    "skills",
    "contact",
    "archive",
    "blackhole",
] as const;

export const DIRECTORY_LISTING = "about/   work/   skills/   contact/   archive/   secret.txt";

export const SECRET_MEMO_LINES = [
    "--------------------------------------------------------",
    "FROM: Caden O'Leary <caden@orbital>",
    "TO: Authorized Guest",
    "SUBJECT: Project Horizon & Orbital Architecture",
    "",
    "If you're reading this from the terminal, you appreciate the",
    "details as much as I do. Built with Three.js, React 19,",
    "Tailwind CSS, and custom GLSL noise shaders.",
    "Catch shooting stars, throttle time, and explore the void.",
    "--------------------------------------------------------",
];

export function getStarlightCount(): number {
    return parseInt(localStorage.getItem(STARLIGHT_STORAGE_KEY) || "0", 10);
}

export function setStarlightCount(newCount: number): number {
    const clamped = Math.max(0, Math.floor(newCount));
    localStorage.setItem(STARLIGHT_STORAGE_KEY, clamped.toString());
    return clamped;
}

export function resolveDestination(
    rawTarget: string,
    currentHash = "",
): {
    valid: boolean;
    target: string;
    raw: string;
    message: string;
} {
    const raw = rawTarget.trim();
    if (!raw) {
        return {
            valid: true,
            target: "home",
            raw: "",
            message: "[NAVIGATION] Returned to orbital overview (~).",
        };
    }

    // Normalize Windows backslashes to forward slashes and strip leading hash
    const clean = raw.toLowerCase().replace(/\\/g, "/").replace(/^#+/, "");

    // 1. Exact parent directory navigation (.. or ../ or multiple ../../)
    if (clean === ".." || clean === "../" || /^(\.\.\/?)+$/.test(clean)) {
        return {
            valid: true,
            target: "home",
            raw,
            message: "[NAVIGATION] Navigated up to orbital overview (~).",
        };
    }

    // 2. Current directory (. or ./)
    if (clean === "." || clean === "./") {
        return {
            valid: true,
            target: currentHash || "home",
            raw,
            message: `[NAVIGATION] Remaining at current location (${currentHash ? `~/${currentHash}` : "~"}).`,
        };
    }

    // 3. Normalize path prefixes: "../", "~/", "~", "c:/users/caden/", "/users/caden/", "users/caden/", "./", "/"
    const dir = clean
        .replace(/^c:\/users\/caden\/?/, "")
        .replace(/^\/?users\/caden\/?/, "")
        .replace(/^~\/?/, "")
        .replace(/^(\.\.\/+)+/, "")
        .replace(/^\.?\/+/, "")
        .replace(/\/+$/, "");

    // If normalized to root (e.g. "~", "~/", "/", "c:/users/caden", "users/caden"), return to home overview
    if (!dir) {
        return {
            valid: true,
            target: "home",
            raw,
            message: "[NAVIGATION] Returned to orbital overview (~).",
        };
    }

    // 'home' is the root orbit environment (~), not a subpage directory
    if (dir === "home") {
        return {
            valid: false,
            target: "",
            raw,
            message:
                "cd: 'home' is not a directory. Use 'cd ..', 'cd ~', or 'cd' to return to orbital overview.",
        };
    }

    if ((VALID_DESTINATIONS as readonly string[]).includes(dir)) {
        return {
            valid: true,
            target: dir,
            raw,
            message: `[NAVIGATION] Changed celestial directory to: '${dir}'.`,
        };
    }

    return {
        valid: false,
        target: "",
        raw,
        message: `cd: no such destination or directory: '${raw}'. Valid directories: ${VALID_DESTINATIONS.join(", ")}. Use 'cd ..' or 'cd ~' to return to orbit overview.`,
    };
}

export interface OrbitTelemetryData {
    "Orbital Velocity": string;
    "System Status": string;
    "Syzygy Alignment": string;
    "Starlight Captured": number;
    Planets: Array<{
        Planet: string;
        Radius: number;
        Angle: string;
    }>;
}

export interface OrbitMissionDeck {
    help: () => void;
    warp: (multiplier?: number) => void;
    blackhole: () => void;
    escape: () => void;
    syzygy: () => void;
    cd: (destination?: string) => void;
    goto: (destination: string) => void;
    run: (commandLine: string) => string;
    starlight: number;
    telemetry: OrbitTelemetryData;
    isBlackHole: boolean;
    getTelemetryState: () => {
        speedMultiplier: number;
        isBlackHole: boolean;
        syzygyAlignment: number;
        orbitalElapsed: number;
    };
}

declare global {
    interface Window {
        orbit?: OrbitMissionDeck;
    }
}

export interface MissionDeckCallbacks {
    onSelect: (destination: string) => void;
    onEscape: () => void;
    setWarpMultiplier: (multiplier: number | null) => void;
    alignPlanets: () => void;
    getTelemetryState: () => {
        speedMultiplier: number;
        isBlackHole: boolean;
        syzygyAlignment: number;
        orbitalElapsed: number;
    };
    planets: Planet[];
}

export interface CommandOutput {
    type: "output" | "error" | "system";
    text: string;
}

export interface CommandContext {
    onNavigate: (destination: string) => void;
    onClose?: () => void;
    onClear?: () => void;
    currentHash?: string;
}

export function runOrbitalCommand(rawCommand: string, context: CommandContext): CommandOutput[] {
    const trimmed = rawCommand.trim();
    if (!trimmed) return [];

    const [command, ...args] = trimmed.split(/\s+/);
    const lowerCmd = command.toLowerCase();
    const argString = args.join(" ").trim();
    const currentHash = context.currentHash ?? window.location.hash.slice(1);
    const outputs: CommandOutput[] = [];

    const out = (text: string) => outputs.push({ type: "output", text });
    const err = (text: string) => outputs.push({ type: "error", text });

    switch (lowerCmd) {
        case "help": {
            out("✦ AVAILABLE ORBITAL FLIGHT COMMANDS ✦");
            out(
                "  cd <target>        - Change destination (e.g. 'cd work', 'cd ..' or 'cd ~' to return to orbit)",
            );
            out("  ls / dir           - List available directories and files");
            out("  pwd                - Print current orbital directory path");
            out("  warp [multiplier]  - Throttle time dilation (e.g. warp 6, warp 1 to reset)");
            out("  syzygy             - Instantly align planets into resonant collinear syzygy");
            out(
                "  blackhole          - Engage gravitational descent into #blackhole event horizon",
            );
            out("  escape             - Abort singularity descent and return to standard orbit");
            out("  starlight          - Inspect your captured starlight inventory");
            out("  telemetry          - Display live celestial vectors and system coordinates");
            out("  cat secret.txt     - Read classified mission memorandum");
            out("  whoami             - Display current flight clearance profile");
            out("  date / time        - Display orbital mission timestamps");
            out("  clear              - Wipe terminal buffer");
            out("  exit / quit        - Close terminal drawer");
            break;
        }

        case "warp": {
            const multiplier = args[0] ? parseFloat(args[0]) : 6.0;
            if (isNaN(multiplier) || multiplier <= 0) {
                err("Usage: warp [multiplier > 0] (e.g. 'warp 8' or 'warp 1' to reset)");
                break;
            }
            const clamped = Math.min(Math.max(multiplier, 0.1), 25);
            if (window.orbit?.warp) {
                window.orbit.warp(clamped);
                out(
                    `[WARP DRIVE] Tachyon throttle set to ${clamped.toFixed(1)}x orbital velocity.`,
                );
            } else {
                context.onNavigate("home");
                window.setTimeout(() => window.orbit?.warp(clamped), 300);
                out(
                    `[NAVIGATION] Returning to orbit overview to engage ${clamped.toFixed(1)}x warp throttle.`,
                );
            }
            break;
        }

        case "syzygy": {
            if (window.orbit?.isBlackHole) {
                err("Cannot align planets: system is engulfed in the singularity event horizon.");
                break;
            }
            if (window.orbit?.syzygy) {
                window.orbit.syzygy();
                out("[RESONATOR] Adjusting celestial vectors into collinear alignment.");
                out("[SYZYGY LOCKED] 3.0-second gravitational resonance engaged.");
            } else {
                context.onNavigate("home");
                window.setTimeout(() => window.orbit?.syzygy(), 400);
                out("[NAVIGATION] Returning to orbital overview to lock syzygy alignment.");
            }
            break;
        }

        case "blackhole": {
            out("[CRITICAL] Gravitational dive coordinates engaged. Entering #blackhole.");
            context.onNavigate("blackhole");
            if (window.orbit?.blackhole) {
                window.orbit.blackhole();
            }
            break;
        }

        case "escape": {
            out("[THRUSTERS] Aborting singularity descent. Returning to standard orbit.");
            context.onNavigate("home");
            if (window.orbit?.escape) {
                window.orbit.escape();
            }
            break;
        }

        case "cd":
        case "goto": {
            const result = resolveDestination(argString, currentHash);
            if (result.valid) {
                out(result.message);
                context.onNavigate(result.target);
            } else {
                err(result.message);
            }
            break;
        }

        case "ls":
        case "dir": {
            out(DIRECTORY_LISTING);
            break;
        }

        case "pwd": {
            const path =
                currentHash && currentHash !== "home"
                    ? `~/Users/Caden/${currentHash}`
                    : "~/Users/Caden";
            out(path);
            break;
        }

        case "starlight": {
            if (args.length > 0) {
                err(
                    "Permission denied: Starlight cannot be forged. Catch shooting stars across orbit to gather celestial starlight.",
                );
                break;
            }
            const current = getStarlightCount();
            out(
                `✦ Starlight captured: ${current} starlight. Catch shooting stars across orbit to gather more.`,
            );
            break;
        }

        case "telemetry": {
            if (window.orbit?.telemetry) {
                const t = window.orbit.telemetry;
                out(`Velocity: ${t["Orbital Velocity"]} | Status: ${t["System Status"]}`);
                out(`Syzygy: ${t["Syzygy Alignment"]} | Starlight: ${t["Starlight Captured"]}`);
                t.Planets.forEach((p) => {
                    out(`  Planet ${p.Planet.padEnd(8)} | Radius: ${p.Radius} | Angle: ${p.Angle}`);
                });
            } else {
                out("Status: NOMINAL | Orbit systems active.");
            }
            break;
        }

        case "cat": {
            const clean = argString
                .trim()
                .toLowerCase()
                .replace(/\\/g, "/")
                .replace(/^c:\/users\/caden\/?/, "")
                .replace(/^\/?users\/caden\/?/, "")
                .replace(/^~\/?/, "")
                .replace(/^(\.\.\/+)+/, "")
                .replace(/^\.?\/+/, "")
                .replace(/\/+$/, "");

            if (clean === "home" || clean === "") {
                err("cat: orbital overview (~): Is a directory, not a file.");
                break;
            }
            if ((VALID_DESTINATIONS as readonly string[]).includes(clean)) {
                err(`cat: ${argString}: Is a directory. Try 'cd ${argString}' instead.`);
                break;
            }
            if (clean === "secret.txt" || clean === "memo.txt") {
                SECRET_MEMO_LINES.forEach((line) => out(line));
            } else {
                err(`cat: ${argString || "null"}: No such file or directory.`);
            }
            break;
        }

        case "whoami": {
            out("guest@orbital-telemetry // clearance: level-1 (flight observer)");
            break;
        }

        case "sudo": {
            err("Permission denied: Incident reported to Starfleet Command.");
            break;
        }

        case "date":
        case "time": {
            out(
                `MISSION TIME: ${new Date().toISOString()} (LOCAL: ${new Date().toLocaleTimeString()})`,
            );
            break;
        }

        case "clear": {
            context.onClear?.();
            break;
        }

        case "exit":
        case "quit": {
            context.onClose?.();
            break;
        }

        default: {
            err(`Command not recognized: '${command}'. Type 'help' for flight orders.`);
            break;
        }
    }

    return outputs;
}

let hasPrintedWelcome = false;

export function printWelcomeBanner(): void {
    if (hasPrintedWelcome) return;
    hasPrintedWelcome = true;

    const bannerStyle =
        "color: #f1bd78; font-family: monospace; font-size: 11px; line-height: 1.4; font-weight: bold;";
    const titleStyle =
        "color: #101010; background: #f1bd78; font-family: monospace; font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 2px;";
    const accentStyle =
        "color: #93b8d8; font-family: monospace; font-size: 11px; font-weight: bold;";

    console.log(
        `%c CADEN // ORBITAL TELEMETRY DECK v2.4 %c\n` +
            `%c ┌────────────────────────────────────────────────────────┐\n` +
            ` │  SYS_ID: Sol-04 // LATENCY: 0.00ms // STATUS: NOMINAL   │\n` +
            ` │  Interactive flight controls mounted to %corbit%c          │\n` +
            ` │  Type %corbit.help()%c to view the mission command registry.│\n` +
            ` └────────────────────────────────────────────────────────┘`,
        titleStyle,
        "",
        bannerStyle,
        accentStyle,
        bannerStyle,
        accentStyle,
        bannerStyle,
    );
}

export function registerMissionDeck(callbacks: MissionDeckCallbacks): () => void {
    printWelcomeBanner();

    const deck: Partial<OrbitMissionDeck> = {
        help: () => {
            const headerStyle =
                "color: #f1bd78; font-family: monospace; font-size: 12px; font-weight: bold; padding: 2px 0;";
            const cmdStyle =
                "color: #a8c58c; font-family: monospace; font-weight: bold; font-size: 11px;";
            const descStyle = "color: #dedbd3; font-family: monospace; font-size: 11px;";

            console.log("%c✦ ORBITAL MISSION COMMAND REGISTRY ✦", headerStyle);
            console.log(
                "%corbit.warp(multiplier)%c  Accelerate time dilation (e.g. orbit.warp(8), or orbit.warp(1) to reset)",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.syzygy()%c          Instantly align all 4 planets to trigger the resonant Syzygy beam",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.blackhole()%c       Initiate gravitational collapse into the #blackhole event horizon",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.escape()%c          Execute thruster burn to return to standard overview orbit",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.cd(destination)%c   Change directory (e.g. orbit.cd('work'), orbit.cd('..'), orbit.cd('~'))",
                cmdStyle,
                descStyle,
            );
            console.log("%corbit.goto(target)%c      Alias for orbit.cd()", cmdStyle, descStyle);
            console.log(
                "%corbit.run(command)%c       Execute CLI commands directly (e.g. orbit.run('cat secret.txt'))",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.starlight%c         Inspect your captured starlight count",
                cmdStyle,
                descStyle,
            );
            console.log(
                "%corbit.telemetry%c         Inspect live celestial vectors, orbital velocity, and status",
                cmdStyle,
                descStyle,
            );
        },

        warp: (multiplier?: number) => {
            if (multiplier === undefined || multiplier === 1) {
                callbacks.setWarpMultiplier(null);
                console.log(
                    "%c[WARP DRIVE] Time dilation reset to standard 1.0x orbit.",
                    "color: #f1bd78; font-family: monospace;",
                );
            } else {
                const clamped = Math.max(0.1, Math.min(multiplier, 25));
                callbacks.setWarpMultiplier(clamped);
                console.log(
                    `%c[WARP DRIVE] Tachyon throttle engaged: ${clamped.toFixed(1)}x orbital velocity.`,
                    "color: #f1bd78; font-family: monospace; font-weight: bold;",
                );
            }
        },

        blackhole: () => {
            console.warn(
                "%c[CRITICAL] Navigating coordinates into the singularity event horizon.",
                "color: #f1bd78; font-family: monospace; font-weight: bold;",
            );
            callbacks.onSelect("blackhole");
        },

        escape: () => {
            console.log(
                "%c[THRUSTERS] Aborting singularity descent. Returning to standard orbit.",
                "color: #93b8d8; font-family: monospace;",
            );
            callbacks.onEscape();
        },

        syzygy: () => {
            const telemetry = callbacks.getTelemetryState();
            if (telemetry.isBlackHole) {
                console.warn(
                    "%c[ERROR] Cannot align planets: celestial bodies engulfed by singularity event horizon.",
                    "color: #f1bd78; font-family: monospace; font-weight: bold;",
                );
                return;
            }
            console.log(
                "%c[RESONATOR] Adjusting celestial vectors into collinear alignment.",
                "color: #f1bd78; font-family: monospace; font-weight: bold;",
            );
            callbacks.alignPlanets();
        },

        cd: (destination = "") => {
            const result = resolveDestination(destination);
            if (result.valid) {
                console.log(`%c${result.message}`, "color: #a8c58c; font-family: monospace;");
                callbacks.onSelect(result.target);
            } else {
                console.warn(`%c${result.message}`, "color: #f1bd78; font-family: monospace;");
            }
        },

        goto: (destination: string) => {
            deck.cd!(destination);
        },

        run: (commandLine: string) => {
            const results = runOrbitalCommand(commandLine, {
                onNavigate: callbacks.onSelect,
                onClose: () => {},
                onClear: () => console.clear(),
            });
            results.forEach((r) => {
                if (r.type === "error") {
                    console.warn(`%c${r.text}`, "color: #f1bd78; font-family: monospace;");
                } else {
                    console.log(`%c${r.text}`, "color: #a8c58c; font-family: monospace;");
                }
            });
            return results.map((r) => r.text).join("\n");
        },

        getTelemetryState: callbacks.getTelemetryState,
    };

    Object.defineProperty(deck, "isBlackHole", {
        get(): boolean {
            return callbacks.getTelemetryState().isBlackHole;
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(deck, "starlight", {
        get(): number {
            const count = getStarlightCount();
            console.log(
                `%c✦ [STARLIGHT INVENTORY] ${count} starlight captured.`,
                "color: #f1bd78; font-family: monospace; font-weight: bold;",
            );
            return count;
        },
        set() {
            console.warn(
                "%c[ACCESS DENIED] Celestial starlight cannot be forged. Catch shooting stars across orbit to gather starlight.",
                "color: #f1bd78; font-family: monospace; font-weight: bold;",
            );
        },
        configurable: true,
        enumerable: true,
    });

    Object.defineProperty(deck, "telemetry", {
        get(): OrbitTelemetryData {
            const state = callbacks.getTelemetryState();
            const data: OrbitTelemetryData = {
                "Orbital Velocity": `${state.speedMultiplier.toFixed(2)}x`,
                "System Status": state.isBlackHole
                    ? "CRITICAL // EVENT HORIZON"
                    : state.syzygyAlignment >= 0.95
                      ? "HARMONIC SYZYGY ACTIVE"
                      : "STANDARD ORBITAL CRUISE",
                "Syzygy Alignment": `${(state.syzygyAlignment * 100).toFixed(1)}%`,
                "Starlight Captured": getStarlightCount(),
                Planets: callbacks.planets.map((p) => {
                    const currentAngle = (p.angle + state.orbitalElapsed * p.speed) % (Math.PI * 2);
                    const angleDeg = (
                        ((currentAngle < 0 ? currentAngle + Math.PI * 2 : currentAngle) * 180) /
                        Math.PI
                    ).toFixed(1);
                    return {
                        Planet: (p.mesh.userData.id as string).toUpperCase(),
                        Radius: p.distance,
                        Angle: `${angleDeg}°`,
                    };
                }),
            };
            console.table(data.Planets);
            return data;
        },
        configurable: true,
        enumerable: true,
    });

    window.orbit = deck as OrbitMissionDeck;

    return () => {
        delete window.orbit;
    };
}

// =============================================================================
// REACT CUSTOM HOOK: useCommands
// Manages terminal buffer state, history navigation, and prompt location.
// =============================================================================

export interface TerminalEntry {
    id: string;
    type: "input" | "output" | "error" | "system";
    text: string;
}

export interface UseCommandsOptions {
    onNavigate: (destination: string) => void;
    onClose?: () => void;
}

export function useCommands({ onNavigate, onClose }: UseCommandsOptions) {
    const [entries, setEntries] = useState<TerminalEntry[]>([
        {
            id: "boot-1",
            type: "system",
            text: "CADEN ORBITAL CLI // v2.4 [SYS_ID: Sol-04]",
        },
        {
            id: "boot-2",
            type: "system",
            text: "Type 'help' for available flight commands. Press ESC to close.",
        },
    ]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    const getCurrentLocation = useCallback(() => {
        const hash = window.location.hash.slice(1);
        if (!hash || hash === "home") return "~";
        return `~/${hash}`;
    }, []);

    const currentPrompt = `caden@orbital:${getCurrentLocation()}$`;

    const addEntry = useCallback((type: TerminalEntry["type"], text: string) => {
        setEntries((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, text }]);
    }, []);

    const clearEntries = useCallback(() => {
        setEntries([]);
    }, []);

    const executeCommand = useCallback(
        (rawCommand: string) => {
            const trimmed = rawCommand.trim();
            if (!trimmed) return;

            addEntry("input", `${currentPrompt} ${trimmed}`);
            setHistory((prev) => [trimmed, ...prev]);
            setHistoryIndex(-1);

            const results = runOrbitalCommand(trimmed, {
                onNavigate,
                onClose,
                onClear: clearEntries,
            });

            results.forEach(({ type, text }) => addEntry(type, text));
        },
        [currentPrompt, addEntry, onNavigate, onClose, clearEntries],
    );

    const navigateHistoryUp = useCallback((): string | undefined => {
        if (history.length > 0 && historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            return history[nextIdx];
        }
        return undefined;
    }, [history, historyIndex]);

    const navigateHistoryDown = useCallback((): string | undefined => {
        if (historyIndex > 0) {
            const nextIdx = historyIndex - 1;
            setHistoryIndex(nextIdx);
            return history[nextIdx];
        }
        if (historyIndex === 0) {
            setHistoryIndex(-1);
            return "";
        }
        return undefined;
    }, [historyIndex, history]);

    return {
        entries,
        currentPrompt,
        executeCommand,
        clearEntries,
        navigateHistoryUp,
        navigateHistoryDown,
    };
}
