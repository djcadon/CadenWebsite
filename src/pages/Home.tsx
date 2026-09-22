import OrbitalScene from "../components/OrbitalScene";

interface HomeProps {
    onSelect: (destination: string) => void;
}

function Home({ onSelect }: HomeProps) {
    return (
        <section className="relative h-[calc(100dvh-70px)] min-h-[460px] sm:h-[calc(100dvh-84px)]">
            <OrbitalScene onSelect={onSelect} />
        </section>
    );
}

export default Home;
