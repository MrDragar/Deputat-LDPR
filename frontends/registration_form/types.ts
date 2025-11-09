
export interface OtherLink {
    url: string;
}

export interface Education {
    level: string;
    organization: string;
    specialty?: string;
    hasPostgraduate: string; // 'Да' | 'Нет'
    postgraduateType?: string;
    postgraduateOrganization?: string;
    hasDegree: string; // 'Да' | 'Нет'
    degreeType?: string;
    hasTitle: string; // 'Да' | 'Нет'
    titleType?: string;
}

export interface WorkExperience {
    organization: string;
    position: string;
    startDate: string;
}

export interface SocialOrganization {
    name: string;
    position: string;
    years: string;
}

export interface Language {
    name: string;
    level: string;
}

export interface FormData {
    // Telegram ID
    telegramId: string;

    // Personal Info
    firstName: string;
    lastName: string;
    middleName: string;
    gender: string;
    birthDate: string;
    region: string;
    occupation: string;
    
    // Contact Info
    phone: string;
    email: string;
    vkPage: string;
    vkGroup: string;
    telegramChannel: string;
    personalSite: string;
    otherLinks: OtherLink[];

    // Education & Languages
    education: Education[];
    foreignLanguages: Language[];
    russianFederationLanguages: Language[];
    
    // Work & Family
    workExperience: WorkExperience[];
    maritalStatus: string;
    childrenCount: string;
    underageChildrenCount: string;
    childrenMaleCount: string;
    childrenFemaleCount: string;
    underageChildrenMaleCount: string;
    underageChildrenFemaleCount: string;


    // Political Activity
    partyExperience: string;
    partyPosition: string;
    partyRole: string;
    partyRoleOther: string;
    representativeBodyName: string;
    representativeBodyLevel: string;
    representativeBodyPosition: string;
    committeeName: string;
    committeeStatus: string;
    socialOrganizations: SocialOrganization[];

    // Professional Activity
    professionalSphere: string[];
    awards: string;

    // Hobbies & Interests
    sports: string[];
    sportsCustom: string[];
    recreation: string[];
    recreationCustom: string[];
    hobbies: string[];
    hobbiesCustom: string[];

    // Party Work
    ldprResources: string[];
    ldprResourcesCustom: string[];
    centralOfficeAssistant: string;
    knowledgeGaps: string[];
    knowledgeGapsCustom: string[];

    // Additional Info
    additionalInfo: string;
    suggestions: string;
    talents: string;
    knowledgeToShare: string;
    superpower: string;
}