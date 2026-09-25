const skillGroups: Record<string, string[]> = {
    Languages: ["Python", "C++", "C#", "C", "JavaScript", "TypeScript", "Bash / PowerShell"],
    "Frameworks & Libraries": ["React", "Next.js", "FastAPI", "Flask", ".NET", "Tailwind CSS", "Vite"],
    "Databases & Data Engineering": ["SQL", "PostgreSQL", "SQLite", "Supabase", "LanceDB", "Power Query", "Excel / VBA"],
    "DevOps & Core Tools": ["Docker", "Linux", "Microsoft Azure", "Git", "Vercel", "Oracle VirtualBox"],
    "AI & ML": ["RAG", "vLLM", "Ollama", "FAISS", "Chainlit", "LLM APIs (OpenAI, Gemini)", "Hugging Face"],
    Cybersecurity: [
        "Network Defense",
        "Incident Response",
        "Static & Dynamic Malware Analysis",
        "Wireshark",
        "Nmap"
    ],
    "Embedded Hardware": [
        "STM32 & ESP32",
        "Arduino",
        "Raspberry Pi",
        "NVIDIA Jetson",
        "IoT Telemetry",
        "I2C / SPI Peripherals",
    ],
    "Manufacturing & Automation": [
        "CNC Machining",
        "Press Brakes",
        "HMI / PLC Programming",
        "OPC UA",
        "Kepware",
        "MQTT",
        "Injection Molding",
        "Laser Fabrication",
    ],
    "Space Systems": [
        "Ground Station Architecture",
        "High-Altitude Balloons",
        "Software-Defined Radio (SDR)",
        "RF / Yagi Antennas",
        "GNSS / GPS Tracking",
    ],
};

function Skills() {
    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] glow-skills px-5 py-24 sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                03 / capabilities
            </p>
            <h1 className="my-6 max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
                Tools are only
                <br />
                <span className="text-accent-green">the beginning.</span>
            </h1>
            <p className="mb-7 max-w-2xl text-lg leading-relaxed text-text sm:text-xl">
                A practical technical foundation built through software development, data systems,
                operating systems, and hands-on troubleshooting.
            </p>
            <div className="mt-16 grid max-w-4xl gap-0 border-t border-line sm:grid-cols-2">
                {Object.entries(skillGroups).map(([title, skills]) => (
                    <div className="border-b border-line py-6 sm:mr-8" key={title}>
                        <p className="font-mono text-xs uppercase tracking-[.12em] text-accent-green sm:text-sm">
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
