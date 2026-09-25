import type { Experience } from "./types";

export const hackathons: Experience[] = [
    {
        company: "MakeUC",
        location: "University of Cincinnati",
        sortDate: "2025-11-01",
        roles: [
            {
                archive: true,
                title: "Kinetic Vision Challenge",
                period: {
                    start: "2025-11-08",
                    end: "2025-11-09",
                    label: "November 8 2025",
                },
                tools: ["Python", "React", "Vite", "FastAPI", "Tailwind CSS", "shadcn/ui"],
                description: [
                    "Formulated a household IoT dashboard to aggregate and visualize real-time telemetry from external REST APIs using React, Vite, and a FastAPI proxy server.",
                    "Engineered asynchronous backend routes using aiohttp to securely fetch, filter, and paginate high-frequency sensor and actuator data.",
                    "Created a centralized, responsive UI with shadcn/ui and Tailwind CSS to render live data streams for seamless smart-home monitoring.",
                ],
            },
            {
                archive: true,
                title: "GCS / Geometric Code Slicer",
                period: {
                    start: "2024-11-9",
                    end: "2024-11-10",
                    label: "MakeUC 9 2024",
                },
                tools: ["Python", "Flask", "Matplotlib", "JavaScript", "Tailwind CSS", "G-code"],
                description: [
                    "Engineered a Python and Flask backend to parse complex G-code instructions, mapping extrusion toolpaths into 3D coordinates.",
                    "Programmed custom geometric algorithms to generate raw .obj mesh data and face connections directly from sequential movements.",
                    "Automated the generation of .gif animated previews using Matplotlib and imageio, visualizing layer-by-layer print progression with dynamic color gradients.",
                    "Developed a responsive drag-and-drop web interface with Tailwind CSS for seamless file uploading and real-time conversion feedback.",
                ],
            },
        ],
    },
    {
        company: "Revolution UC",
        location: "University of Cincinnati",
        sortDate: "2026-03-29",
        roles: [
            {
                archive: true,
                title: "Power Tracing Simulator",
                period: {
                    start: "2026-03-29",
                    end: "2026-03-29",
                    label: "March 29, 2026",
                },
                tools: ["Next.js", "React", "ESP32", "C++", "JavaScript"],
                description: [
                    "Constructed an interactive circuit simulation frontend in Next.js and React to visualize dynamic electrical power flow across various consumer components.",
                    "Orchestrated live hardware-in-the-loop integration, streaming real-time current measurements from an ESP32 microcontroller over WiFi to a Next.js REST API.",
                    "Programmed robust state management and dynamic power-calculation utilities to instantly evaluate voltage drops, total wattage, and amp load based on physical telemetry.",
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
                tools: ["FastAPI", "Python", "Supabase", "FAISS", "Ollama", "React"],
                description: [
                    "Devised a local Retrieval-Augmented Generation (RAG) API to intelligently query complex NASA bioscience publications, backed by Supabase Postgres.",
                    "Synthesized unstructured HTML and PDF data by splitting text into overlapping chunks and generating embeddings using sentence-transformers.",
                    "Structured a FAISS vector index for cosine-similarity retrieval, seamlessly integrated with a local llama3.1-8b model via Ollama.",
                    "Exposed modular RESTful endpoints with auto-generated Swagger UI docs through FastAPI for QA retrieval and index reloading, seamlessly connected to a React frontend.",
                ],
            },
        ],
    },
];
