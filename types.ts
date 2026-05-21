export enum RequestType {
  NEW = "Alta",
  MODIFY = "Modificación",
  CANCEL = "Cancelación",
}

export enum RequestFormat {
  MANUAL = "Manual",
  SCR = "SCR (IATA)",
}

export enum RequestStatus {
  PENDING = "Pendiente",
  APPROVED = "Aprobado",
  REJECTED = "Rechazado",
  DRAFT = "Borrador",
  SUBMITTED = "Enviado",
}

export const AIRLINE_ALLOWED_LETTERS = [
  "N",
  "C",
  "R",
  "D",
  "K",
  "X",
  "O",
] as const;
export const ADMIN_ALLOWED_LETTERS = [
  "A",
  "B",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "L",
  "M",
  "P",
  "Q",
  "S",
  "T",
  "U",
  "V",
  "W",
  "Y",
  "Z",
] as const;

export interface Airline {
  id: string;
  name: string;
  iataCode: string;
  logoUrl: string;
  primaryColor: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  airlineId: string;
  role: "admin" | "user";
}

export interface NotificationEmailProfile {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  message: string;
}

export interface NotificationSettings {
  submissionDefaults: NotificationEmailProfile;
  adminResponseDefaults: NotificationEmailProfile;
}

// Detailed structure for the Manual Form Row (Excel replication)
export interface ManualRow {
  id: string;
  movementType: "N" | "C" | "R" | "D" | "K" | "X" | "O" | "";
  airlineCode: string;
  flightArr: string;
  flightDep: string;
  equipment: string;
  timeArr: string;
  timeDep: string;
  origin: string;
  destination: string;
  frequency: string;
  validityFrom: string;
  validityTo: string;
  typeArr: string;
  typeDep: string;
  slotNumber: string;
  observations: string;
  groupId?: string;
}

// Header data for the Manual Form
export interface ManualHeader {
  representative: string;
  officePhone: string;
  cellPhone: string;
  date: string;
  page: string;
  revision: string;
  controlNumber: string;
}

// Footer data for the Manual Form (Signatures)
export interface ManualFooter {
  adminName: string;
  adminDate: string;
  afacName: string;
  afacDate: string;
}

export interface SlotRequest {
  id: string;
  registrationNumber?: string;
  batchId?: string;
  airlineId: string;
  requestType: RequestType;
  requestFormat: RequestFormat;
  isUtc?: boolean;

  // Dashboard summary fields
  flightArr?: string;
  flightDep?: string;
  origin?: string;
  destination?: string;
  timeArr?: string;
  timeDep?: string;
  frequency?: string;
  validityFrom?: string;
  validityTo?: string;
  slotNumber?: string;

  // content storage
  scrContent?: string;
  manualData?: {
    header: ManualHeader;
    footer?: ManualFooter;
    rows: ManualRow[];
  };

  status: RequestStatus;
  createdAt: string;
  airlineLetter?: string;
  adminLetter?: string;
}

export interface ScheduledFlight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  actualTime: string;
  status: "On Time" | "Delayed" | "Landed" | "Boarding";
}

export interface AuthState {
  user: User | null;
  airline: Airline | null;
  isLoading: boolean;
  error: string | null;
}

export type ViewType =
  | "status"
  | "new-request"
  | "history"
  | "scheduled"
  | "stats"
  | "settings";
