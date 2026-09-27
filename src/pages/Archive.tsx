import { sortedExperiences } from "../constants/experiences";

function Archive() {
    const archivedExperiences = sortedExperiences.filter((experience) =>
        experience.roles.some((role) => role.archive),
    );

    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] px-5 py-24 sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                02 / archive
            </p>
            <h1 className="my-6 max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
                The rest of
                <br />
                <span className="text-accent-blue">the orbit.</span>
            </h1>
            <p className="mb-7 max-w-2xl text-lg leading-relaxed text-text sm:text-xl">
                Earlier work, projects, and leadership experience from across my technical path.
            </p>
            <div className="mt-16 max-w-6xl border-t border-line">
                {archivedExperiences.map((experience, index) => (
                    <article
                        className="grid gap-5 border-b border-line py-7 sm:grid-cols-2 sm:gap-8"
                        key={experience.company}
                    >
                        <div className="flex gap-5 sm:gap-8">
                            <span className="w-16 shrink-0 font-mono text-xs text-muted sm:text-sm">
                                0{index + 1}
                            </span>
                            <div>
                                <h2 className="m-0 text-lg font-normal sm:text-xl">
                                    {experience.company}
                                </h2>
                                <p className="mt-2 font-mono text-xs uppercase tracking-[.08em] text-muted sm:text-sm">
                                    {experience.location}
                                </p>
                                {experience.roles
                                    .filter((role) => role.archive)
                                    .map((role) => (
                                        <div className="mt-5" key={role.title + role.period.label}>
                                            <p className="font-mono text-xs text-accent-blue sm:text-sm">
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
                                                            className="text-accent-blue no-underline transition-colors hover:text-text"
                                                        >
                                                            View Code →
                                                        </a>
                                                    )}
                                                    {role.liveUrl && (
                                                        <a
                                                            href={role.liveUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-accent-blue no-underline transition-colors hover:text-text"
                                                        >
                                                            Live Demo →
                                                        </a>
                                                    )}
                                                    {role.devpostUrl && (
                                                        <a
                                                            href={role.devpostUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-accent-blue no-underline transition-colors hover:text-text"
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
                            <p className="mb-3 font-mono text-xs uppercase tracking-[.1em] text-accent-blue sm:text-sm">
                                Tools used
                            </p>
                            <ul className="flex flex-wrap gap-2 p-0 font-mono text-xs text-muted sm:text-sm">
                                {[
                                    ...new Set(
                                        experience.roles
                                            .filter((role) => role.archive)
                                            .flatMap((role) => role.tools),
                                    ),
                                ]
                                    .sort((first, second) => first.localeCompare(second))
                                    .map((tool) => (
                                        <li className="border border-line px-2 py-1" key={tool}>
                                            {tool}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Archive;
