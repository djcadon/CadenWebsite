function Contact() {
    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] px-5 py-24 sm:-mx-11 sm:px-11">
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted sm:text-sm">
                04 / contact
            </p>
            <h1 className="my-6 max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-normal leading-[.92] tracking-[-.08em] text-text">
                Open
                <br />
                <span className="text-accent-purple">channel.</span>
            </h1>
            <p className="mb-7 max-w-lg text-lg leading-relaxed text-text sm:text-xl">
                For opportunities, collaborations, or just to say hello.
            </p>
            <p className="mt-8 mb-5 max-w-lg text-xl sm:text-2xl leading-relaxed text-text">
                Caden O'Leary
                <br />
                <span className="font-mono text-lg text-muted">(937) 242-8875</span>
            </p>
            <a
                className="block w-fit border-b border-accent-purple pb-2 font-mono text-base text-accent-purple no-underline hover:text-text sm:text-lg"
                href="mailto:olearycb@mail.uc.edu"
            >
                olearycb@mail.uc.edu ↗
            </a>
                        <a
                className="mt-10 block w-fit border border-accent-purple px-4 py-2 font-mono text-xs uppercase tracking-[.1em] text-accent-purple no-underline transition-colors hover:bg-accent-purple hover:text-[#101010] sm:text-sm"
                href="/contact.vcf"
                download="Caden_OLeary.vcf"
            >
                Save Contact ↓
            </a>
            <div className="mt-10 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-[.1em]">
                <a
                    className="text-accent-purple no-underline hover:text-text"
                    href="https://www.linkedin.com/in/cadenoleary/"
                    target="_blank"
                    rel="noreferrer"
                >
                    LinkedIn ↗
                </a>
                <a
                    className="text-accent-purple no-underline hover:text-text"
                    href="https://github.com/djcadon"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub ↗
                </a>
                <a
                    className="text-accent-purple no-underline hover:text-text"
                    href="https://devpost.com/djcadon"
                    target="_blank"
                    rel="noreferrer"
                >
                    Devpost ↗
                </a>
            </div>
        </section>
    );
}

export default Contact;
