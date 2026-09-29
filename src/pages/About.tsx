function About() {
    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] px-5 pt-12 pb-24 sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                01 / about
            </p>
            <h1 className="my-6 max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
                The person
                <br />
                <span className="text-accent-tan">behind the work.</span>
            </h1>
            <p className="mb-7 max-w-2xl text-lg leading-relaxed text-text sm:text-xl">
                I'm Caden O'Leary, a Computer Science student at the University of Cincinnati
                focused on building practical software and solving technical problems.
            </p>
            <p className="max-w-2xl leading-7 text-muted">
                I'm pursuing a Bachelor of Science in Computer Science with a minor in Information
                Technology and a Cyber Operations certification. I bring experience across software
                development, data systems, technical support, and hardware and network
                troubleshooting.
            </p>
            <div className="mt-14 grid max-w-3xl gap-8 border-t border-line pt-8 sm:grid-cols-2">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[.12em] text-accent-tan sm:text-sm">
                        education
                    </p>
                    <p className="mt-3 text-text">University of Cincinnati</p>
                    <p className="text-sm text-muted">
                        B.S. Computer Science · Minor in IT
                        <br />
                        Expected May 2027 · GPA 3.74
                    </p>
                </div>
                <div>
                    <p className="font-mono text-xs uppercase tracking-[.12em] text-accent-tan sm:text-sm">
                        leadership
                    </p>
                    <p className="mt-3 text-text">UC CubeCats</p>
                    <p className="text-sm text-muted">
                        HabSat-1 Ground Station Team Lead
                        <br />
                        Aug 2023 — Present
                    </p>
                </div>
            </div>
        </section>
    );
}

export default About;
