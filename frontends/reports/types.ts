
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

// types/index.ts (микрофронтенда)
export interface OtherLink {
  id: number;
  url: string;
}

export interface Education {
  id: number;
  level: string;
  organization: string;
  specialty?: string;
  hasPostgraduate: string;
  postgraduateType: string;
  postgraduateOrganization: string;
  hasDegree: string;
  degreeType: string;
  hasTitle: string;
  titleType: string;
}

export interface WorkExperience {
  id: number;
  organization: string;
  position: string;
  startDate: string;
}

export interface ForeignLanguage {
  id: number;
  name: string;
  level: string;
}

export interface RussianFederationLanguage {
  id: number;
  name: string;
  level: string;
}

export interface SocialOrganization {
  id: number;
  name: string;
  position: string;
  years: string;
}

export interface RegistrationForm {
  user?: number;
  birthDate: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: string;
  region: string;
  occupation: string;
  phone: string;
  email: string;
  vkPage: string;
  vkGroup: string;
  telegramChannel: string;
  personalSite: string;
  maritalStatus: string;
  childrenCount: number;
  childrenMaleCount: number;
  childrenFemaleCount: number;
  underageChildrenCount: number;
  underageChildrenMaleCount: number | null;
  underageChildrenFemaleCount: number | null;
  partyExperience: number;
  partyPosition: string;
  partyRole: string;
  partyRoleOther?: string;
  representativeBodyName: string;
  representativeBodyLevel: string;
  representativeBodyPosition: string;
  committeeName: string;
  committeeStatus: string;
  professionalSphere: string[];
  awards: string;
  sports: string[];
  sportsCustom?: string[];
  recreation: string[];
  recreationCustom?: string[];
  hobbies: string[];
  hobbiesCustom?: string[];
  ldprResources: string[];
  ldprResourcesCustom?: string[];
  centralOfficeAssistant: string;
  knowledgeGaps: string[];
  knowledgeGapsCustom?: string[];
  additionalInfo: string;
  suggestions: string;
  talents: string;
  knowledgeToShare: string;
  superpower: string;
  createdAt: string;
  updatedAt: string;
  otherLinks?: OtherLink[];
  education?: Education[];
  workExperience?: WorkExperience[];
  foreignLanguages?: ForeignLanguage[];
  russianFederationLanguages?: RussianFederationLanguage[];
  socialOrganizations?: SocialOrganization[];
}

export interface User {
  userId: number;
  login: string;
  isActive: boolean;
  role: string;
  dateJoined: string;
  lastLogin: string | null;
  deputyForm: RegistrationForm | null;
}

// Расширяем глобальный Window интерфейс
declare global {
  interface Window {
    __REMOTE_DATA__?: {
      userData?: User | null;
    };
  }
}