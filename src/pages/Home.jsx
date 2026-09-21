import OrbitalScene from "../components/OrbitalScene";

function Home({ onSelect }) {
  return (
    <section className="relative h-[calc(100dvh-70px)] min-h-[460px] sm:h-[calc(100dvh-84px)]">
      <OrbitalScene onSelect={onSelect} />
    </section>
  );
}

export default Home;
