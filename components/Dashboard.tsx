import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  SlotRequest,
  RequestStatus,
  Airline,
  User,
  RequestFormat,
  ManualRow,
  RequestType,
  ADMIN_ALLOWED_LETTERS,
} from "../types";
import { mockSupabase } from "../services/mockSupabase";
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
  Paperclip,
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

  // States for the Manual Edit Form inside Dashboard
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);
  const [manualHeader, setManualHeader] = useState<any>(null);

  const isAdmin = user.role === "admin";
  const gridRef = useRef<HTMLDivElement>(null);

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

    return (
      <div
        ref={isEditing ? gridRef : null}
        className={`bg-white w-full font-['Arial',_sans-serif] text-black border border-black relative flex flex-col p-4 shadow-sm select-text ${isEditing ? "border-blue-600 border-2" : ""}`}
      >
        <div className="flex border-b border-black">
          <div className="w-[15%] p-2 flex items-center justify-center border-r border-black shrink-0 bg-white min-h-[90px]">
            <img
              src={airlineData?.logoUrl}
              className="w-14 h-14 object-contain opacity-50 grayscale"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4 border-r border-black bg-white">
            <h1 className="font-bold text-[1.5rem] uppercase leading-tight">
              Comité de operación y horarios
            </h1>
            <h2 className="font-bold text-[1.2rem] uppercase leading-tight">
              Aeropuerto internacional "felipe ángeles"
            </h2>
            <h3 className="font-bold text-[1.2rem] uppercase leading-tight">
              Solicitud de horarios (slots)
            </h3>
          </div>
          <div className="w-[30%] text-[11px] p-2 flex flex-col justify-start shrink-0 bg-white leading-normal text-left">
            <p className="font-bold text-[12px] mb-1">AIFA, S.A. de C.V.</p>
            <p>Circuito Exterior Mexiquense km. 33,</p>
            <p>Zumpango, Estado de México.</p>
            <p>ofcaaifa.dn3@sedena.gob.mx</p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-black text-[14px] font-bold">
          <div className="border-r border-black">
            <div className="flex border-b border-black h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                Línea aérea:
              </div>
              <div className="flex-1 px-3 uppercase">{airlineData?.name}</div>
            </div>
            <div className="flex border-b border-black h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                Representante:
              </div>
              <div className="flex-1 px-3">
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
              </div>
            </div>
            <div className="flex h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                Teléfono:
              </div>
              <div className="flex-1 px-3">
                {isEditing ? (
                  <input
                    className="w-full outline-none bg-blue-50/30 h-full"
                    value={header.officePhone}
                    onChange={(e) =>
                      setManualHeader({
                        ...header,
                        officePhone: e.target.value,
                      })
                    }
                  />
                ) : (
                  header.officePhone
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex border-b border-black h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                Fecha:
              </div>
              <div className="flex-1 px-3">
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
              </div>
            </div>
            <div className="flex border-b border-black h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                Página:
              </div>
              <div className="flex-1 px-3 uppercase">{header.page}</div>
            </div>
            <div className="flex h-10 items-center">
              <div className="w-44 px-3 shrink-0 border-r border-black h-full flex items-center bg-slate-50/50">
                No. control:
              </div>
              <div className="flex-1 px-3 text-blue-700">
                {header.controlNumber}
              </div>
            </div>
          </div>
        </div>
        <div className="border border-black bg-white overflow-x-auto">
          <table className="border-collapse text-center leading-tight table-fixed w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50 font-bold border-b border-black">
                <th rowSpan={2} className="border-r border-black p-1 w-[5%]">
                  Tipo
                </th>
                <th rowSpan={2} className="border-r border-black p-1 w-[5%]">
                  L.A.
                </th>
                <th rowSpan={2} className="border-r border-black p-1 w-[12%]">
                  Vuelo (L/S)
                </th>
                <th rowSpan={2} className="border-r border-black p-1 w-[7%]">
                  Equipo
                </th>
                <th rowSpan={2} className="border-r border-black p-1 w-[10%]">
                  Horario
                </th>
                <th colSpan={2} className="border-r border-black p-1 w-[10%]">
                  Ruta
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-black p-1 w-[14%] text-[9px]"
                >
                  Frecuencia
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-black p-1 w-[10%] text-[9px]"
                >
                  Vigencia
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-black p-1 w-[5%] font-bold text-blue-700"
                >
                  Slot
                </th>
                <th rowSpan={2} className="p-1 w-[15%]">
                  Obs
                </th>
              </tr>
              <tr className="bg-slate-50 font-bold border-b border-black">
                <th className="border-r border-black p-0.5 text-[8px]">Org</th>
                <th className="border-r border-black p-0.5 text-[8px]">Des</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, idx: number) => {
                const totalColsInGrid = 22;
                return (
                  <tr
                    key={row.id || idx}
                    className="h-10 border-b border-black/20 bg-white"
                  >
                    <td className="border-r border-black font-bold uppercase">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={0}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 0, totalColsInGrid)
                          }
                          className="w-full text-center outline-none bg-blue-50/10 h-full"
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
                    <td className="border-r border-black uppercase">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={1}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 1, totalColsInGrid)
                          }
                          className="w-full text-center outline-none bg-blue-50/10 h-full"
                          value={row.airlineCode}
                          onChange={(e) =>
                            updateManualRow(idx, "airlineCode", e.target.value)
                          }
                        />
                      ) : (
                        row.airlineCode
                      )}
                    </td>
                    <td className="border-r border-black">
                      {isEditing ? (
                        <div className="flex h-full">
                          <input
                            data-row={idx}
                            data-col={2}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 2, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none border-r border-black/10"
                            value={row.flightArr}
                            onChange={(e) =>
                              updateManualRow(idx, "flightArr", e.target.value)
                            }
                          />
                          <input
                            data-row={idx}
                            data-col={3}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 3, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none"
                            value={row.flightDep}
                            onChange={(e) =>
                              updateManualRow(idx, "flightDep", e.target.value)
                            }
                          />
                        </div>
                      ) : (
                        `${row.flightArr}/${row.flightDep}`
                      )}
                    </td>
                    <td className="border-r border-black uppercase">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={4}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 4, totalColsInGrid)
                          }
                          className="w-full text-center outline-none h-full"
                          value={row.equipment}
                          onChange={(e) =>
                            updateManualRow(idx, "equipment", e.target.value)
                          }
                        />
                      ) : (
                        row.equipment
                      )}
                    </td>
                    <td className="border-r border-black font-mono">
                      {isEditing ? (
                        <div className="flex h-full">
                          <input
                            data-row={idx}
                            data-col={5}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 5, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none border-r border-black/10"
                            value={row.timeArr}
                            onChange={(e) =>
                              updateManualRow(idx, "timeArr", e.target.value)
                            }
                          />
                          <input
                            data-row={idx}
                            data-col={6}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 6, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none"
                            value={row.timeDep}
                            onChange={(e) =>
                              updateManualRow(idx, "timeDep", e.target.value)
                            }
                          />
                        </div>
                      ) : (
                        `${row.timeArr}/${row.timeDep}`
                      )}
                    </td>
                    <td className="border-r border-black uppercase">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={7}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 7, totalColsInGrid)
                          }
                          className="w-full text-center outline-none h-full"
                          value={row.origin}
                          onChange={(e) =>
                            updateManualRow(idx, "origin", e.target.value)
                          }
                        />
                      ) : (
                        row.origin
                      )}
                    </td>
                    <td className="border-r border-black uppercase">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={8}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 8, totalColsInGrid)
                          }
                          className="w-full text-center outline-none h-full"
                          value={row.destination}
                          onChange={(e) =>
                            updateManualRow(idx, "destination", e.target.value)
                          }
                        />
                      ) : (
                        row.destination
                      )}
                    </td>
                    <td className="border-r border-black font-mono">
                      {isEditing ? (
                        <div className="flex h-full">
                          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                            <input
                              key={d}
                              data-row={idx}
                              data-col={9 + d}
                              onKeyDown={(e) =>
                                handleGridKeyDown(
                                  e,
                                  idx,
                                  9 + d,
                                  totalColsInGrid,
                                )
                              }
                              className="w-[14%] text-center outline-none border-r border-black/10 last:border-r-0"
                              maxLength={1}
                              value={(row.frequency || "").charAt(d).trim()}
                              onChange={(e) =>
                                updateFrequencyChar(idx, d, e.target.value)
                              }
                            />
                          ))}
                        </div>
                      ) : (
                        row.frequency
                      )}
                    </td>
                    <td className="border-r border-black">
                      {isEditing ? (
                        <div className="flex h-full text-[8px]">
                          <input
                            data-row={idx}
                            data-col={16}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 16, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none border-r border-black/10"
                            value={row.validityFrom}
                            onChange={(e) =>
                              updateManualRow(
                                idx,
                                "validityFrom",
                                e.target.value,
                              )
                            }
                          />
                          <input
                            data-row={idx}
                            data-col={17}
                            onKeyDown={(e) =>
                              handleGridKeyDown(e, idx, 17, totalColsInGrid)
                            }
                            className="w-1/2 text-center outline-none"
                            value={row.validityTo}
                            onChange={(e) =>
                              updateManualRow(idx, "validityTo", e.target.value)
                            }
                          />
                        </div>
                      ) : (
                        `${row.validityFrom}-${row.validityTo}`
                      )}
                    </td>
                    <td className="border-r border-black font-bold text-blue-700">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={20}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 20, totalColsInGrid)
                          }
                          className="w-full text-center outline-none h-full bg-blue-50/20"
                          value={row.slotNumber}
                          onChange={(e) =>
                            updateManualRow(idx, "slotNumber", e.target.value)
                          }
                        />
                      ) : (
                        row.slotNumber
                      )}
                    </td>
                    <td className="text-left px-1 truncate">
                      {isEditing ? (
                        <input
                          data-row={idx}
                          data-col={21}
                          onKeyDown={(e) =>
                            handleGridKeyDown(e, idx, 21, totalColsInGrid)
                          }
                          className="w-full outline-none h-full"
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

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] max-h-[95vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Revisión de Solicitud ({viewingRequest.requestFormat})
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase">
                Vista Previa Oficial
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
          <div className="flex-1 overflow-auto p-4 bg-slate-100 flex flex-col items-center">
            {isEditingInModal ? (
              viewingRequest.requestFormat === RequestFormat.SCR ? (
                <textarea
                  className="w-full h-full min-h-[500px] p-8 font-mono text-sm bg-white border border-blue-200 rounded-xl outline-none"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                />
              ) : (
                <div className="w-full max-w-full bg-white shadow-sm overflow-auto">
                  {renderOfficialDesign(viewingRequest, true)}
                </div>
              )
            ) : isManual ? (
              <div className="w-full bg-white shadow-sm">
                {renderOfficialDesign(viewingRequest, false)}
              </div>
            ) : (
              <div className="w-full bg-slate-900 rounded-xl p-8 shadow-2xl font-mono text-emerald-400 text-sm leading-relaxed whitespace-pre select-text overflow-auto">
                {viewingRequest.scrContent || "Sin contenido SCR disponible."}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center select-none">
            <div className="flex gap-2">
              {isAdmin && viewingRequest.status === RequestStatus.PENDING && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(
                        viewingRequest.id,
                        RequestStatus.APPROVED,
                      );
                      setViewingRequest(null);
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
                      handleStatusChange(
                        viewingRequest.id,
                        RequestStatus.REJECTED,
                      );
                      setViewingRequest(null);
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
    </div>
  );
};
