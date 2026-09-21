import { useEffect, useState } from "react";

function Header() {
  const [page, setPage] = useState(window.location.hash.slice(1) || "home");
  const navigation = [
    { id: "about", label: "about", description: "The person behind the work." },
    { id: "home", label: "home", description: "Return to the orbital system." },
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
    const handleHashChange = () =>
      setPage(window.location.hash.slice(1) || "home");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <header className="flex h-[70px] flex-none items-center border-b border-line font-mono text-[11px] uppercase tracking-[.08em] sm:h-[84px]">
      <div aria-label="Current location" className="text-text">
        <span className="text-[25px] tracking-[-.1em]">
          C<span className="text-accent">:/</span>
        </span>
        <span className="ml-2 text-muted">{page}</span>
      </div>
      <nav className="ml-auto flex gap-3 sm:gap-6" aria-label="Main navigation">
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
        <i className="h-1.5 w-1.5 rounded-full bg-[#a8c58c]" /> online
      </span>
    </header>
  );
}

export default Header;
