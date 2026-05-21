import {
  User,
  Airline,
  SlotRequest,
  RequestType,
  RequestFormat,
  RequestStatus,
} from "../types";

const STORAGE_KEY = "aifa_slot_requests_v1";

const localStorageAvailable = () =>
  typeof window !== "undefined" && window.localStorage;

const loadRequestsFromStorage = (): SlotRequest[] => {
  if (!localStorageAvailable()) return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SlotRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("No se pudo leer localStorage:", error);
    return [];
  }
};

const saveRequestsToStorage = (requests: SlotRequest[]) => {
  if (!localStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.warn("No se pudo escribir en localStorage:", error);
  }
};

// Mock Data
const MOCK_AIRLINES: Airline[] = [
  {
    id: "air_01",
    name: "Iberia",
    iataCode: "IB",
    logoUrl: "https://logo.clearbit.com/iberia.com",
    primaryColor: "red-600",
  },
  {
    id: "air_02",
    name: "Vueling",
    iataCode: "VY",
    logoUrl: "https://logo.clearbit.com/vueling.com",
    primaryColor: "yellow-500",
  },
  {
    id: "air_03",
    name: "Viva Aerobus",
    iataCode: "VB",
    logoUrl: "https://logo.clearbit.com/vivaaerobus.com",
    primaryColor: "green-600",
  },
  {
    id: "air_admin",
    name: "Administración AIFA",
    iataCode: "NLU",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_AIFA_Aeropuerto_Internacional_Felipe_%C3%81ngeles.svg/1200px-Logo_AIFA_Aeropuerto_Internacional_Felipe_%C3%81ngeles.svg.png",
    primaryColor: "slate-900",
  },
];

const MOCK_USERS: User[] = [
  {
    id: "usr_01",
    email: "juan@iberia.com",
    name: "Juan Pérez",
    airlineId: "air_01",
    role: "user",
  },
  {
    id: "usr_02",
    email: "maria@vueling.com",
    name: "Maria Garcia",
    airlineId: "air_02",
    role: "user",
  },
  {
    id: "usr_03",
    email: "pedro@viva.com",
    name: "Pedro Lopez",
    airlineId: "air_03",
    role: "user",
  },
  {
    id: "usr_admin",
    email: "admin@aifa.aero",
    name: "Control de Slots AIFA",
    airlineId: "air_admin",
    role: "admin",
  },
];

let MOCK_REQUESTS: SlotRequest[] = loadRequestsFromStorage();

