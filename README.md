# Caden in Orbit

Personal portfolio for Caden O'Leary, built as an interactive 3D solar system.  

This repository contains the source code for my personal website. Rather than being a template for others to use, this codebase serves as a practical demonstration of my frontend development skills, 3D graphics integration, and user interface design.

## Technical Overview

The project is built on a modern React stack, emphasizing performance and smooth user experiences:

- **Core Framework**: React with Vite for fast HMR and optimized production builds.
- **3D Graphics**: Custom WebGL orchestration using `Three.js` (no heavy wrapper libraries like `react-three-fiber`). The home page renders a central sun, orbiting planets, randomized star fields, and cubic easing camera transitions into each section.
- **Animations**: `framer-motion` handles physics-based layout transitions (cross-fades and slide-ins) when navigating between pages and expanding skill categories.
- **Routing**: Lightweight hash-based routing to keep the orbital navigation state shareable and fully compatible with static hosting environments.
- **Styling**: Tailwind CSS for responsive, utility-first design without external component libraries.

## Sections

- **Home** — Interactive orbital navigation.
- **About** — Education, background, and leadership experience.
- **Work** — Recent professional experiences and engineering projects.
- **Archive** — Older projects, work experience, and leadership contributions.
- **Skills** — Programming languages, software, data systems, operating systems, and technical support.
- **Contact** — Email, phone, LinkedIn, and GitHub.
