import type { Experience } from "./types";

export const organizations: Experience[] = [
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
                    "Directed the HabSat-1 ground station team at CAS, facilitating cross-functional collaboration with UCARC.",
                    "Synchronized Yagi antennas with software-defined radio (SDR) systems to establish reliable orbital communication links.",
                    "Architected scalable backend infrastructure using FastAPI and SQL for robust mission-data storage and retrieval.",
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
                    "Strengthened the On-Board Computer (OBC) firmware through rigorous quality assurance and software testing on STM32 microcontrollers.",
                    "Collaborated on hardware integration and systems engineering for an orbital CubeSat mission.",
                    "Assisted in aerospace materials research, analyzing the effects of solar radiation on carbon-composite structures.",
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
                    "Coded flight software in C++ for Project Calico, a high-altitude balloon mission deployed to the stratosphere.",
                    "Assembled telemetry systems to continuously collect, process, and transmit live atmospheric sensor readings.",
                    "Incorporated GPS tracking modules to monitor real-time flight paths and coordinate recovery operations.",
                ],
            },
        ],
    },
];