if (MOCK_REQUESTS.length === 0) {
  MOCK_REQUESTS = [
    {
      id: "req_101",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      isUtc: true,
      flightArr: "IB6403",
      flightDep: "IB6404",
      origin: "MAD",
      destination: "MEX",
      timeArr: "18:00",
      timeDep: "20:30",
      frequency: "1234567",
      validityFrom: "2023-11-01",
      validityTo: "2024-03-30",
      slotNumber: "10239",
      manualData: {
        header: {
          representative: "JUAN PEREZ",
          officePhone: "5512345678",
          cellPhone: "5587654321",
          date: "23/12/2025",
          page: "1",
          revision: "0",
          controlNumber: "AIFA-2025-001",
        },
        rows: [
          {
            id: "row-1",
            movementType: "K",
            airlineCode: "IB",
            flightArr: "6403",
            flightDep: "6404",
            equipment: "A350",
            timeArr: "18:00",
            timeDep: "20:30",
            origin: "MAD",
            destination: "MEX",
            frequency: "1234567",
            validityFrom: "23/12/25",
            validityTo: "30/03/26",
            typeArr: "J",
            typeDep: "J",
            slotNumber: "10239",
            observations: "VUELO INAUGURAL",
          },
        ],
      },
      airlineLetter: "K",
      status: RequestStatus.APPROVED,
      createdAt: "2023-11-01T10:00:00Z",
    },
    {
      id: "req_102",
      airlineId: "air_01",
      requestType: RequestType.CANCEL,
      requestFormat: RequestFormat.SCR,
      isUtc: true,
      flightArr: "IB3402",
      flightDep: "IB3403",
      origin: "MAD",
      destination: "NLU",
      timeArr: "14:20",
      timeDep: "16:00",
      frequency: "1.3.5..",
      validityFrom: "2023-11-15",
      validityTo: "2023-11-15",
      slotNumber: "00421",
      scrContent:
        "SCR\nW25\n15DEC\nNLU\nK IB3402 15DEC 15DEC 0030000 180320 MAD1000 1200ORY JJ",
      airlineLetter: "K",
      status: RequestStatus.PENDING,
      createdAt: "2023-11-10T14:30:00Z",
    },
    {
      id: "req_103",
      airlineId: "air_03",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.MANUAL,
      isUtc: true,
      flightArr: "VB1020",
      flightDep: "VB1021",
      origin: "MTY",
      destination: "NLU",
      timeArr: "08:00",
      timeDep: "09:30",
      frequency: "1234567",
      validityFrom: "2023-12-01",
      validityTo: "2024-05-30",
      slotNumber: "8821",
      manualData: {
        header: {
          representative: "PEDRO LOPEZ",
          officePhone: "8181234567",
          cellPhone: "8189876543",
          date: "01/12/2025",
          page: "1",
          revision: "1",
          controlNumber: "VB-MOD-8821",
        },
        rows: [
          {
            id: "row-mod-1",
            movementType: "X",
            airlineCode: "VB",
            flightArr: "1020",
            flightDep: "1021",
            equipment: "A320",
            timeArr: "08:15",
            timeDep: "09:45",
            origin: "MTY",
            destination: "NLU",
            frequency: "1234567",
            validityFrom: "01/12/25",
            validityTo: "30/05/26",
            typeArr: "F",
            typeDep: "F",
            slotNumber: "8821",
            observations: "AJUSTE DE HORARIO SOLICITADO POR OPS",
          },
          {
            id: "row-mod-2",
            movementType: "K",
            airlineCode: "VB",
            flightArr: "1020",
            flightDep: "1021",
            equipment: "A320",
            timeArr: "08:00",
            timeDep: "09:30",
            origin: "MTY",
            destination: "NLU",
            frequency: "1234567",
            validityFrom: "01/12/25",
            validityTo: "30/05/26",
            typeArr: "F",
            typeDep: "F",
            slotNumber: "8821",
            observations: "SOLICITUD ORIGINAL",
          },
        ],
      },
      airlineLetter: "X",
      adminLetter: "A",
      status: RequestStatus.PENDING,
      createdAt: "2023-11-12T09:15:00Z",
    },
    {
      id: "req_local_1",
      airlineId: "air_03",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      isUtc: false,
      flightArr: "VB2030",
      flightDep: "VB2031",
      origin: "GDL",
      destination: "NLU",
      timeArr: "10:00",
      timeDep: "11:30",
      frequency: "1234567",
      validityFrom: "2024-01-10",
      validityTo: "2024-06-30",
      slotNumber: "9902",
      manualData: {
        header: {
          representative: "MARCOS RUIZ",
          officePhone: "3331234567",
          cellPhone: "3339876543",
          date: "15/11/2025",
          page: "1",
          revision: "0",
          controlNumber: "VB-LCL-9902",
        },
        rows: [
          {
            id: "row-lcl-1",
            movementType: "N",
            airlineCode: "VB",
            flightArr: "2030",
            flightDep: "2031",
            equipment: "A321",
            timeArr: "10:00",
            timeDep: "11:30",
            origin: "GDL",
            destination: "NLU",
            frequency: "1234567",
            validityFrom: "10/01/24",
            validityTo: "30/06/24",
            typeArr: "F",
            typeDep: "F",
            slotNumber: "9902",
            observations: "CAPTURA EN HORA LOCAL",
          },
        ],
      },
      status: RequestStatus.PENDING,
      createdAt: "2023-11-15T11:00:00Z",
    },
  ];
  saveRequestsToStorage(MOCK_REQUESTS);
}

