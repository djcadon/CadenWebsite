import { useState } from "react";
import SkillWorkLayout from "../components/SkillWorkLayout";

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
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] px-5 py-24 sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                03 / capabilities
            </p>
            {selectedSkill ? (
                <div className="mt-6">
                    <SkillWorkLayout skill={selectedSkill} onBack={() => setSelectedSkill(null)} />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
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
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[...skills].sort((a, b) => a.localeCompare(b)).map((skill) => (
                                        <button
                                            key={skill}
                                            onClick={() => setSelectedSkill(skill)}
                                            className="cursor-pointer border border-line bg-transparent px-3 py-1 font-mono text-xs text-text transition-colors hover:border-accent-green hover:text-accent-green sm:text-sm"
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default Skills;
