export interface FormData {
    telegramId: string;
    firstName: string;
    lastName: string;
    middleName: string;
    gender: string;
    birthDate: string;
    region: string;
    occupation: string;
    phone: string;
    email: string;
    vkPage: string;
    vkGroup: string;
    telegramChannel: string;
    personalSite: string;
    otherLinks: string[];
    education: any[];
    foreignLanguages: any[];
    russianFederationLanguages: any[];
    workExperience: any[];
    maritalStatus: string;
    childrenCount: string;
    underageChildrenCount: string;
    childrenMaleCount: string;
    childrenFemaleCount: string;
    underageChildrenMaleCount: string;
    underageChildrenFemaleCount: string;
    partyExperience: string | number;
    partyPosition: string;
    partyRole: string;
    partyRoleOther: string;
    representativeBodyName: string;
    representativeBodyLevel: string;
    representativeBodyPosition: string;
    committeeName: string;
    committeeStatus: string;
    socialOrganizations: any[];
    professionalSphere: string[];
    awards: string;
    sports: string[];
    sportsCustom: string[];
    recreation: string[];
    recreationCustom: string[];
    hobbies: string[];
    hobbiesCustom: string[];
    ldprResources: string[];
    ldprResourcesCustom: string[];
    centralOfficeAssistant: string;
    knowledgeGaps: string[];
    knowledgeGapsCustom: string[];
    additionalInfo: string;
    suggestions: string;
    talents: string;
    knowledgeToShare: string;
    superpower: string;
}

export interface RegistrationForm extends FormData {
    id: number;
    status: string;
}

export interface User {
    id: number;
    [key: string]: any;
}

export interface ReportPeriod {}
export interface Report {}
export interface RegionReport {}
export interface DeputyRecord {}
export interface ReportRecord {}
export interface AdminViewData {}
export interface CoordinatorViewData {}
export interface DeputyViewData {}