// Helper to build ISO date strings relative to today
const daysAgo = (n: number, hour = 10): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Seed recent demo data so statistics charts always have meaningful data
if (!MOCK_REQUESTS.some((r) => r.id === "rdem_001")) {
  const recentEntries: SlotRequest[] = [
    // Today – 3 requests
    {
      id: "rdem_001",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(0, 9),
    },
    {
      id: "rdem_002",
      airlineId: "air_03",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(0, 11),
    },
    {
      id: "rdem_003",
      airlineId: "air_02",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(0, 14),
    },
    // Yesterday – 2 requests
    {
      id: "rdem_004",
      airlineId: "air_01",
      requestType: RequestType.CANCEL,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(1, 10),
    },
    {
      id: "rdem_005",
      airlineId: "air_02",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(1, 15),
    },
    // 2 days ago – 1 request
    {
      id: "rdem_006",
      airlineId: "air_03",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.REJECTED,
      createdAt: daysAgo(2, 16),
    },
    // 3 days ago – 3 requests
    {
      id: "rdem_007",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(3, 8),
    },
    {
      id: "rdem_008",
      airlineId: "air_02",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(3, 11),
    },
    {
      id: "rdem_009",
      airlineId: "air_03",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(3, 14),
    },
    // 4 days ago – 1 request
    {
      id: "rdem_010",
      airlineId: "air_01",
      requestType: RequestType.CANCEL,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(4, 9),
    },
    // 5 days ago – 2 requests
    {
      id: "rdem_011",
      airlineId: "air_02",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(5, 10),
    },
    {
      id: "rdem_012",
      airlineId: "air_03",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.REJECTED,
      createdAt: daysAgo(5, 16),
    },
    // 6 days ago – 1 request
    {
      id: "rdem_013",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(6, 11),
    },
    // 8 days ago – 2 requests
    {
      id: "rdem_014",
      airlineId: "air_02",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(8, 10),
    },
    {
      id: "rdem_015",
      airlineId: "air_03",
      requestType: RequestType.CANCEL,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(8, 14),
    },
    // 10 days ago – 2 requests
    {
      id: "rdem_016",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(10, 9),
    },
    {
      id: "rdem_017",
      airlineId: "air_02",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(10, 13),
    },
    // 14 days ago – 1 request
    {
      id: "rdem_018",
      airlineId: "air_03",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(14, 10),
    },
    // 18 days ago – 2 requests
    {
      id: "rdem_019",
      airlineId: "air_01",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(18, 11),
    },
    {
      id: "rdem_020",
      airlineId: "air_02",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(18, 15),
    },
    // 22 days ago – 1 request
    {
      id: "rdem_021",
      airlineId: "air_03",
      requestType: RequestType.CANCEL,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.REJECTED,
      createdAt: daysAgo(22, 9),
    },
    // 26 days ago – 1 request
    {
      id: "rdem_022",
      airlineId: "air_01",
      requestType: RequestType.NEW,
      requestFormat: RequestFormat.SCR,
      status: RequestStatus.APPROVED,
      createdAt: daysAgo(26, 14),
    },
    // 29 days ago – 1 request
    {
      id: "rdem_023",
      airlineId: "air_02",
      requestType: RequestType.MODIFY,
      requestFormat: RequestFormat.MANUAL,
      status: RequestStatus.PENDING,
      createdAt: daysAgo(29, 10),
    },
  ];
  MOCK_REQUESTS = [...recentEntries, ...MOCK_REQUESTS];
  saveRequestsToStorage(MOCK_REQUESTS);
}

// Service Methods simulating Async Supabase calls
export const mockSupabase = {
  auth: {
    signIn: async (
      email: string,
    ): Promise<{
      user: User | null;
      airline: Airline | null;
      error: string | null;
    }> => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (!user) {
        return {
          user: null,
          airline: null,
          error: "Credenciales inválidas o usuario no encontrado.",
        };
      }
      const airline =
        MOCK_AIRLINES.find((a) => a.id === user.airlineId) || null;
      return { user, airline, error: null };
    },
  },
  db: {
    getRequests: async (airlineId: string): Promise<SlotRequest[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_REQUESTS.filter((r) => r.airlineId === airlineId);
    },
    getRequestsAll: async (): Promise<SlotRequest[]> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return [...MOCK_REQUESTS];
    },
    updateRequestStatus: async (
      requestId: string,
      status: RequestStatus,
    ): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const index = MOCK_REQUESTS.findIndex((r) => r.id === requestId);
      if (index !== -1) {
        MOCK_REQUESTS[index] = { ...MOCK_REQUESTS[index], status };
        saveRequestsToStorage(MOCK_REQUESTS);
      }
    },
    updateRequest: async (request: SlotRequest): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const index = MOCK_REQUESTS.findIndex((r) => r.id === request.id);
      if (index !== -1) {
        MOCK_REQUESTS[index] = { ...request };
        saveRequestsToStorage(MOCK_REQUESTS);
      }
    },
    getAirlineById: (airlineId: string) =>
      MOCK_AIRLINES.find((a) => a.id === airlineId),
    getAirlines: (): Airline[] =>
      MOCK_AIRLINES.filter((a) => a.id !== "air_admin"),
    createRequest: async (
      request: Omit<SlotRequest, "id" | "createdAt" | "status"> & {
        status?: RequestStatus;
      },
    ): Promise<SlotRequest> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const newRequest: SlotRequest = {
        ...request,
        id: `req_${Math.floor(Math.random() * 10000)}`,
        status: request.status || RequestStatus.PENDING,
        createdAt: new Date().toISOString(),
      } as SlotRequest;
      MOCK_REQUESTS = [newRequest, ...MOCK_REQUESTS];
      saveRequestsToStorage(MOCK_REQUESTS);
      return newRequest;
    },
    submitBatch: async (requests: Partial<SlotRequest>[]): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const batchId = `batch_${Math.floor(Math.random() * 10000)}`;
      const newRequests: SlotRequest[] = requests.map(
        (req) =>
          ({
            ...req,
            id: `req_${Math.floor(Math.random() * 100000)}`,
            batchId,
            createdAt: new Date().toISOString(),
            status: req.status || RequestStatus.SUBMITTED,
          }) as SlotRequest,
      );
      MOCK_REQUESTS = [...newRequests, ...MOCK_REQUESTS];
      saveRequestsToStorage(MOCK_REQUESTS);
    },
  },
};
