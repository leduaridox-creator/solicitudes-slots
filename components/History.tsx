import React, { useEffect, useState } from "react";
import { SlotRequest, RequestStatus, Airline, User } from "../types";
import { mockSupabase } from "../services/mockSupabase";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Hash,
  Calendar,
  ChevronDown,
} from "lucide-react";

interface HistoryProps {
  airline: Airline;
  user?: User;
}

export const HistoryView: React.FC<HistoryProps> = ({ airline, user }) => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [airlineFilter, setAirlineFilter] = useState<string>("ALL");
  const [airlines, setAirlines] = useState<Airline[]>([]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const currentYear = new Date().getFullYear();

      let data: SlotRequest[];
      if (isAdmin) {
        data = await mockSupabase.db.getRequestsAll();
      } else {
        data = await mockSupabase.db.getRequests(airline.id);
      }

      const mappedData = data.map((req, idx) => {
        const reqAirline = mockSupabase.db.getAirlineById(req.airlineId);
        const iata = reqAirline?.iataCode || airline.iataCode;
        return {
          ...req,
          registrationNumber:
            req.registrationNumber ||
            `SLOTS-${iata}-${(idx + 1).toString().padStart(4, "0")}-${currentYear}`,
        };
      });

      setRequests(mappedData);

      if (isAdmin) {
        setAirlines(mockSupabase.db.getAirlines());
      }

      setLoading(false);
    };
    fetchRequests();
  }, [airline.id, airline.iataCode, isAdmin]);

  const filteredRequests = requests.filter((req) => {
    const matchesAirline =
      airlineFilter === "ALL" || req.airlineId === airlineFilter;
    if (!matchesAirline) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const reqAirlineName =
        mockSupabase.db.getAirlineById(req.airlineId)?.name?.toLowerCase() ??
        "";
      return (
        (req.registrationNumber?.toLowerCase().includes(term) ?? false) ||
        (req.flightArr?.toLowerCase().includes(term) ?? false) ||
        (req.flightDep?.toLowerCase().includes(term) ?? false) ||
        (req.origin?.toLowerCase().includes(term) ?? false) ||
        (req.destination?.toLowerCase().includes(term) ?? false) ||
        reqAirlineName.includes(term)
      );
    }
    return true;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" /> Aprobado
          </span>
        );
      case RequestStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" /> Rechazado
          </span>
        );
      case RequestStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-blue-100 text-blue-700">
            <FileText className="w-3 h-3 mr-1" /> Enviado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" /> Pendiente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in select-text">
      <div className="flex flex-col space-y-2 select-none">
        <h3 className="text-2xl font-bold text-slate-800">
          Historial de Solicitudes
        </h3>
        <p className="text-slate-500">
          Registro histórico de todas las operaciones y cambios solicitados.
        </p>
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm select-none">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por Nº registro, vuelo o ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Airline filter — shown for admin only */}
        {isAdmin && (
          <div className="relative min-w-[200px]">
            <select
              value={airlineFilter}
              onChange={(e) => setAirlineFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Todas las aerolíneas</option>
              {airlines.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.iataCode} — {a.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Result count badge */}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {filteredRequests.length} resultado
          {filteredRequests.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 select-text">
          <thead className="bg-slate-50 select-none">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nº Registro
              </th>
              {isAdmin && (
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Aerolínea
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fecha de Envío
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vuelo / Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Estatus
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 select-text">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const reqAirlineData = mockSupabase.db.getAirlineById(
                  req.airlineId,
                );
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 transition-colors select-text"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="w-3.5 h-3.5 mr-1 text-blue-600 font-bold select-none" />
                        <span className="text-sm font-bold text-slate-900">
                          {req.registrationNumber}
                        </span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={reqAirlineData?.logoUrl}
                              className="max-w-full max-h-full object-contain"
                              alt={reqAirlineData?.name}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {reqAirlineData?.name ?? "—"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {reqAirlineData?.iataCode}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 select-none" />
                        {new Date(req.createdAt).toLocaleDateString("es-MX")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {req.flightArr || req.flightDep || "--"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {req.requestType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {req.origin}{" "}
                      <span className="mx-1 text-slate-300 select-none">→</span>{" "}
                      {req.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap select-none">
                      {getStatusBadge(req.status)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="px-6 py-12 text-center text-slate-500 select-none"
                >
                  No se encontraron registros en el historial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
