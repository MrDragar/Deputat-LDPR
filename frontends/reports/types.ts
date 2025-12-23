
export interface SessionsAttended {
    total: string;
    attended: string;
    committee_total: string;
    committee_attended: string;
    ldpr_total: string;
    ldpr_attended: string;
}

export interface GeneralInfo {
    full_name: string;
    district: string;
    region: string;
    representative_level: string; // Added new field
    authority_name: string;
    term_start: string;
    term_end: string;
    links: string[]; // Simple array of strings
    position: string;
    ldpr_position: string;
    committees: string[]; // Simple array of strings
    sessions_attended: SessionsAttended;
}

export interface LegislationItem {
    title: string;
    summary: string;
    status: string;
    rejection_reason?: string;
    links: string[];
}

export interface CitizenRequestsStats {
    utilities: string;
    pensions_and_social_payments: string;
    improvement: string;
    education: string;
    svo: string;
    public_transport: string;
    ecology: string;
    road_maintenance: string;
    illegal_dumps: string;
    appeals_to_ldpr_chairman: string;
    legal_aid_requests: string;
    legislative_proposals: string;
    stray_animal_issues: string;
    integrated_territory_development: string;
    medicine_and_healthcare: string;
}

export interface CitizenExample {
    text: string;
    links: string[];
}

export interface CitizenReceptions {
    aug_22_23: number;
    aug_29_30: number;
    sep_5_8: number;
    sep_19_20: number;
    oct_17_18: number;
    nov_14_15: number;
    dec_5_6: number;
}

export interface CitizenRequests {
    personal_meetings: string;
    responses: string;
    official_queries: string;
    requests: CitizenRequestsStats;
    citizen_day_receptions: CitizenReceptions;
    examples: CitizenExample[];
}

export interface SvoProject {
    text: string;
    links: string[];
}

export interface SvoSupport {
    projects: SvoProject[];
}

export interface ProjectActivityItem {
    name: string;
    result: string;
}

export interface LdprOrderItem {
    instruction: string;
    action: string;
}

export interface FormData {
    general_info: GeneralInfo;
    legislation: LegislationItem[];
    citizen_requests: CitizenRequests;
    svo_support: SvoSupport;
    project_activity: ProjectActivityItem[];
    ldpr_orders: LdprOrderItem[];
    other_info: string;
}