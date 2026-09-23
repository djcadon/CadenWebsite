import { useState } from "react";
import OrbitalScene from "../components/OrbitalScene";
import TerminalBoot from "../components/TerminalBoot";

interface HomeProps {
    onSelect: (destination: string) => void;
}

function Home({ onSelect }: HomeProps) {
    const [isBooting, setIsBooting] = useState(true);

    return (
        <section className="relative h-[calc(100dvh-70px)] min-h-[460px] overflow-hidden sm:h-[calc(100dvh-84px)]">
            <OrbitalScene onSelect={onSelect} />
            {isBooting && <TerminalBoot onComplete={() => setIsBooting(false)} />}
        </section>
    );
}

export default Home;
