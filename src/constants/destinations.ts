export const destinations = [
    // distance controls orbit radius, size controls planet scale, and speed
    // controls angular movement in the orbital scene.
    {
        id: "about",
        label: "About",
        description: "The person behind the work.",
        color: 0xd7b98e,
        distance: 4.2,
        size: 0.35,
        speed: 0.04,
    },
    {
        id: "work",
        label: "Work",
        description: "Professional work and engineering projects.",
        color: 0x93b8d8,
        distance: 6.1,
        size: 0.75,
        speed: 0.03,
    },
    {
        id: "skills",
        label: "Skills",
        description: "The tools I use to build useful things.",
        color: 0xa8c58c,
        distance: 8.1,
        size: 0.5,
        speed: 0.02,
    },
    {
        id: "contact",
        label: "Contact",
        description: "An open channel for new conversations.",
        color: 0xc7a0d2,
        distance: 10.1,
        size: 0.4,
        speed: 0.01,
    },
] as const;

export type DestinationId = (typeof destinations)[number]["id"];
