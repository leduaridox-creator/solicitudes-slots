import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  SlotRequest,
  RequestStatus,
  Airline,
  User,
  NotificationSettings,
  RequestFormat,
  ManualRow,
  RequestType,
  ADMIN_ALLOWED_LETTERS,
} from "../types";
import { mockSupabase } from "../services/mockSupabase";
import { EmailComposer } from "./EmailComposer";
import {
  buildRequestEmailContext,
  applyEmailTemplate,
} from "../services/emailNotifications";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  FileEdit,
  Eye,
  Check,
  X,
  Save,
  Send,
  Sparkles,
  Mail,
  Loader2,
  Layers,
  Plus,
  Minus,
  Filter,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface DashboardProps {
  airline: Airline;
  user: User;
  onShowToast?: (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  airline,
  user,
  onShowToast,
}) => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(
    user.role === "admin" ? RequestStatus.PENDING : "ALL",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRequest, setViewingRequest] = useState<SlotRequest | null>(
    null,
  );
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [editedAdminLetter, setEditedAdminLetter] = useState("");
  const [adminLetterError, setAdminLetterError] = useState<string | null>(null);
  const [responseRequest, setResponseRequest] = useState<SlotRequest | null>(null);
  const [responseStatus, setResponseStatus] = useState<RequestStatus | null>(null);
  const [responseTo, setResponseTo] = useState("");
  const [responseDefaultCc, setResponseDefaultCc] = useState("");
  const [responseAdditionalCc, setResponseAdditionalCc] = useState("");
  const [responseBcc, setResponseBcc] = useState("");
  const [responseSubject, setResponseSubject] = useState("");
  const [responseBodyHtml, setResponseBodyHtml] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  // States for the Manual Edit Form inside Dashboard
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);
  const [manualHeader, setManualHeader] = useState<any>(null);

  const isAdmin = user.role === "admin";
  const gridRef = useRef<HTMLDivElement>(null);

  const textToHtml = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const fetchRequests = async () => {
    setLoading(true);
    let data = isAdmin
      ? await mockSupabase.db.getRequestsAll()
      : await mockSupabase.db.getRequests(airline.id);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [airline.id, isAdmin]);

  useEffect(() => {
    if (viewingRequest) {
      setEditedAdminLetter(viewingRequest.adminLetter || "");
    } else {
      setEditedAdminLetter("");
      setAdminLetterError(null);
    }
  }, [viewingRequest]);

  // Global listener for Escape key to close modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewingRequest) {
          setViewingRequest(null);
          setIsEditingInModal(false);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [viewingRequest]);

  const openResponseComposer = async (
    request: SlotRequest,
    newStatus: RequestStatus,
  ) => {
    try {
      const settings: NotificationSettings =
        await mockSupabase.db.getNotificationSettings();
      const airlineData = mockSupabase.db.getAirlineById(request.airlineId);
      const context = buildRequestEmailContext(
        { ...request, status: newStatus },
        airlineData?.name || "Aerolínea",
      );

      setResponseRequest(request);
      setResponseStatus(newStatus);
      setResponseTo(settings.adminResponseDefaults.to);
      setResponseDefaultCc(settings.adminResponseDefaults.cc);
      setResponseAdditionalCc("");
      setResponseBcc(settings.adminResponseDefaults.bcc);
      setResponseSubject(
        applyEmailTemplate(settings.adminResponseDefaults.subject, context),
      );
      setResponseBodyHtml(textToHtml(settings.adminResponseDefaults.message));
    } catch (error) {
      onShowToast?.(
        "error",
        "Correo",
        "No se pudo preparar el borrador de respuesta.",
      );
    }
  };

  const handleStatusChange = async (
    reqId: string,
    newStatus: RequestStatus,
  ) => {
    try {
      await mockSupabase.db.updateRequestStatus(reqId, newStatus);
      onShowToast?.(
        "success",
        "Estatus Actualizado",
        `Solicitud marcada como ${newStatus}`,
      );
      fetchRequests();
    } catch (e) {
      onShowToast?.("error", "Error", "No se pudo actualizar el estatus.");
    }
  };

  const insertResponseSummary = () => {
    if (!responseRequest || !responseStatus) return;
    const airlineData = mockSupabase.db.getAirlineById(responseRequest.airlineId);
    const summaryHtml = `<section style="margin:24px 0;padding:20px;border:1px solid #dbeafe;border-radius:20px;background:#eff6ff;"><h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Detalle de la resolución</h2><ul style="margin:0;padding-left:20px;color:#0f172a;"><li><strong>Solicitud:</strong> ${escapeHtml(responseRequest.id)}</li><li><strong>Aerolínea:</strong> ${escapeHtml(airlineData?.name || "Aerolínea")}</li><li><strong>Estatus:</strong> ${escapeHtml(responseStatus)}</li><li><strong>Tipo:</strong> ${escapeHtml(responseRequest.requestType)}</li><li><strong>Formato:</strong> ${escapeHtml(responseRequest.requestFormat)}</li><li><strong>Vuelo:</strong> ${escapeHtml(responseRequest.flightArr || responseRequest.flightDep || "N/A")}</li><li><strong>Ruta:</strong> ${escapeHtml(responseRequest.origin || "--")} - ${escapeHtml(responseRequest.destination || "--")}</li></ul></section>`;
    setResponseBodyHtml((prev) => `${prev}${summaryHtml}`);
  };

  const submitResponseEmail = async () => {
    if (!responseRequest || !responseStatus) return;
    setSendingResponse(true);
    try {
      await handleStatusChange(responseRequest.id, responseStatus);
      setResponseRequest(null);
      setResponseStatus(null);
      setViewingRequest(null);
      setIsEditingInModal(false);
    } finally {
      setSendingResponse(false);
    }
  };

  const isValidAdminLetter = (letter: string) =>
    ADMIN_ALLOWED_LETTERS.includes(letter.toUpperCase() as any);

  const saveChangesExactos = async () => {
    if (!viewingRequest || !isAdmin) return;
    if (editedAdminLetter && !isValidAdminLetter(editedAdminLetter)) {
      setAdminLetterError("La letra del administrador no es válida.");
      return;
    }
    setAdminLetterError(null);
    try {
      const updatedReq = {
        ...viewingRequest,
        adminLetter: editedAdminLetter.trim() || undefined,
      };
      if (viewingRequest.requestFormat === RequestFormat.SCR) {
        updatedReq.scrContent = editedText;
      } else {
        updatedReq.manualData = {
          header: manualHeader,
          rows: manualRows,
        };
      }
      await mockSupabase.db.updateRequest(updatedReq);
      setViewingRequest(updatedReq);
      setIsEditingInModal(false);
      fetchRequests();
      onShowToast?.(
        "success",
        "Guardado",
        "Cambios persistidos correctamente.",
      );
    } catch (e) {
      onShowToast?.("error", "Error", "No se pudieron guardar los cambios.");
    }
  };

  const handleGridKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number,
    totalCols: number,
  ) => {
    const { key } = e;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key))
      return;

    const input = e.currentTarget;
    const shouldNavigateLeft =
      key === "ArrowLeft" && input.selectionStart === 0;
    const shouldNavigateRight =
      key === "ArrowRight" && input.selectionEnd === input.value.length;
    const shouldNavigateUpDown = key === "ArrowUp" || key === "ArrowDown";

    if (shouldNavigateLeft || shouldNavigateRight || shouldNavigateUpDown) {
      e.preventDefault();
      let targetRow = rowIdx;
      let targetCol = colIdx;

      if (key === "ArrowUp") targetRow = Math.max(0, rowIdx - 1);
      if (key === "ArrowDown")
        targetRow = Math.min(manualRows.length - 1, rowIdx + 1);
      if (key === "ArrowLeft") targetCol = Math.max(0, colIdx - 1);
      if (key === "ArrowRight") targetCol = Math.min(totalCols - 1, colIdx + 1);

      const targetInput = gridRef.current?.querySelector(
        `input[data-row="${targetRow}"][data-col="${targetCol}"]`,
      ) as HTMLInputElement;

      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  const updateManualRow = (
    idx: number,
    field: keyof ManualRow,
    value: string,
  ) => {
    const newRows = [...manualRows];
    let cleanedValue = value;
    if (
      [
        "movementType",
        "equipment",
        "origin",
        "destination",
        "typeArr",
        "typeDep",
        "airlineCode",
      ].includes(field)
    ) {
      cleanedValue = value.toUpperCase();
    }
    newRows[idx] = { ...newRows[idx], [field]: cleanedValue as any };
    setManualRows(newRows);
  };

  const updateFrequencyChar = (
    rowIndex: number,
    dayIndex: number,
    char: string,
  ) => {
    const newRows = [...manualRows];
    let freq = newRows[rowIndex].frequency || "       ";
    const freqArray = freq.padEnd(7, " ").split("");
    freqArray[dayIndex] = char.charAt(0) || " ";
    newRows[rowIndex].frequency = freqArray.join("");
    setManualRows(newRows);
  };

  const addManualRow = () => {
    const lastRow = manualRows[manualRows.length - 1];
    setManualRows([...manualRows, { ...lastRow, id: `row-${Date.now()}` }]);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Aprobado
          </span>
        );
      case RequestStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" /> Rechazado
          </span>
        );
      case RequestStatus.PENDING:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pendiente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const renderOfficialDesign = (req: SlotRequest, isEditing: boolean) => {
    const airlineData = mockSupabase.db.getAirlineById(req.airlineId);
    const header = isEditing
      ? manualHeader
      : req.manualData?.header || {
          representative: "",
          officePhone: "",
          cellPhone: "",
          date: "",
          page: "1",
          revision: "0",
          controlNumber: "",
        };
    const rows = isEditing ? manualRows : req.manualData?.rows || [];
    const activeIsUtc = req.isUtc;
    const scheduleLabel = activeIsUtc ? "Horario UTC" : "Horario local";
    const frequencyLabel = activeIsUtc
      ? "Frecuencia UTC"
      : "Frecuencia local";
    const validityLabel = activeIsUtc ? "Vigencia UTC" : "Vigencia local";

    return (
      <div
        ref={isEditing ? gridRef : null}
        className={`bg-white w-full font-['Arial',_sans-serif] text-black border border-black relative flex flex-col p-4 shadow-sm select-text ${isEditing ? "border-blue-600 border-2" : ""}`}
      >
        <div className="overflow-x-auto">
          <table
            className="border-collapse border border-black text-[15px] font-bold"
            style={{ tableLayout: "fixed", width: "100%", minWidth: "1624px" }}
          >
            <colgroup>
              <col style={{ width: "340px" }} />
              <col style={{ width: "340px" }} />
              <col style={{ width: "340px" }} />
              <col style={{ width: "264px" }} />
              <col style={{ width: "113.33px" }} />
              <col style={{ width: "113.33px" }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td
                  className="w-[340px] border border-black p-2 align-middle bg-white"
                  style={{ height: "140px" }}
                ></td>
                <td
                  className="border border-black px-4 py-3 text-center align-middle bg-white"
                  colSpan={3}
                >
                  <h1 className="font-bold text-[1.6rem] uppercase leading-tight">
                    Comité de operación y horarios
                  </h1>
                  <h2 className="font-bold text-[1.3rem] uppercase leading-tight">
                    Aeropuerto internacional "felipe ángeles"
                  </h2>
                  <h3 className="font-bold text-[1.3rem] uppercase leading-tight">
                    Solicitud de horarios (slots)
                  </h3>
                </td>
                <td
                  className="border border-black p-3 align-top bg-white font-normal text-[12px]"
                  colSpan={3}
                >
                  <p className="font-bold text-[15px] mb-1">
                    Aeropuerto Internacional Felipe Ángeles, S.A. de C.V.
                  </p>
                  <p>
                    Domicilio: Circuito Exterior Mexiquense km. 33, Santa Lucía,
                  </p>
                  <p>Zumpango, Estado de México.</p>
                  <p>Teléfonos: 55 2583 6432</p>
                  <p>Correo electrónico: ofcaaifa.dn3@sedena.gob.mx</p>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="w-[340px] border border-black px-3 py-2 bg-slate-50/30 align-middle text-center">
                  Línea aérea:
                </td>
                <td
                  className="border border-black px-3 py-2 uppercase"
                  colSpan={2}
                >
                  {airlineData?.name}
                </td>
                <td className="w-48 border border-black px-3 py-2 bg-slate-50/30 align-middle text-center">
                  Fecha:
                </td>
                <td className="px-3 py-2" colSpan={3}>
                  {isEditing ? (
                    <input
                      className="w-full outline-none bg-blue-50/30 h-full"
                      value={header.date}
                      onChange={(e) =>
                        setManualHeader({ ...header, date: e.target.value })
                      }
                    />
                  ) : (
                    header.date
                  )}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="w-[340px] border border-black px-3 py-2 bg-slate-50/30 align-middle text-center">
                  Representante:
                </td>
                <td className="border border-black px-3 py-2" colSpan={2}>
                  {isEditing ? (
                    <input
                      className="w-full outline-none bg-blue-50/30 h-full"
                      value={header.representative}
                      onChange={(e) =>
                        setManualHeader({
                          ...header,
                          representative: e.target.value,
                        })
                      }
                    />
                  ) : (
                    header.representative
                  )}
                </td>
                <td className="w-48 border border-black px-3 py-2 bg-slate-50/30 align-middle text-center">
                  Página:
                </td>
                <td className="px-3 py-2" colSpan={3}>
                  {header.page}
                </td>
              </tr>
              <tr
                className="border-b border-black"
                style={{ minHeight: "60px", height: "60px" }}
              >
                <td className="w-[340px] border border-black px-3 py-2 bg-slate-50/30 align-middle text-center">
                  Teléfonos:
                </td>
                <td className="border border-black p-0 align-middle" colSpan={2}>
                  <table
                    className="w-full border-collapse"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="py-1 px-3 text-left align-middle">
                          {isEditing ? (
                            <input
                              className="w-full outline-none bg-blue-50/30 h-7 px-2 text-left"
                              value={header.officePhone}
                              onChange={(e) =>
                                setManualHeader({
                                  ...header,
                                  officePhone: e.target.value,
                                })
                              }
                              placeholder="Tel. oficina"
                            />
                          ) : (
                            <span className="w-full text-left">
                              {header.officePhone || ""}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-3 text-left align-middle">
                          {isEditing ? (
                            <input
                              className="w-full outline-none bg-blue-50/30 h-7 px-2 text-left"
                              value={header.cellPhone}
                              onChange={(e) =>
                                setManualHeader({
                                  ...header,
                                  cellPhone: e.target.value,
                                })
                              }
                              placeholder="Celular"
                            />
                          ) : (
                            <span className="w-full text-left">
                              {header.cellPhone || ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td colSpan={4} className="border border-black p-0" style={{ height: "60px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flex: 1,
                        borderBottom: "1px solid black",
                      }}
                    >
                      <div
                        style={{
                          width: "264px",
                          borderRight: "1px solid black",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="bg-slate-50/30 font-bold px-3"
                      >
                        Revisión:
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                        className="px-3"
                      >
                        {header.revision}
                      </div>
                    </div>
                    <div style={{ display: "flex", flex: 1 }}>
                      <div
                        style={{
                          width: "264px",
                          borderRight: "1px solid black",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className="bg-slate-50/30 font-bold px-3"
                      >
                        No. de control:
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                        className="px-3 text-blue-800 font-bold"
                      >
                        {header.controlNumber}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border border-black bg-white">
            <table
              className="border-collapse border border-black text-center leading-tight text-[15px]"
              style={{
                tableLayout: "fixed",
                width: "100%",
                minWidth: "1624px",
                borderCollapse: "collapse",
              }}
            >
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "31.428571px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "72px" }} />
                <col style={{ width: "72px" }} />
                <col style={{ width: "100px" }} />
                <col />
              </colgroup>
              <thead>
                <tr
                  className="bg-slate-50/50 font-semibold"
                  style={{ minHeight: "44px" }}
                >
                  <th rowSpan={2} className="border border-black p-[5px]">Tipo de Movimiento (N, C, R, D)</th>
                  <th rowSpan={2} className="border border-black p-[5px]">Línea Aérea</th>
                  <th colSpan={2} className="border border-black p-[5px]">No. de vuelo</th>
                  <th rowSpan={2} className="border border-black p-[5px]">Equipo de vuelo</th>
                  <th colSpan={2} className="border border-black p-[5px]">{scheduleLabel}</th>
                  <th colSpan={2} className="border border-black p-[5px]">Ruta</th>
                  <th colSpan={7} className="border border-black p-[5px]">{frequencyLabel}</th>
                  <th colSpan={2} className="border border-black p-[5px]">{validityLabel} (dd/mm/aa)</th>
                  <th colSpan={2} className="border border-black p-[5px]">Tipo (J, F, C, H)</th>
                  <th rowSpan={2} className="border border-black p-[5px] font-semibold text-blue-700">No. slot</th>
                  <th rowSpan={2} className="border border-black p-[5px]">Observaciones</th>
                </tr>
                <tr className="bg-slate-50/50 text-[15px] font-semibold border-b border-black" style={{ minHeight: "44px" }}>
                  <th className="border border-black p-[5px]">Llegada</th>
                  <th className="border border-black p-[5px]">Salida</th>
                  <th className="border border-black p-[5px]">Llegada</th>
                  <th className="border border-black p-[5px]">Salida</th>
                  <th className="border border-black p-[5px]">Origen</th>
                  <th className="border border-black p-[5px]">Destino</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <th key={d} className="border border-black p-[5px]">{d}</th>
                  ))}
                  <th className="border border-black p-[5px]">Desde</th>
                  <th className="border border-black p-[5px]">Hasta</th>
                  <th className="border border-black p-[5px]">Llegada</th>
                  <th className="border border-black p-[5px]">Salida</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: ManualRow, idx: number) => {
                  const totalColsInGrid = 22;
                  return (
                    <tr
                      key={row.id || idx}
                      className="border-b border-black/30 hover:bg-blue-50/10"
                      style={{ minHeight: "36px", height: "36px" }}
                    >
                      <td className="border border-black font-bold uppercase text-[14px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={0}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 0, totalColsInGrid)
                            }
                            className="w-full text-center outline-none bg-slate-100 px-1"
                            style={{ minHeight: "34px", height: "34px", padding: "0 4px" }}
                            maxLength={1}
                            value={row.movementType}
                            onChange={(e) =>
                              updateManualRow(idx, "movementType", e.target.value)
                            }
                          />
                        ) : (
                          row.movementType
                        )}
                      </td>
                      <td className="border border-black uppercase font-bold text-slate-800 bg-slate-50/10 text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={1}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 1, totalColsInGrid)
                            }
                            className="w-full text-center outline-none bg-transparent px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.airlineCode}
                            onChange={(e) =>
                              updateManualRow(idx, "airlineCode", e.target.value)
                            }
                          />
                        ) : (
                          row.airlineCode
                        )}
                      </td>
                      <td className="border border-black text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={2}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 2, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.flightArr}
                            onChange={(e) =>
                              updateManualRow(idx, "flightArr", e.target.value)
                            }
                          />
                        ) : (
                          row.flightArr
                        )}
                      </td>
                      <td className="border border-black text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={3}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 3, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.flightDep}
                            onChange={(e) =>
                              updateManualRow(idx, "flightDep", e.target.value)
                            }
                          />
                        ) : (
                          row.flightDep
                        )}
                      </td>
                      <td className="border border-black uppercase text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={4}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 4, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.equipment}
                            onChange={(e) =>
                              updateManualRow(idx, "equipment", e.target.value)
                            }
                          />
                        ) : (
                          row.equipment
                        )}
                      </td>
                      <td className="border border-black font-mono font-bold text-blue-900 text-[14px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={5}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 5, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.timeArr}
                            onChange={(e) =>
                              updateManualRow(idx, "timeArr", e.target.value)
                            }
                          />
                        ) : (
                          row.timeArr
                        )}
                      </td>
                      <td className="border border-black font-mono font-bold text-blue-900 text-[14px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={6}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 6, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.timeDep}
                            onChange={(e) =>
                              updateManualRow(idx, "timeDep", e.target.value)
                            }
                          />
                        ) : (
                          row.timeDep
                        )}
                      </td>
                      <td className="border border-black uppercase text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={7}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 7, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.origin}
                            onChange={(e) =>
                              updateManualRow(idx, "origin", e.target.value)
                            }
                          />
                        ) : (
                          row.origin
                        )}
                      </td>
                      <td className="border border-black uppercase text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={8}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 8, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.destination}
                            onChange={(e) =>
                              updateManualRow(idx, "destination", e.target.value)
                            }
                          />
                        ) : (
                          row.destination
                        )}
                      </td>
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <td key={d} className="border border-black font-bold text-[15px] text-center">
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={9 + d}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 9 + d, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                              maxLength={1}
                              value={(row.frequency || "").charAt(d).trim()}
                              onChange={(e) =>
                                updateFrequencyChar(idx, d, e.target.value)
                              }
                            />
                          ) : (
                            (row.frequency || "").charAt(d)
                          )}
                        </td>
                      ))}
                      <td className="border border-black text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={16}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 16, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.validityFrom}
                            onChange={(e) =>
                              updateManualRow(idx, "validityFrom", e.target.value)
                            }
                          />
                        ) : (
                          row.validityFrom
                        )}
                      </td>
                      <td className="border border-black text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={17}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 17, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.validityTo}
                            onChange={(e) =>
                              updateManualRow(idx, "validityTo", e.target.value)
                            }
                          />
                        ) : (
                          row.validityTo
                        )}
                      </td>
                      <td className="border border-black uppercase text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={18}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 18, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.typeArr}
                            onChange={(e) =>
                              updateManualRow(idx, "typeArr", e.target.value)
                            }
                          />
                        ) : (
                          row.typeArr
                        )}
                      </td>
                      <td className="border border-black uppercase text-[15px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={19}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 19, totalColsInGrid)
                            }
                            className="w-full text-center outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.typeDep}
                            onChange={(e) =>
                              updateManualRow(idx, "typeDep", e.target.value)
                            }
                          />
                        ) : (
                          row.typeDep
                        )}
                      </td>
                      <td className="border border-black font-bold text-blue-700 bg-blue-50/20 text-[14px] text-center">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={20}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 20, totalColsInGrid)
                            }
                            className="w-full text-center outline-none bg-transparent"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.slotNumber}
                            onChange={(e) =>
                              updateManualRow(idx, "slotNumber", e.target.value)
                            }
                          />
                        ) : (
                          row.slotNumber
                        )}
                      </td>
                      <td className="border border-black text-left px-2 text-[14px]">
                        {isEditing ? (
                          <input
                            data-row={idx}
                            data-col={21}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 21, totalColsInGrid)
                            }
                            className="w-full outline-none px-1"
                            style={{ minHeight: "32px", height: "32px", padding: "0 4px" }}
                            value={row.observations}
                            onChange={(e) =>
                              updateManualRow(idx, "observations", e.target.value)
                            }
                          />
                        ) : (
                          row.observations
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {isEditing && (
          <div className="flex p-2 space-x-4 border-x border-b border-black select-none bg-slate-50/50">
            <button
              onClick={addManualRow}
              className="flex items-center px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3 mr-2" /> Agregar movimiento
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 border border-black mt-1 text-[13px] font-bold h-40">
          <div className="border-r border-black p-3">Firma Administrador</div>
          <div className="p-3 text-right">Firma Comandancia AFAC</div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!viewingRequest) return null;

    const isManual =
      viewingRequest.requestFormat === RequestFormat.MANUAL ||
      viewingRequest.manualData !== undefined;

    const renderRequestPreviewCard = () => (
      <div className="w-full max-w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4 px-2 select-none">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Documento 1 • {viewingRequest.requestFormat} ({viewingRequest.requestType})
          </span>
        </div>
        {isEditingInModal ? (
          viewingRequest.requestFormat === RequestFormat.SCR ? (
            <textarea
              className="w-full min-h-[500px] p-8 font-mono text-sm bg-white border border-blue-200 rounded-xl outline-none"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />
          ) : (
            <div className="w-full bg-white shadow-sm overflow-auto">
              {renderOfficialDesign(viewingRequest, true)}
            </div>
          )
        ) : isManual ? (
          renderOfficialDesign(viewingRequest, false)
        ) : (
          <div className="bg-slate-900 rounded-xl p-8 shadow-2xl overflow-auto select-text font-mono text-emerald-400 whitespace-pre border border-black">
            {viewingRequest.scrContent || "Sin contenido SCR disponible."}
          </div>
        )}
      </div>
    );

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] max-h-[95vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Revisión de Solicitud ({viewingRequest.requestFormat})
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase">
                Vista previa del paquete
              </h3>
            </div>
            <button
              onClick={() => {
                setViewingRequest(null);
                setIsEditingInModal(false);
              }}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-slate-50 flex flex-col items-center">
            <div className="w-full max-w-full space-y-6">
              <div className="flex flex-col space-y-2 select-none">
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                  Vista previa de la solicitud
                </h3>
                <p className="text-slate-500 font-medium">
                  Contenido técnico exacto con la misma presentación que ve el operador de la aerolínea.
                </p>
              </div>
              {renderRequestPreviewCard()}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center select-none">
            <div className="flex gap-2">
              {isAdmin && viewingRequest.status === RequestStatus.PENDING && (
                <>
                  <button
                    onClick={() => {
                      openResponseComposer(
                        viewingRequest,
                        RequestStatus.APPROVED,
                      );
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md"
                  >
                    Aprobar
                  </button>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md flex items-center">
                    <Lightbulb className="w-3 h-3 mr-1.5" /> Propuesta
                  </button>
                  <button
                    onClick={() => {
                      openResponseComposer(
                        viewingRequest,
                        RequestStatus.REJECTED,
                      );
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md"
                  >
                    Rechazar
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {isAdmin && !isEditingInModal && (
                <>
                  <button
                    onClick={() => {
                      setIsEditingInModal(true);
                      if (viewingRequest.requestFormat === RequestFormat.SCR) {
                        setEditedText(viewingRequest.scrContent || "");
                      } else {
                        setManualHeader({
                          ...viewingRequest.manualData?.header,
                        });
                        setManualRows([
                          ...(viewingRequest.manualData?.rows || []),
                        ]);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md flex items-center"
                  >
                    <FileEdit className="w-4 h-4 mr-2" /> Editar
                  </button>
                  <button
                    onClick={saveChangesExactos}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" /> Guardar
                  </button>
                </>
              )}
              {isAdmin && isEditingInModal && (
                <button
                  onClick={saveChangesExactos}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-md flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </button>
              )}
              <button
                onClick={() => {
                  setViewingRequest(null);
                  setIsEditingInModal(false);
                }}
                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs uppercase transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResponseComposerModal = () => {
    if (!responseRequest || !responseStatus) return null;

    const airlineData = mockSupabase.db.getAirlineById(responseRequest.airlineId);
    const mergedResponseCc = [responseDefaultCc, responseAdditionalCc]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-[96vw] max-h-[96vh] bg-slate-50 rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
          <div className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Respuesta del administrador
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-900 tracking-tight">
                {responseStatus} para {airlineData?.name || "Aerolínea"}
              </h3>
            </div>
            <button
              onClick={() => {
                setResponseRequest(null);
                setResponseStatus(null);
              }}
              className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8">
            <EmailComposer
              title="Diseñar respuesta por correo"
              subtitle="El administrador puede redactar libremente, insertar imágenes y complementar la comunicación antes de cerrar la solicitud."
              fromLabel={`Administración AIFA <coord.slots@aifa.aero>`}
              to={responseTo}
              onToChange={setResponseTo}
              defaultCc={responseDefaultCc}
              extraCcLabel="Agregue correos adicionales para copia"
              extraCc={responseAdditionalCc}
              onExtraCcChange={setResponseAdditionalCc}
              bcc={responseBcc}
              onBccChange={setResponseBcc}
              subject={responseSubject}
              onSubjectChange={setResponseSubject}
              bodyHtml={responseBodyHtml}
              onBodyHtmlChange={setResponseBodyHtml}
              attachmentLabel="resolucion_solicitud.txt"
              attachmentNote={`CC total actual: ${mergedResponseCc || "sin copias"}`}
              helperActions={[
                {
                  label: "Insertar resolución",
                  onClick: insertResponseSummary,
                },
              ]}
            />
          </div>

          <div className="px-8 py-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-sm text-slate-500">
              La resolución se aplicará a la solicitud al confirmar este envío.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setResponseRequest(null);
                  setResponseStatus(null);
                }}
                className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={submitResponseEmail}
                disabled={sendingResponse || !responseTo.trim()}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-60 flex items-center"
              >
                {sendingResponse ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Confirmar y enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 animate-fade-in">
      <div className="flex items-center justify-between select-none">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            {isAdmin ? "BANDEJA DE ENTRADA GLOBAL" : "MIS SOLICITUDES"}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Gestiona y revisa el estado de los movimientos aeroportuarios.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 bg-slate-100/50 rounded-xl p-0.5 border border-slate-200/60">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
          <div className="flex bg-slate-100/50 border border-slate-200 p-1 rounded-xl shadow-sm">
            {[
              "ALL",
              RequestStatus.PENDING,
              RequestStatus.APPROVED,
              RequestStatus.REJECTED,
            ].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === st ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-white/80"}`}
              >
                {st === "ALL" ? "Todos" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200/60 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aerolínea
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Vuelo
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Formato
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ruta
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hora
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estatus
              </th>
              <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Revisar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-slate-500 text-sm font-medium">
                    Cargando solicitudes...
                  </p>
                </td>
              </tr>
            ) : (
              requests
                .filter((r) => {
                  const matchesStatus =
                    statusFilter === "ALL" || r.status === statusFilter;
                  const matchesSearch =
                    searchTerm === "" ||
                    r.flightArr
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    r.origin?.toLowerCase().includes(searchTerm.toLowerCase());
                  return matchesStatus && matchesSearch;
                })
                .map((req) => {
                  const airlineData = mockSupabase.db.getAirlineById(
                    req.airlineId,
                  );
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => setViewingRequest(req)}
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                            <img
                              src={airlineData?.logoUrl}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700">
                            {airlineData?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">
                          {req.flightArr || "MASIVO"}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                          {req.requestFormat}
                        </span>
                      </td>

                      <td className="px-8 py-5 min-w-[180px] text-sm font-bold text-slate-700 tracking-wider">
                        {(() => {
                          const orig = req.origin || "--";
                          const dest = req.destination || "--";
                          const sep = (
                            <span className="text-slate-400 font-normal mx-1">
                              -
                            </span>
                          );
                          if (dest === "NLU")
                            return (
                              <>
                                {orig}
                                {sep}NLU
                              </>
                            );
                          if (orig === "NLU")
                            return (
                              <>
                                NLU{sep}
                                {dest}
                              </>
                            );
                          return (
                            <>
                              {orig}
                              {sep}NLU{sep}
                              {dest}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-mono font-bold text-slate-500">
                        {req.timeArr || "--:--"}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <button className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm mx-auto">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {renderViewModal()}
      {renderResponseComposerModal()}
    </div>
  );
};
