

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


// --- NEW Reporting System Types ---

export interface ReportPeriod {
  id: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  // Frontend-generated property
  name?: string; 
}

export type ReportTheme = 'infoudar' | 'vdpg' | 'event' | 'reg_event' | 'letter' | 'opt_event';

export interface Report {
  id: number;
  reportPeriod: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  name: string;
  theme: ReportTheme;
  themeDisplay: string;
}

export interface RegionReport {
  id: number;
  regionName: string;
  reportPeriod: number;
}

export type DeputyLevel = 'MCU' | 'ACR' | 'ZS';

export interface DeputyRecord {
  id: number;
  deputy: number;
  regionReport: number;
  fio: string;
  isAvailable: boolean;
  level: DeputyLevel;
  levelDisplay: string;
  reason: string | null;
}

export interface ReportRecord {
  id: number;
  report: number;
  deputyRecord: number;
  link: string | null; // Can be null for auto-generated empty records
}

// Composite types for view data
export interface AdminViewData {
  periods: ReportPeriod[];
  reports: Report[];
}

export interface CoordinatorViewData {
  period: ReportPeriod;
  reports: Report[];
  deputyRecords: DeputyRecord[];
  reportRecords: ReportRecord[];
}

export interface DeputyViewData {
  period: ReportPeriod;
  reports: Report[];
  deputyRecord: DeputyRecord | null;
  reportRecords: ReportRecord[];
}
