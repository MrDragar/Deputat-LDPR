
export interface OtherLink {
  id: number;
  url: string;
}

export interface Education {
  id: number;
  level: string;
  organization: string;
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
  representativeBodyName: string;
  representativeBodyLevel: string;
  representativeBodyPosition: string;
  committeeName: string;
  committeeStatus: string;
  professionalSphere: string[];
  awards: string;
  sports: string[];
  recreation: string[];
  hobbies: string[];
  ldprResources: string[];
  centralOfficeAssistant: string;
  knowledgeGaps: string[];
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
