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
    // Used to keep the most recent experience at the top of Work and Archive.
    sortDate: string;
    roles: ExperienceRole[];
}
