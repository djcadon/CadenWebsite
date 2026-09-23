import { useEffect, useState } from "react";
import About from "./pages/About";
import Archive from "./pages/Archive";
import Contact from "./pages/Contact";
import Header from "./components/Header";
import Home from "./pages/Home";
import Skills from "./pages/Skills";
import Work from "./pages/Work";
import type { DestinationId } from "./constants/destinations";

const pages = {
    about: About,
    work: Work,
    archive: Archive,
    skills: Skills,
    contact: Contact,
} as const;

type PageId = keyof typeof pages;

function App() {
    // The hash provides lightweight page routing while keeping the orbital
    // navigation shareable and compatible with static hosting.
    const [page, setPage] = useState(window.location.hash.slice(1));
    // Preserve the page's planet so returning home can animate from that orbit.
    const [returnFrom, setReturnFrom] = useState<DestinationId | undefined>();
    const Page = pages[page as PageId];

    useEffect(() => {
        const handleNavigation = () => setPage(window.location.hash.slice(1));
        window.addEventListener("popstate", handleNavigation);
        window.addEventListener("hashchange", handleNavigation);
        return () => {
            window.removeEventListener("popstate", handleNavigation);
            window.removeEventListener("hashchange", handleNavigation);
        };
    }, []);

    const navigate = (destination: string) => {
        if (destination === "home") {
            if (window.location.pathname === "/" && !window.location.hash) {
                return;
            }
            // Archive is reached from Work, so it returns through Work's planet.
            const destinationPage = page === "archive" ? "work" : page;
            if (destinationPage in pages) {
                setReturnFrom(destinationPage as DestinationId);
            }
            window.history.pushState({}, "", "/");
            setPage("");
            window.dispatchEvent(new PopStateEvent("popstate"));
            return;
        }
        window.location.hash = destination;
    };

    const handleReturnComplete = () => setReturnFrom(undefined);

    return (
        <main className="mx-auto min-h-dvh w-full max-w-[1440px] overflow-hidden bg-[radial-gradient(circle_at_50%_47%,#191816_0,var(--color-bg)_42rem)] px-5 text-text sm:px-11">
            <Header onHome={() => navigate("home")} />
            {Page ? (
                <>
                    <button
                        className="mt-12 cursor-pointer border-0 bg-transparent p-0 font-mono text-xs uppercase text-muted hover:text-accent sm:text-sm"
                        type="button"
                        onClick={() => navigate(page === "archive" ? "work" : "home")}
                    >
                        ← {page === "archive" ? "back to work" : "back to orbit"}
                    </button>
                    <Page />
                </>
            ) : (
                <Home
                    onSelect={navigate}
                    onReturnComplete={handleReturnComplete}
                    returnFrom={returnFrom}
                />
            )}
        </main>
    );
}

export default App;
