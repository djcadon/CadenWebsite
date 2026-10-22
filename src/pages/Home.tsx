import { useState, lazy, Suspense } from "react";
import TerminalBoot from "../components/TerminalBoot";
import type { DestinationId } from "../constants/destinations";

const OrbitalScene = lazy(() => import("../components/orbital/OrbitalScene"));
const BOOT_SESSION_KEY = "caden-orbital-boot-seen";

interface HomeProps {
    onSelect: (destination: string) => void;
    onReturnComplete: () => void;
    returnFrom?: DestinationId;
    isBlackHole?: boolean;
    onEscapeBlackHole?: () => void;
}

function Home({
    onSelect,
    onReturnComplete,
    returnFrom,
    isBlackHole = false,
    onEscapeBlackHole,
}: HomeProps) {
    // Home coordinates the scene with the terminal intro and page return zoom.
    const [isBooting, setIsBooting] = useState(
        () => sessionStorage.getItem(BOOT_SESSION_KEY) !== "true",
    );

    return (
        <section
            aria-hidden="true"
            className="relative -mx-5 sm:-mx-11 h-[calc(100dvh-var(--header-height))] min-h-0 overflow-hidden"
        >
            <Suspense
                fallback={
                    <div className="flex h-full w-full items-center justify-center">
                        <span className="font-mono text-sm uppercase tracking-[.14em] text-muted">
                            Loading Systems...
                        </span>
                    </div>
                }
            >
                <OrbitalScene
                    onSelect={onSelect}
                    onReturnComplete={onReturnComplete}
                    returnFrom={returnFrom}
                    isBlackHole={isBlackHole}
                    onEscapeBlackHole={onEscapeBlackHole}
                />
            </Suspense>
            {isBooting && <TerminalBoot onComplete={() => setIsBooting(false)} />}
        </section>
    );
}

export default Home;
