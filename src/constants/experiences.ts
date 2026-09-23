export interface ExperienceRole {
    archive: boolean;
    title: string;
    period: {
        start: string;
        end: string | null;
        label: string;
    };
    tools: string[];
    description: string[];
}

export interface Experience {
    company: string;
    location: string;
    sortDate: string;
    roles: ExperienceRole[];
}

export const experiences: Experience[] = [
    {
        company: "Cincinnati Incorporated",
        location: "Harrison, Ohio",
        sortDate: "2026-05-01",
        roles: [
            {
                archive: false,
                title: "Software Engineering COOP",
                period: {
                    start: "2026-05-01",
                    end: "2026-08-01",
                    label: "May 2026 — Aug 2026",
                },
                tools: ["Python", "RAG", "AI", "Ollama", "Chainlit", "OpenAI API", "Gemini API"],
                description: [
                    "Developed a local RAG AI assistant using company manuals and videos.",
                    "Enabled natural-language generation of press brake programs for operators.",
                ],
            },
            {
                archive: false,
                title: "Software Engineering COOP",
                period: {
                    start: "2025-09-01",
                    end: "2025-12-01",
                    label: "Sep 2025 — Dec 2025",
                },
                tools: ["React", "Vite", "FastAPI", "Python"],
                description: [
                    "Implemented SSO with PC/CS card readers.",
                    "Built a live machine-data dashboard with React, Vite, and FastAPI.",
                ],
            },
        ],
    },
    {
        company: "UC CubeCats",
        location: "University of Cincinnati",
        sortDate: "2026-01-01",
        roles: [
            {
                archive: false,
                title: "HabSat-1 Ground Station Team Lead",
                period: {
                    start: "2026-01-01",
                    end: null,
                    label: "Jan 2026 — Present",
                },
                tools: ["Software-defined radio", "Yagi antenna", "SQL", "FastAPI"],
                description: [
                    "Lead the HabSat-1 ground station team at CAS in collaboration with UCARC.",
                    "Supported Yagi antenna and software-defined radio integration.",
                    "Developed backend infrastructure for mission-data storage.",
                ],
            },
            {
                archive: true,
                title: "LEOPARDSat-1 OBC Team",
                period: {
                    start: "2025-06-01",
                    end: "2025-12-01",
                    label: "June 2025 — Dec 2025",
                },
                tools: ["STM32"],
                description: [
                    "Supported the On-Board Computer team through quality assurance and software testing.",
                    "Contributed to hardware integration for a CubeSat mission.",
                    "Supported research on solar radiation effects on carbon-composite materials.",
                ],
            },
            {
                archive: true,
                title: "Calico HAB Software Team",
                period: {
                    start: "2024-08-01",
                    end: "2025-05-01",
                    label: "Aug 2024 — May 2025",
                },
                tools: ["C++", "GPS", "Sensors"],
                description: [
                    "Contributed to Project Calico, a high-altitude balloon mission.",
                    "Collected environmental data and transmitted live sensor readings.",
                    "Tracked the balloon with GPS location data from the stratosphere.",
                ],
            },
        ],
    },
    {
        company: "Innovative Plastic Molders",
        location: "Vandalia, Ohio",
        sortDate: "2024-05-01",
        roles: [
            {
                archive: false,
                title: "Software Developer Intern",
                period: {
                    start: "2024-05-01",
                    end: "2025-09-01",
                    label: "May 2024 — Sep 2025",
                },
                tools: ["Raspberry Pi", "SQL", "Python"],
                description: [
                    "Built Raspberry Pi-based retrieval for injection molding machine data.",
                    "Supported Sumitomo, Toyo, and Niigata machines.",
                    "Enabled centralized monitoring and analysis.",
                ],
            },
        ],
    },
    {
        company: "MakeUC",
        location: "University of Cincinnati",
        sortDate: "2025-11-01",
        roles: [
            {
                archive: true,
                title: "Kinetic Vision Challenge",
                period: {
                    start: "2025-11-01",
                    end: "2025-11-01",
                    label: "November 2025",
                },
                tools: ["Python", "React", "Vite", "FastAPI"],
                description: [
                    "Built a household IoT dashboard using an existing API.",
                    "Created a centralized interface for monitoring connected home data.",
                ],
            },
            {
                archive: true,
                title: "GCS / Geometric Code Slicer",
                period: {
                    start: "2024-01-01",
                    end: "2024-01-01",
                    label: "MakeUC 2024",
                },
                tools: ["Python", "Flask", "JavaScript", "Tailwind CSS", "G-code"],
                description: [
                    "Engineered a G-code parsing and conversion system.",
                    "Generated .obj 3D models and .gif animated previews.",
                ],
            },
        ],
    },
    {
        company: "NASA Space Apps Hackathon",
        location: "University of Cincinnati",
        sortDate: "2025-11-01",
        roles: [
            {
                archive: true,
                title: "BioRAG",
                period: {
                    start: "2025-11-01",
                    end: "2025-11-01",
                    label: "NASA Hackathon 2025",
                },
                tools: ["FastAPI", "Python", "Supabase", "FAISS", "LLaMA 2", "Ollama", "React"],
                description: [
                    "Built a retrieval-augmented generation API for NASA bioscience publications.",
                    "Ingested HTML and PDF publications, split them into overlapping chunks, and generated embeddings.",
                    "Created a FAISS vector index for cosine-similarity retrieval and connected it to a local LLM.",
                    "Exposed article browsing, retrieval, question answering, and index-reload endpoints through FastAPI.",
                ],
            },
        ],
    },
    {
        company: "The Superior Group",
        location: "Columbus, Ohio",
        sortDate: "2023-08-01",
        roles: [
            {
                archive: true,
                title: "Electrical Engineering Intern",
                period: {
                    start: "2023-08-01",
                    end: "2023-12-01",
                    label: "Aug 2023 — Dec 2023",
                },
                tools: ["Power Query", "Excel", "VBA"],
                description: [
                    "Established a Power Query database for feeder schedules.",
                    "Improved scheduling efficiency and reduced human error.",
                ],
            },
        ],
    },
];

export const sortedExperiences = [...experiences].sort(
    (first, second) => new Date(second.sortDate).getTime() - new Date(first.sortDate).getTime(),
);
