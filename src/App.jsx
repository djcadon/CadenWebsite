import { useEffect, useState } from "react";
import About from "./pages/About";
import Archive from "./pages/Archive";
import Contact from "./pages/Contact";
import Header from "./components/Header";
import Home from "./pages/Home";
import Skills from "./pages/Skills";
import Work from "./pages/Work";

const pages = {
  about: About,
  work: Work,
  archive: Archive,
  skills: Skills,
  contact: Contact,
};

function App() {
  const [page, setPage] = useState(window.location.hash.slice(1));
  const Page = pages[page];

  useEffect(() => {
    const handleHashChange = () => setPage(window.location.hash.slice(1));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (destination) => {
    window.location.hash = destination;
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1440px] overflow-hidden bg-[radial-gradient(circle_at_50%_47%,#191816_0,var(--color-bg)_42rem)] px-5 text-text sm:px-11">
      <Header />
      {Page ? (
        <>
          <button
            className="mt-12 cursor-pointer border-0 bg-transparent p-0 font-mono text-[11px] uppercase text-muted hover:text-accent"
            type="button"
            onClick={() => navigate(page === "archive" ? "work" : "home")}
          >
            ← {page === "archive" ? "back to work" : "back to orbit"}
          </button>
          <Page />
        </>
      ) : (
        <Home onSelect={navigate} />
      )}
    </main>
  );
}

export default App;
