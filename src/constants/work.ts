import type { Experience } from "./types";

export const work: Experience[] = [
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
                tools: [
                    "Python",
                    "RAG",
                    "Ollama",
                    "Chainlit",
                    "OpenAI API",
                    "Gemini API",
                    "Docker",
                    "NVIDIA Jetson",
                    "Hugging Face",
                    "vLLM",
                    "Azure",
                    "LanceDB",
                    "PowerShell",
                ],
                description: [
                    "Pioneered a local Retrieval-Augmented Generation (RAG) AI assistant, ingesting over 50 hours of training video and thousands of manual pages.",
                    "Programmed natural-language prompt interpretation to autonomously generate press brake operational programs.",
                    "Crafted a conversational web interface using Chainlit to bridge operator interactions with local LLMs.",
                    "Dockerized the complete AI pipeline, establishing a scalable deployment architecture for cloud and on-premise edge devices.",
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
                tools: [
                    "React",
                    "Vite",
                    "FastAPI",
                    "JavaScript",
                    "TypesScript",
                    "Python",
                    "Raspberry Pi",
                    "Press Brake",
                    "Laser CNC",
                    "OPC UA",
                    ".NET",
                    "Bash",
                ],
                description: [
                    "Built a scalable, live machine-data dashboard with React, Vite, and FastAPI capable of integrating every machine across client fleets via the company API.",
                    "Configured bidirectional OPC UA tags to press brake machines to enable real-time telemetry and state control.",
                    "Designed a 2D and 3D shop floor visualizer using Three.js to provide spatial context for live machine diagnostics.",
                    "Implemented secure Single Sign-On (SSO) authentication flows leveraging physical PC/CS card readers.",
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
                tools: ["Raspberry Pi", "SQL", "Python", "Flask", "OPC UA", "Kepware", "MQTT", "Injection Molding", "Bash"],
                description: [
                    "Deployed a Raspberry Pi data-acquisition system to extract real-time telemetry via OPC UA from a fleet of 40 Sumitomo, Toyo, and Niigata injection molding machines.",
                    "Centralized shop-floor data aggregation using Python and Flask, phasing out legacy manual reporting processes.",
                    "Established a robust data pipeline that was successfully adopted for integration into the company's incoming ERP system.",
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
                    "Developed an automated database for electrical feeder schedules utilizing Excel Power Query and VBA.",
                    "Streamlined engineering workflows by eliminating manual data entry, significantly reducing scheduling inconsistencies and human error.",
                ],
            },
        ],
    },
];
