import { sortedExperiences } from "../constants/experiences";

function Archive() {
  const archivedExperiences = sortedExperiences.filter((experience) =>
    experience.roles.some((role) => role.archive),
  );

  return (
    <section className="relative -mx-5 min-h-[calc(100vh-230px)] bg-[radial-gradient(circle_at_80%_30%,#1b3442,transparent_38rem)] px-5 py-[10vh] sm:-mx-11 sm:px-11">
      <p className="font-mono text-[11px] uppercase tracking-[.12em] text-muted">
        02 / archive
      </p>
      <h1 className="my-6 max-w-[800px] text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
        The rest of
        <br />
        <span className="text-[#93b8d8]">the orbit.</span>
      </h1>
      <p className="mb-7 max-w-[620px] text-[21px] leading-relaxed text-text">
        Earlier work, projects, and leadership experience from across my
        technical path.
      </p>
      <div className="mt-16 max-w-[1100px] border-t border-line">
        {archivedExperiences.map((experience, index) => (
          <article
            className="grid gap-5 border-b border-line py-7 sm:grid-cols-[60px_1fr_1fr] sm:gap-8"
            key={experience.company}
          >
            <span className="font-mono text-[11px] text-muted">
              0{index + 1}
            </span>
            <div>
              <h2 className="m-0 text-[22px] font-normal">
                {experience.company}
              </h2>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[.08em] text-muted">
                {experience.location}
              </p>
              {experience.roles.filter((role) => role.archive).map((role) => (
                <div className="mt-5" key={role.title + role.period.label}>
                  <p className="font-mono text-[11px] text-[#93b8d8]">
                    {role.title}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-muted">
                    {role.period.label}
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-muted">
                    {role.description.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[.1em] text-[#93b8d8]">
                Tools used
              </p>
              <ul className="flex flex-wrap gap-2 p-0 font-mono text-[10px] text-muted">
                {[...new Set(
                  experience.roles
                    .filter((role) => role.archive)
                    .flatMap((role) => role.tools),
                )]
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
