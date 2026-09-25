import { useState, lazy, Suspense } from "react";
import TerminalBoot from "../components/TerminalBoot";
import type { DestinationId } from "../constants/destinations";

const OrbitalScene = lazy(() => import("../components/OrbitalScene"));

interface HomeProps {
    onSelect: (destination: string) => void;
    onReturnComplete: () => void;
    returnFrom?: DestinationId;
}

function Home({ onSelect, onReturnComplete, returnFrom }: HomeProps) {
    // Home coordinates the scene with the terminal intro and page return zoom.
    const [isBooting, setIsBooting] = useState(true);

    return (
        <section className="relative h-[calc(100dvh-70px)] min-h-0 overflow-hidden sm:h-[calc(100dvh-84px)]">
            <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-sm uppercase tracking-[.14em] text-muted">
                        Loading Systems...
                    </span>
                </div>
            }>
                <OrbitalScene
                    onSelect={onSelect}
                    onReturnComplete={onReturnComplete}
                    returnFrom={returnFrom}
                />
            </Suspense>
            {isBooting && <TerminalBoot onComplete={() => setIsBooting(false)} />}
        </section>
    );
}

export default Home;
