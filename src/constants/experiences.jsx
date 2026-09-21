export const experiences = [
  {
    company: "Cincinnati Incorporated",
    date: "2026-05-01",
    archive: false,
    roles: [
      {
        title: "Software Engineering COOP",
        meta: "May 2026 — Aug 2026",
        tools: [
          "Python",
          "RAG",
          "AI",
          "Ollama",
          "Chainlit",
          "OpenAI API",
          "Gemini API",
        ],
        description: [
          "Developed a local RAG AI assistant using company manuals and videos.",
          "Enabled natural-language generation of press brake programs for operators.",
        ],
      },
      {
        title: "Software Engineering COOP",
        meta: "Sep 2025 — Dec 2025",
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
    date: "2026-01-01",
    archive: false,
    roles: [
      {
        title: "HabSat-1 Ground Station Team Lead",
        meta: "Jan 2026 — Present",
        tools: ["Software-defined radio", "Yagi antenna", "SQL", "FastAPI"],
        description: [
          "Lead the HabSat-1 ground station team at CAS in collaboration with UCARC.",
          "Supported Yagi antenna and software-defined radio integration.",
          "Developed backend infrastructure for mission-data storage.",
        ],
      },
    ],
  },
  {
    company: "Innovative Plastic Molders",
    date: "2024-05-01",
    archive: false,
    roles: [
      {
        title: "Software Developer Intern",
        meta: "May 2024 — Sep 2025",
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
    company: "UC CubeCats",
    date: "2025-06-01",
    archive: true,
    roles: [
      {
        title: "LEOPARDSat-1 OBC Team",
        meta: "June 2025 — Dec 2025",
        tools: ["STM32"],
        description: [
          "Supported the On-Board Computer team through quality assurance and software testing.",
          "Contributed to hardware integration for a CubeSat mission.",
          "Supported research on solar radiation effects on carbon-composite materials.",
        ],
      },
    ],
  },
  {
    company: "MakeUC",
    date: "2025-11-01",
    archive: true,
    roles: [
      {
        title: "Kinetic Vision Challenge",
        meta: "November 2025",
        tools: ["Python", "React", "Vite", "FastAPI"],
        description: [
          "Built a household IoT dashboard using an existing API.",
          "Created a centralized interface for monitoring connected home data.",
        ],
      },
    ],
  },
  {
    company: "NASA Space Apps Hackathon",
    date: "2025-11-01",
    archive: true,
    roles: [
      {
        title: "BioRAG",
        meta: "2025 · Space Biology Knowledge Engine",
        tools: [
          "FastAPI",
          "Python",
          "Supabase",
          "FAISS",
          "Ollama",
          "React",
        ],
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
    company: "UC CubeCats",
    date: "2024-08-01",
    archive: true,
    roles: [
      {
        title: "Calico HAB Software Team",
        meta: "Aug 2024 — May 2025",
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
    company: "University of Cincinnati",
    date: "2024-01-01",
    archive: true,
    roles: [
      {
        title: "GCS / Geometric Code Slicer",
        meta: "Make UC 2024",
        tools: ["Python", "Flask", "JavaScript", "Tailwind CSS", "G-code"],
        description: [
          "Engineered a G-code parsing and conversion system.",
          "Generated .obj 3D models and .gif animated previews.",
        ],
      },
    ],
  },
  {
    company: "The Superior Group",
    date: "2023-08-01",
    archive: true,
    roles: [
      {
        title: "Electrical Engineering Intern",
        meta: "Aug 2023 — Dec 2023",
        tools: ["Power Query", "Excel", "VBA"],
        description: [
          "Established a Power Query database for feeder schedules.",
          "Improved scheduling efficiency and reduced human error.",
        ],
      },
    ],
  },
]

export const sortedExperiences = [...experiences].sort(
  (first, second) => new Date(second.date) - new Date(first.date),
)
