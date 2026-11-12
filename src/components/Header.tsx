import { useEffect, useState } from "react";

// =============================================================================
// CELESTIAL HEADER NAVIGATION
// Breadcrumb directory bar, cross-page destination links, and terminal affordance.
// =============================================================================

interface HeaderProps {
    onHome: () => void;
    onToggleTerminal?: () => void;
}

function Header({ onHome, onToggleTerminal }: HeaderProps) {
    const [page, setPage] = useState(window.location.hash.slice(1) || "home");
    const navigation = [
        {
            id: "about",
            label: "about",
            description: "The person behind the work.",
        },
        {
            id: "work",
            label: "work",
            description: "Professional work and engineering projects.",
        },
        {
            id: "skills",
            label: "skills",
            description: "The tools I use to build useful things.",
        },
        {
            id: "contact",
            label: "contact",
            description: "An open channel for new conversations.",
        },
    ];

    useEffect(() => {
        const handleNavigation = () => setPage(window.location.hash.slice(1) || "home");
        window.addEventListener("popstate", handleNavigation);
        window.addEventListener("hashchange", handleNavigation);
        return () => {
            window.removeEventListener("popstate", handleNavigation);
            window.removeEventListener("hashchange", handleNavigation);
        };
    }, []);

    // =============================================================================
    // DYNAMIC ACCENT & ACTIVE ROUTE STYLES
    // Maps routes to distinct celestial planetary palette tokens.
    // =============================================================================

    const getAccentClass = (currentPage: string) => {
        switch (currentPage) {
            case "work":
                return "text-accent-blue";
            case "archive":
                return "text-accent-blue";
            case "skills":
                return "text-accent-green";
            case "about":
                return "text-accent-tan";
            case "contact":
                return "text-accent-purple";
            default:
                return "text-accent";
        }
    };

    const getHoverAccentClass = (currentPage: string) => {
        switch (currentPage) {
            case "work":
                return "hover:text-accent-blue";
            case "archive":
                return "hover:text-accent-blue";
            case "skills":
                return "hover:text-accent-green";
            case "about":
                return "hover:text-accent-tan";
            case "contact":
                return "hover:text-accent-purple";
            default:
                return "hover:text-accent";
        }
    };

    // =============================================================================
    // HEADER COMPONENT & TELEMETRY CONTROLS
    // Renders the breadcrumb root link, navigation tabs, CLI button, and online badge.
    // =============================================================================

    return (
        <header className="flex h-[var(--header-height)] min-w-0 flex-none items-center border-b border-line font-mono text-xs uppercase tracking-[.06em] sm:text-sm">
            <div aria-label="Current location" className="text-text flex min-w-0 shrink">
                <span className="whitespace-nowrap text-sm tracking-[-.06em] sm:text-2xl">
                    <span className="hidden sm:inline">C</span>
                    <span className={`hidden sm:inline ${getAccentClass(page)}`}>:/</span>
                    <span className="hidden sm:inline">Users/</span>
                    <a
                        // Treat the directory name like a terminal parent-directory
                        // link while keeping navigation inside the React app.
                        aria-label="Return to orbital system"
                        className={`${getAccentClass(page)} no-underline transition-colors hover:text-text`}
                        href="/"
                        title="Return to orbital system"
                        onClick={(event) => {
                            event.preventDefault();
                            onHome();
                        }}
                    >
                        <span className="hidden sm:inline">Caden/</span>
                        <span className="sm:hidden">~/</span>
                    </a>
                </span>
                <span className="truncate text-sm tracking-[-.06em] text-text sm:text-2xl">
                    {page === "home" ? "" : page}
                </span>
            </div>
            <nav className="ml-auto flex shrink-0 gap-2 sm:gap-6" aria-label="Main navigation">
                {navigation.map(({ id, label, description }) => (
                    <a
                        aria-label={`${label}: ${description}`}
                        className={`${id === page ? getAccentClass(id) : "text-muted"} no-underline transition-colors ${getHoverAccentClass(id)}`}
                        href={`#${id}`}
                        key={id}
                        title={description}
                    >
                        {label}
                    </a>
                ))}
            </nav>
            {onToggleTerminal && (
                <button
                    type="button"
                    onClick={onToggleTerminal}
                    aria-label="Toggle mission command terminal"
                    title="Toggle Mission Terminal (Press ` or ~)"
                    className="ml-2 sm:ml-4 flex items-center gap-1 rounded border border-line bg-surface/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted transition-colors hover:border-accent hover:text-accent cursor-pointer"
                >
                    <span className="text-accent">~</span>
                    <span className="hidden sm:inline opacity-70">cli</span>
                </button>
            )}
            <span className="ml-3 sm:ml-6 hidden items-center gap-2 text-muted sm:flex">
                <i className="h-1.5 w-1.5 rounded-full bg-accent-green" /> online
            </span>
        </header>
    );
}

export default Header;
