import { useEffect, useState } from "react";

interface HeaderProps {
    onHome: () => void;
}

function Header({ onHome }: HeaderProps) {
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
            description: "Software, data, and engineering projects.",
        },
        {
            id: "skills",
            label: "skills",
            description: "Programming, data, systems, and troubleshooting.",
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

    return (
        <header className="flex h-[var(--header-height)] min-w-0 flex-none items-center border-b border-line font-mono text-xs uppercase tracking-[.06em] sm:text-sm">
            <div aria-label="Current location" className="text-text">
                <span className="whitespace-nowrap text-sm tracking-[-.06em] sm:text-2xl">
                    C<span className="text-accent">:/</span>Users/
                    <a
                        // Treat the directory name like a terminal parent-directory
                        // link while keeping navigation inside the React app.
                        aria-label="Return to home directory"
                        className="text-accent no-underline transition-colors hover:text-text"
                        href="/"
                        title="Return to orbital system"
                        onClick={(event) => {
                            event.preventDefault();
                            onHome();
                        }}
                    >
                        Caden
                    </a>
                    /
                </span>
                <span className="whitespace-nowrap text-sm tracking-[-.06em] text-text sm:text-2xl">
                    {page === "home" ? "" : page}
                </span>
            </div>
            <nav className="ml-auto flex shrink-0 gap-2 sm:gap-6" aria-label="Main navigation">
                {navigation.map(({ id, label, description }) => (
                    <a
                        aria-label={`${label}: ${description}`}
                        className="text-muted no-underline transition-colors hover:text-accent"
                        href={`#${id}`}
                        key={id}
                        title={description}
                    >
                        {label}
                    </a>
                ))}
            </nav>
            <span className="ml-6 hidden items-center gap-2 text-muted sm:flex">
                <i className="h-1.5 w-1.5 rounded-full bg-accent-green" /> online
            </span>
        </header>
    );
}

export default Header;
