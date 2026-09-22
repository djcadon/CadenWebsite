export const destinations = [
    {
        id: "about",
        label: "About",
        description: "The person behind the work.",
        color: 0xd7b98e,
        distance: 4.2,
        size: 0.28,
        speed: 0.028,
    },
    {
        id: "work",
        label: "Work",
        description: "A selection of things I have made.",
        color: 0x93b8d8,
        distance: 6.1,
        size: 0.38,
        speed: 0.021,
    },
    {
        id: "skills",
        label: "Skills",
        description: "The tools I use to build useful things.",
        color: 0xa8c58c,
        distance: 8.1,
        size: 0.32,
        speed: 0.015,
    },
    {
        id: "contact",
        label: "Contact",
        description: "An open channel for new conversations.",
        color: 0xc7a0d2,
        distance: 10.1,
        size: 0.24,
        speed: 0.01,
    },
] as const;

export type DestinationId = (typeof destinations)[number]["id"];
