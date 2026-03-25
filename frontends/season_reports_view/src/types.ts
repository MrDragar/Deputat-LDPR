export interface RegistrationForm {
  id: string;
  name: string;
}

export interface DeputyForm {
  lastName: string;
  firstName: string;
  middleName: string;
  region: string;
  gender: string;
  representativeBodyLevel: string;
  partyRole: string;
}

export interface User {
  userId: number;
  login: string;
  isActive: boolean;
  role: string;
  isAvailable: boolean;
  reasonUnavailable: string | null;
  dateJoined: string;
  lastLogin: string;
  deputyForm?: DeputyForm;
}

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface Report {
  id: number;
  user_id: number;
  report_link: string;
  created_at: string;
  data?: LDPRReport;
}

export interface RegionReport {}
export interface DeputyRecord {}
export interface ReportRecord {}
export interface AdminViewData {}
export interface CoordinatorViewData {}
export interface DeputyViewData {}

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
  term_start: string;
  term_end: string;
  links: string[];
  position: string;
  committees: string[];
  sessions_attended: SessionsAttended;
  region: string;
  authority_name: string;
  ldpr_position?: string;
}

export interface Legislation {
  title: string;
  summary: string;
  status: string;
  rejection_reason?: string;
  links?: string[];
}

export interface Requests {
  utilities: string;
  pensions_and_social_payments: string;
  improvement: string;
  education: string;
  svo: string;
  road_maintenance: string;
  ecology: string;
  medicine_and_healthcare: string;
  public_transport: string;
  illegal_dumps: string;
  appeals_to_ldpr_chairman: string;
  legal_aid_requests: string;
  integrated_territory_development: string;
  stray_animal_issues: string;
  legislative_proposals: string;
}

export interface Example {
  text: string;
  links?: string[];
}

export interface CitizenRequests {
  personal_meetings: string;
  requests: Requests;
  responses: string;
  official_queries: string;
  examples: Example[];
  citizen_day_receptions: Record<string, number>;
}

export interface SVOSupportProject {
  name?: string;
  links?: string[];
  text?: string;
}

export interface SVOSupport {
  projects: SVOSupportProject[];
}

export interface ProjectActivity {
  name: string;
  result: string;
}

export interface LDPROrders {
  instruction: string;
  action: string;
}

export interface LDPRReport {
  general_info: GeneralInfo;
  legislation: Legislation[];
  citizen_requests: CitizenRequests;
  svo_support: SVOSupport;
  project_activity: ProjectActivity[];
  ldpr_orders: LDPROrders[];
  other_info?: string;
}
