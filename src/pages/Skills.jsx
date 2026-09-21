const skillGroups = [
  ["Languages", "Python · C++ · C# · C · JavaScript · SQL · VBA"],
  [
    "Software & APIs",
    "React · FastAPI · Flask · REST APIs · .NET · Docker · GitHub",
  ],
  [
    "Data & AI",
    "Database design · RAG · Local LLMs · OpenAI API · Google Gemini",
  ],
  [
    "Systems & security",
    "Linux · Windows · Operating systems · Cyber defense · Malware analysis",
  ],
  [
    "Embedded & satellite",
    "STM32 · Raspberry Pi · Satellite systems · Ground systems · LabVIEW",
  ],
  [
    "Industrial technology",
    "CNC machines · HMI programming · Injection molding · Laser cutting",
  ],
];

function Skills() {
  return (
    <section className="relative -mx-5 min-h-[calc(100vh-230px)] bg-[radial-gradient(circle_at_80%_30%,#274e32,transparent_38rem)] px-5 py-[10vh] sm:-mx-11 sm:px-11">
      <p className="font-mono text-[11px] uppercase tracking-[.12em] text-muted">
        03 / capabilities
      </p>
      <h1 className="my-6 max-w-[800px] text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
        Tools are only
        <br />
        <span className="text-[#a8c58c]">the beginning.</span>
      </h1>
      <p className="mb-7 max-w-[620px] text-[21px] leading-relaxed text-text">
        A practical technical foundation built through software development,
        data systems, operating systems, and hands-on troubleshooting.
      </p>
      <div className="mt-16 grid max-w-[850px] gap-0 border-t border-line sm:grid-cols-2">
        {skillGroups.map(([title, skills]) => (
          <div className="border-b border-line py-6 sm:mr-8" key={title}>
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#a8c58c]">
              {title}
            </p>
            <p className="mt-3 font-mono text-sm leading-7 text-text">
              {skills}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skills;
