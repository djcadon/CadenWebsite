import { work } from "./work";
import { organizations } from "./organizations";
import { hackathons } from "./hackathons";
import type { Experience, ExperienceRole } from "./types";

export type { Experience, ExperienceRole };

export const experiences: Experience[] = [...work, ...organizations, ...hackathons];

export const sortedExperiences = [...experiences].sort(
    (first, second) => new Date(second.sortDate).getTime() - new Date(first.sortDate).getTime(),
);
