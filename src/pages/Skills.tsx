const skillGroups: Record<string, string[]> = {
    Languages: ["Python", "C++", "C#", "C", "JavaScript", "TypeScript", "SQL", "VBA"],
    "Frameworks & Libraries": ["React", "FastAPI", "Flask", ".NET", "REST APIs"],
    "Tools & Infrastructure": ["Docker", "GitHub", "Linux", "Windows", "Operating systems"],
    "AI & ML": ["RAG", "Local LLMs", "OpenAI API", "Google Gemini"],
    Cybersecurity: ["Cyber defense", "Malware analysis"],
    "Hardware & Manufacturing": [
        "STM32",
        "Raspberry Pi",
        "CNC machines",
        "HMI programming",
        "Injection molding",
        "Laser cutting",
    ],
    "Space Systems": ["Satellite Systems", "Ground Systems"],
};

function Skills() {
    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] bg-[radial-gradient(circle_at_80%_30%,#274e32,transparent_38rem)] px-5 py-[10vh] sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                03 / capabilities
            </p>
            <h1 className="my-6 max-w-[800px] text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
                Tools are only
                <br />
                <span className="text-[#a8c58c]">the beginning.</span>
            </h1>
            <p className="mb-7 max-w-[620px] text-lg leading-relaxed text-text sm:text-xl">
                A practical technical foundation built through software development, data systems,
                operating systems, and hands-on troubleshooting.
            </p>
            <div className="mt-16 grid max-w-[850px] gap-0 border-t border-line sm:grid-cols-2">
                {Object.entries(skillGroups).map(([title, skills]) => (
                    <div className="border-b border-line py-6 sm:mr-8" key={title}>
                        <p className="font-mono text-xs uppercase tracking-[.12em] text-[#a8c58c] sm:text-sm">
                            {title}
                        </p>
                        <p className="mt-3 font-mono text-sm leading-7 text-text">
                            {skills.join(" · ")}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default Skills;
