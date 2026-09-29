import { motion } from "framer-motion";
import { sortedExperiences } from "../constants/experiences";

interface SkillWorkLayoutProps {
    skill: string;
    onBack: () => void;
}

const matchSkill = (skillName: string, tools: string[]) => {
    const s = skillName.toLowerCase();
    return tools.some((tool) => {
        const t = tool.toLowerCase();
        if (s === t) return true;
        // Word boundary match for exact tool name within the formatted skill name
        // (e.g. matching "React" inside "React / Next.js")
        const toolRegex = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (toolRegex.test(s)) return true;
        
        // Manual aliases for heavily editorialized terms in the skills list
        // that map to specific tools in the experiences list
        if (s.includes('telemetry') && t.includes('sensor')) return true;
        if (s.includes('laser') && t.includes('laser')) return true;
        if (s.includes('hmi') && t.includes('hmi')) return true;
        if (s.includes('malware') && t.includes('malware')) return true;
        if (s.includes('llm') && (t.includes('openai') || t.includes('gemini') || t === 'ai')) return true;
        if (s.includes('radio') && (t.includes('radio') || t.includes('sdr'))) return true;
        return false;
    });
};

function SkillWorkLayout({ skill, onBack }: SkillWorkLayoutProps) {
    // Filter experiences that have at least one role matching the skill
    const filteredExperiences = sortedExperiences
        .map((exp) => {
            const matchingRoles = exp.roles.filter((role) => matchSkill(skill, role.tools));
            return { ...exp, roles: matchingRoles };
        })
        .filter((exp) => exp.roles.length > 0);

    return (
        <div>
            <button
                className="mb-8 cursor-pointer border-0 bg-transparent p-0 font-mono text-xs uppercase text-muted hover:text-accent-green sm:text-sm"
                type="button"
                onClick={onBack}
            >
                ← back to skills
            </button>
            <h2 className="mb-4 text-2xl font-normal sm:text-3xl text-text">
                Experiences using <span className="text-accent-green">{skill}</span>
            </h2>
            {filteredExperiences.length === 0 ? (
                <p className="mt-8 font-mono text-sm text-muted">
                    No specific experiences listed for this skill yet.
                </p>
            ) : (
                <div className="mt-8 max-w-6xl border-t border-line">
                    {filteredExperiences.map((experience, index) => (
                        <motion.article
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="grid gap-5 border-b border-line py-7 sm:grid-cols-2 sm:gap-8"
                            key={experience.company}
                        >
                            <div className="flex gap-5 sm:gap-8">
                                <span className="w-16 shrink-0 font-mono text-xs text-muted sm:text-sm">
                                    0{index + 1}
                                </span>
                                <div>
                                    <h3 className="m-0 text-lg font-normal sm:text-xl">
                                        {experience.company}
                                    </h3>
                                    <p className="mt-2 font-mono text-xs uppercase tracking-[.08em] text-muted sm:text-sm">
                                        {experience.location}
                                    </p>
                                    {experience.roles.map((role) => (
                                        <div className="mt-5" key={role.title + role.period.label}>
                                            <p className="font-mono text-xs text-accent-green sm:text-sm">
                                                {role.title}
                                            </p>
                                            <p className="mt-1 font-mono text-xs uppercase tracking-[.08em] text-muted sm:text-sm">
                                                {role.period.label}
                                            </p>
                                            {role.awards && role.awards.length > 0 && (
                                                <div className="mt-3 flex flex-col gap-1">
                                                    {role.awards.map((award) => (
                                                        <span
                                                            key={award}
                                                            className="font-mono text-xs font-medium text-[#fbbf24] sm:text-sm"
                                                        >
                                                            [WINNER] {award}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-muted">
                                                {role.description.map((point) => (
                                                    <li key={point}>{point}</li>
                                                ))}
                                            </ul>
                                            {(role.repoUrl || role.liveUrl) && (
                                                <div className="mt-4 flex gap-4 font-mono text-xs uppercase tracking-[.08em]">
                                                    {role.repoUrl && (
                                                        <a
                                                            href={role.repoUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-accent-green no-underline transition-colors hover:text-text"
                                                        >
                                                            View Code →
                                                        </a>
                                                    )}
                                                    {role.liveUrl && (
                                                        <a
                                                            href={role.liveUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-accent-green no-underline transition-colors hover:text-text"
                                                        >
                                                            Live Demo →
                                                        </a>
                                                    )}
                                                    {role.devpostUrl && (
                                                        <a
                                                            href={role.devpostUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-accent-green no-underline transition-colors hover:text-text"
                                                        >
                                                            View Devpost →
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="mb-3 font-mono text-xs uppercase tracking-[.1em] text-accent-green sm:text-sm">
                                    Tools used
                                </p>
                                <ul className="flex flex-wrap gap-2 p-0 font-mono text-xs text-muted sm:text-sm">
                                    {[...new Set(experience.roles.flatMap((role) => role.tools))]
                                        .sort((first, second) => first.localeCompare(second))
                                        .map((tool) => (
                                            <li
                                                className={`border px-2 py-1 ${
                                                    matchSkill(skill, [tool])
                                                        ? "border-accent-green text-accent-green"
                                                        : "border-line"
                                                }`}
                                                key={tool}
                                            >
                                                {tool}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </motion.article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SkillWorkLayout;
