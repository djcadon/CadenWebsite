import { useState } from "react";
import OrbitalScene from "../components/OrbitalScene";
import TerminalBoot from "../components/TerminalBoot";
import type { DestinationId } from "../constants/destinations";

interface HomeProps {
    onSelect: (destination: string) => void;
    onReturnComplete: () => void;
    returnFrom?: DestinationId;
}

function Home({ onSelect, onReturnComplete, returnFrom }: HomeProps) {
    // Home coordinates the scene with the terminal intro and page return zoom.
    const [isBooting, setIsBooting] = useState(true);

    return (
        <section className="relative h-[calc(100dvh-70px)] min-h-[460px] overflow-hidden sm:h-[calc(100dvh-84px)]">
            {/* TODO: Lazy-load OrbitalScene so Three.js is split from the initial bundle. */}
            {/* TODO: Render a lightweight fallback while the scene chunk is loading. */}
            {/* TODO: Start loading the scene during boot, then reveal it with the boot exit. */}
            <OrbitalScene
                onSelect={onSelect}
                onReturnComplete={onReturnComplete}
                returnFrom={returnFrom}
            />
            {isBooting && <TerminalBoot onComplete={() => setIsBooting(false)} />}
        </section>
    );
}

export default Home;
