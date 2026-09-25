function Contact() {
    return (
        <section className="relative -mx-5 min-h-[calc(100vh-230px)] glow-about px-5 py-24 sm:-mx-11 sm:px-11">
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
            <a
                className="mt-5 block w-fit border-b border-accent-purple pb-2 font-mono text-base text-accent-purple no-underline hover:text-text sm:text-lg"
                href="mailto:olearycb@mail.uc.edu"
            >
                olearycb@mail.uc.edu ↗
            </a>
            <p className="mt-8 max-w-lg font-mono text-xs leading-6 text-muted">
                Caden O'Leary
                <br />
                (937) 242-8875
            </p>
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
            </div>
        </section>
    );
}

export default Contact;
