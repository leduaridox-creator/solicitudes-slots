import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Airline,
  RequestFormat,
  RequestType,
  SlotRequest,
  ManualRow,
  ManualHeader,
  RequestStatus,
  AIRLINE_ALLOWED_LETTERS,
} from "../types";
import { mockSupabase } from "../services/mockSupabase";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  Plus,
  Minus,
  Trash2,
  Globe,
  Loader2,
  Package,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  MapPin,
  Send,
  Layers,
  Mail,
  Paperclip,
  Check,
} from "lucide-react";

interface NewRequestProps {
  airline: Airline;
  onSuccess: (message: string) => void;
  onCancel: () => void;
  onToggleSidebar?: (collapsed: boolean) => void;
}

const EMPTY_ROW: ManualRow = {
  id: "",
  movementType: "",
  airlineCode: "",
  flightArr: "",
  flightDep: "",
  equipment: "",
  timeArr: "",
  timeDep: "",
  origin: "",
  destination: "",
  frequency: "",
  validityFrom: "",
  validityTo: "",
  typeArr: "",
  typeDep: "",
  slotNumber: "",
  observations: "",
};

export const NewRequest: React.FC<NewRequestProps> = ({
  airline,
  onSuccess,
  onCancel,
  onToggleSidebar,
}) => {
  const [step, setStep] = useState(1);
  const [reqType, setReqType] = useState<RequestType | null>(null);
  const [reqFormat, setReqFormat] = useState<RequestFormat | null>(null);
  const [isUtc, setIsUtc] = useState(true);
  const [timeTypeSelected, setTimeTypeSelected] = useState(false);

  const [currentBatch, setCurrentBatch] = useState<Partial<SlotRequest>[]>([]);
  const [viewingRequest, setViewingRequest] = useState<SlotRequest | null>(
    null,
  );

  const [scrContent, setScrContent] = useState("");
  const [airlineLetter, setAirlineLetter] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [headerData, setHeaderData] = useState<ManualHeader>({
    representative: "",
    officePhone: "",
    cellPhone: "",
    date: new Date().toLocaleDateString("es-MX"),
    page: "1",
    revision: "0",
    controlNumber: "",
  });

  const [rows, setRows] = useState<ManualRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!reqType) return;
    setRows([]);
  }, [reqType]);

  // Focus management for grid navigation
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 2 && reqFormat === RequestFormat.MANUAL) {
      onToggleSidebar?.(true);
    } else {
      if (step === 1 || step === 3 || step === 4) {
        onToggleSidebar?.(false);
      }
    }
  }, [step, reqFormat, onToggleSidebar]);

  useEffect(() => {
    return () => onToggleSidebar?.(false);
  }, [onToggleSidebar]);

  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Solicitud de Slots - ${airline.name} - ${new Date().toLocaleDateString()}`,
  );
  const [includeInBody, setIncludeInBody] = useState(true);
  const [attachAsFile, setAttachAsFile] = useState(true);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await mockSupabase.db.submitBatch(currentBatch);
      setStep(7);
    } catch (error) {
      console.error("Error submitting batch:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRow = useCallback(() => {
    const timestamp = Date.now();
    setRows((prevRows) => {
      if (reqType === RequestType.MODIFY) {
        const groupId = `pair-${timestamp}`;
        const rowC = {
          ...EMPTY_ROW,
          id: `row-${timestamp}-C`,
          airlineCode: airline.iataCode,
          movementType: "C",
          groupId,
        };
        const rowR = {
          ...EMPTY_ROW,
          id: `row-${timestamp}-R`,
          airlineCode: airline.iataCode,
          movementType: "R",
          groupId,
        };
        return [...prevRows, rowC, rowR];
      }
      const movementType = reqType === RequestType.CANCEL ? "D" : "N";
      const newRow = {
        ...EMPTY_ROW,
        id: `row-${timestamp}`,
        airlineCode: airline.iataCode,
        movementType,
        groupId: `single-${timestamp}`,
      };
      return [...prevRows, newRow];
    });
  }, [reqType, airline.iataCode]);

  const removeLastRow = useCallback(() => {
    setRows((prevRows) => {
      if (prevRows.length === 0) return prevRows;
      if (reqType === RequestType.MODIFY && prevRows.length >= 2) {
        return prevRows.slice(0, -2);
      }
      return prevRows.slice(0, -1);
    });
  }, [reqType]);

  const ALLOWED_MANUAL_MOVEMENT_TYPES = ["N", "R", "D", "C"] as const;
  const isValidManualMovementType = (letter: string) =>
    ALLOWED_MANUAL_MOVEMENT_TYPES.includes(letter.toUpperCase() as any);
  const isValidAirlineLetter = (letter: string) =>
    AIRLINE_ALLOWED_LETTERS.includes(letter.toUpperCase() as any);

  const updateRow = useCallback(
    (idx: number, field: keyof ManualRow, value: string) => {
      setRows((prevRows) => {
        const nextRows = [...prevRows];
        if (!nextRows[idx]) return prevRows;
        let cleanedValue = value;
        if (field === "movementType") {
          return prevRows;
        }
        if (
          [
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
        nextRows[idx] = { ...nextRows[idx], [field]: cleanedValue as any };
        return nextRows;
      });
    },
    [],
  );

  const updateFrequencyChar = useCallback(
    (rowIndex: number, dayIndex: number, char: string) => {
      setRows((prevRows) => {
        const nextRows = [...prevRows];
        if (!nextRows[rowIndex]) return prevRows;
        let freq = nextRows[rowIndex].frequency || "       ";
        if (freq.length < 7) freq = freq.padEnd(7, " ");
        const freqArray = freq.split("");
        freqArray[dayIndex] = char.substring(0, 1) || " ";
        nextRows[rowIndex].frequency = freqArray.join("");
        return nextRows;
      });
    },
    [],
  );

  // Keyboard Navigation Handler for the Manual Grid
  const handleGridKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number,
    totalCols: number,
  ) => {
    const { key } = e;
    const isArrow = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(key);

    if (!isArrow) return;

    // We only navigate if the cursor is at the start/end or if using Up/Down
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
        targetRow = Math.min(rows.length - 1, rowIdx + 1);
      if (key === "ArrowLeft") targetCol = Math.max(0, colIdx - 1);
      if (key === "ArrowRight") targetCol = Math.min(totalCols - 1, colIdx + 1);

      // Find input in the table using data attributes
      const targetInput = gridRef.current?.querySelector(
        `input[data-row="${targetRow}"][data-col="${targetCol}"]`,
      ) as HTMLInputElement;

      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewingRequest) {
          setViewingRequest(null);
        } else if (step > 1 && step < 7) {
          setStep((prev) => (prev > 1 ? prev - 1 : prev));
        }
        return;
      }

      const isManualStep = step === 2 && reqFormat === RequestFormat.MANUAL;
      if (!isManualStep) return;

      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        addRow();
      } else if (e.ctrlKey && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        removeLastRow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, reqFormat, viewingRequest, addRow, removeLastRow]);

  useEffect(() => {
    if (step === 2 && reqFormat === RequestFormat.MANUAL && rows.length === 0) {
      addRow();
    }
  }, [step, reqFormat, addRow, rows.length]);

  const renderOfficialManualForm = (target: any, isEditing: boolean) => {
    const header = isEditing ? headerData : target.manualData.header;
    const currentRows = isEditing ? rows : target.manualData.rows;
    const activeIsUtc = isEditing ? isUtc : target?.isUtc;
    const scheduleLabel = activeIsUtc ? "Horario UTC" : "Horario local";
    const frequencyLabel = activeIsUtc ? "Frecuencia UTC" : "Frecuencia local";
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
                  {airline.name}
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
                        setHeaderData({ ...headerData, date: e.target.value })
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
                        setHeaderData({
                          ...headerData,
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
                <td
                  className="border border-black p-0 align-middle"
                  colSpan={2}
                >
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
                                setHeaderData({
                                  ...headerData,
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
                                setHeaderData({
                                  ...headerData,
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
                <td
                  colSpan={4}
                  className="border border-black p-0"
                  style={{ height: "60px" }}
                >
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
                  <th
                    rowSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "90px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Tipo de Movimiento (N, C, R, D)
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "90px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Línea Aérea
                  </th>
                  <th
                    colSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "140px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    No. de vuelo
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "140px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Equipo de vuelo
                  </th>
                  <th
                    colSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "140px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    {scheduleLabel}
                  </th>
                  <th
                    colSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "160px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Ruta
                  </th>
                  <th
                    colSpan={7}
                    className="border border-black p-[5px]"
                    style={{
                      width: "220px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    {frequencyLabel}
                  </th>
                  <th
                    colSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "160px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    {validityLabel} (dd/mm/aa)
                  </th>
                  <th
                    colSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "120px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Tipo (J, F, C, H)
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black p-[5px] font-semibold text-blue-700"
                    style={{
                      width: "100px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    No. slot
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black p-[5px]"
                    style={{
                      width: "200px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Observaciones
                  </th>
                </tr>
                <tr
                  className="bg-slate-50/50 text-[15px] font-semibold border-b border-black"
                  style={{ minHeight: "44px" }}
                >
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "70px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Llegada
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "70px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Salida
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "70px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Llegada
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "70px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Salida
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "80px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Origen
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "80px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Destino
                  </th>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <th
                      key={d}
                      className="border border-black p-[5px]"
                      style={{
                        width: "31.428571px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        textAlign: "center",
                        border: "1px solid black",
                      }}
                    >
                      {d}
                    </th>
                  ))}
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "80px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Desde
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "80px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Hasta
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "60px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Llegada
                  </th>
                  <th
                    className="border border-black p-[5px]"
                    style={{
                      width: "60px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center",
                      border: "1px solid black",
                    }}
                  >
                    Salida
                  </th>
                </tr>
              </thead>
              <tbody>
                {(currentRows.length > 0 ? currentRows : [EMPTY_ROW]).map(
                  (row: ManualRow, idx: number) => {
                    const totalColsInGrid = 22;
                    const rowGroupClass =
                      reqType === RequestType.MODIFY && row.groupId
                        ? idx % 2 === 0
                          ? "bg-amber-50"
                          : "bg-amber-25"
                        : "";
                    const isPairFirstRow =
                      reqType === RequestType.MODIFY && idx % 2 === 0;
                    return (
                      <tr
                        key={row.id || idx}
                        className={`${rowGroupClass} border-b border-black/30 hover:bg-blue-50/10`}
                        style={{ minHeight: "36px", height: "36px" }}
                      >
                        <td
                          className="border border-black font-bold uppercase text-[14px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={0}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 0, totalColsInGrid)
                              }
                              className="w-full text-center outline-none bg-slate-100 px-1"
                              style={{
                                minHeight: "34px",
                                height: "34px",
                                padding: "0 4px",
                              }}
                              maxLength={1}
                              value={row.movementType}
                              disabled
                            />
                          ) : (
                            row.movementType
                          )}
                        </td>
                        <td
                          className="border border-black uppercase font-bold text-slate-800 bg-slate-50/10 text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={1}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 1, totalColsInGrid)
                              }
                              className="w-full text-center outline-none bg-transparent px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.airlineCode}
                              onChange={(e) =>
                                updateRow(idx, "airlineCode", e.target.value)
                              }
                            />
                          ) : (
                            row.airlineCode
                          )}
                        </td>
                        <td
                          className="border border-black text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={2}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 2, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.flightArr}
                              onChange={(e) =>
                                updateRow(idx, "flightArr", e.target.value)
                              }
                            />
                          ) : (
                            row.flightArr
                          )}
                        </td>
                        <td
                          className="border border-black text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={3}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 3, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.flightDep}
                              onChange={(e) =>
                                updateRow(idx, "flightDep", e.target.value)
                              }
                            />
                          ) : (
                            row.flightDep
                          )}
                        </td>
                        <td
                          className="border border-black uppercase text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={4}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 4, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.equipment}
                              onChange={(e) =>
                                updateRow(idx, "equipment", e.target.value)
                              }
                            />
                          ) : (
                            row.equipment
                          )}
                        </td>
                        <td
                          className="border border-black font-mono font-bold text-blue-900 text-[14px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={5}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 5, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.timeArr}
                              onChange={(e) =>
                                updateRow(idx, "timeArr", e.target.value)
                              }
                            />
                          ) : (
                            row.timeArr
                          )}
                        </td>
                        <td
                          className="border border-black font-mono font-bold text-blue-900 text-[14px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={6}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 6, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.timeDep}
                              onChange={(e) =>
                                updateRow(idx, "timeDep", e.target.value)
                              }
                            />
                          ) : (
                            row.timeDep
                          )}
                        </td>
                        <td
                          className="border border-black uppercase text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={7}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 7, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.origin}
                              onChange={(e) =>
                                updateRow(idx, "origin", e.target.value)
                              }
                            />
                          ) : (
                            row.origin
                          )}
                        </td>
                        <td
                          className="border border-black uppercase text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={8}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 8, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.destination}
                              onChange={(e) =>
                                updateRow(idx, "destination", e.target.value)
                              }
                            />
                          ) : (
                            row.destination
                          )}
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <td
                            key={d}
                            className="border border-black font-bold text-[15px]"
                            style={{
                              border: "1px solid black",
                              textAlign: "center",
                            }}
                          >
                            {isEditing ? (
                              <input
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
                                className="w-full text-center outline-none px-1"
                                style={{
                                  minHeight: "32px",
                                  height: "32px",
                                  padding: "0 4px",
                                }}
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
                        <td
                          className="border border-black text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={16}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 16, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.validityFrom}
                              onChange={(e) =>
                                updateRow(idx, "validityFrom", e.target.value)
                              }
                            />
                          ) : (
                            row.validityFrom
                          )}
                        </td>
                        <td
                          className="border border-black text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={17}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 17, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.validityTo}
                              onChange={(e) =>
                                updateRow(idx, "validityTo", e.target.value)
                              }
                            />
                          ) : (
                            row.validityTo
                          )}
                        </td>
                        <td
                          className="border border-black uppercase text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={18}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 18, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.typeArr}
                              onChange={(e) =>
                                updateRow(idx, "typeArr", e.target.value)
                              }
                            />
                          ) : (
                            row.typeArr
                          )}
                        </td>
                        <td
                          className="border border-black uppercase text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={19}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 19, totalColsInGrid)
                              }
                              className="w-full text-center outline-none px-1"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.typeDep}
                              onChange={(e) =>
                                updateRow(idx, "typeDep", e.target.value)
                              }
                            />
                          ) : (
                            row.typeDep
                          )}
                        </td>
                        <td
                          className="border border-black font-bold text-blue-700 bg-blue-50/20 text-[14px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={20}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 20, totalColsInGrid)
                              }
                              className="w-full text-center outline-none bg-transparent"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.slotNumber}
                              onChange={(e) =>
                                updateRow(idx, "slotNumber", e.target.value)
                              }
                            />
                          ) : (
                            row.slotNumber
                          )}
                        </td>
                        <td
                          className="border border-black text-left px-1 truncate text-[15px]"
                          style={{
                            border: "1px solid black",
                            textAlign: "center",
                          }}
                        >
                          {isPairFirstRow && reqType === RequestType.MODIFY ? (
                            <div className="mb-1 text-[10px] uppercase tracking-wide text-amber-700 font-bold">
                              Par de modificación
                            </div>
                          ) : null}
                          {isEditing ? (
                            <input
                              data-row={idx}
                              data-col={21}
                              onKeyDown={(e) =>
                                handleGridKeyDown(e, idx, 21, totalColsInGrid)
                              }
                              className="w-full outline-none"
                              style={{
                                minHeight: "32px",
                                height: "32px",
                                padding: "0 4px",
                              }}
                              value={row.observations}
                              onChange={(e) =>
                                updateRow(idx, "observations", e.target.value)
                              }
                            />
                          ) : (
                            row.observations
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isEditing && (
          <div className="flex p-4 space-x-6 border-x border-b border-black select-none bg-white">
            <button
              onClick={addRow}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[15px] uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar movimiento
            </button>
            <button
              onClick={removeLastRow}
              className="flex items-center px-5 py-2.5 bg-white border border-red-500 rounded-lg text-red-500 font-bold text-[15px] uppercase tracking-wider shadow-sm hover:bg-red-50 transition-colors"
            >
              <Minus className="w-4 h-4 mr-2" /> Quitar último
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 border border-black mt-1 text-[14px] font-bold h-52">
          <div className="border-r border-black p-4 flex flex-col bg-slate-50/20">
            <p className="uppercase tracking-tight opacity-70">
              Recibido por administrador del aeropuerto
            </p>
            <div className="mt-auto flex justify-between space-x-20 px-8 mb-4">
              <div className="flex-1 border-t border-black text-center pt-3">
                Nombre/Firma
              </div>
              <div className="flex-1 border-t border-black text-center pt-3">
                Fecha/Hora
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col text-right bg-slate-50/20">
            <p className="uppercase tracking-tight opacity-70">
              Visto bueno de la comandancia de la AFAC
            </p>
            <div className="mt-auto flex justify-between space-x-20 px-8 mb-4 text-left">
              <div className="flex-1 border-t border-black text-center pt-3">
                Nombre/Firma
              </div>
              <div className="flex-1 border-t border-black text-center pt-3">
                Fecha/Hora
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectionStep = () => (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-fade-in pt-12 select-none">
      <div className="text-center space-y-4">
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">
          Nueva Solicitud
        </h3>
        {currentBatch.length > 0 && (
          <div
            className="inline-flex items-center px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-700 font-bold text-xs animate-bounce cursor-pointer"
            onClick={() => setStep(3)}
          >
            <Package className="w-3 h-3 mr-2" /> {currentBatch.length}{" "}
            solicitudes en paquete - Clic para revisar
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          {
            type: RequestType.NEW,
            label: "Alta",
            icon: <Upload className="w-8 h-8" />,
            color: "blue",
          },
          {
            type: RequestType.MODIFY,
            label: "Modificación",
            icon: <FileText className="w-8 h-8" />,
            color: "orange",
          },
          {
            type: RequestType.CANCEL,
            label: "Cancelación",
            icon: <Trash2 className="w-8 h-8" />,
            color: "red",
          },
        ].map((item) => (
          <button
            key={item.type}
            onClick={() => {
              setReqType(item.type);
              setTimeTypeSelected(false);
              setReqFormat(null);
            }}
            className={`group h-[160px] bg-white border rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center space-y-4 ${reqType === item.type ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 hover:border-blue-300"}`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${item.type === RequestType.NEW ? "bg-blue-50 text-blue-500" : item.type === RequestType.MODIFY ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-700"} group-hover:scale-110 duration-200`}
            >
              {item.icon}
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {reqType && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="text-center">
            <h4 className="text-base font-medium text-slate-500">
              Seleccione el tipo de horario para {reqType}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <button
              onClick={() => {
                setIsUtc(true);
                setTimeTypeSelected(true);
                setReqFormat(null);
                setRows([]);
              }}
              className={`rounded-2xl shadow-md hover:shadow-xl transition-all border overflow-hidden text-left bg-white group/card ${timeTypeSelected && isUtc ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-200 hover:border-indigo-300"}`}
            >
              <div
                className={`p-4 border-b flex items-center space-x-3 transition-colors ${timeTypeSelected && isUtc ? "bg-indigo-100" : "bg-slate-50"}`}
              >
                <Globe className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800">Horario UTC</span>
              </div>
              <div className="p-5 min-h-[100px] flex items-center">
                <p className="text-sm text-slate-600">
                  Tiempo Universal Coordinado (estándar aeronáutico).
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                setIsUtc(false);
                setTimeTypeSelected(true);
                setReqFormat(null);
                setRows([]);
              }}
              className={`rounded-2xl shadow-md hover:shadow-xl transition-all border overflow-hidden text-left bg-white group/card ${timeTypeSelected && !isUtc ? "ring-2 ring-amber-500 border-amber-500" : "border-slate-200 hover:border-amber-300"}`}
            >
              <div
                className={`p-4 border-b flex items-center space-x-3 transition-colors ${timeTypeSelected && !isUtc ? "bg-amber-100" : "bg-amber-50"}`}
              >
                <MapPin className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-slate-800">Horario local</span>
              </div>
              <div className="p-5 min-h-[100px] flex items-center">
                <p className="text-sm text-slate-600">
                  Hora correspondiente a la ubicación del AIFA.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
      {reqType && timeTypeSelected && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="text-center">
            <h4 className="text-base font-medium text-slate-500">
              Seleccione el formato (Horario {isUtc ? "UTC" : "local"})
            </h4>
          </div>
          <div
            className={`grid grid-cols-1 ${isUtc ? "md:grid-cols-2" : "max-w-md mx-auto"} gap-8 max-w-3xl mx-auto`}
          >
            <button
              onClick={() => {
                setReqFormat(RequestFormat.MANUAL);
                setStep(2);
              }}
              className="rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200 overflow-hidden text-left bg-white group/card hover:border-emerald-300"
            >
              <div className="bg-emerald-50 p-4 border-b border-emerald-100 transition-colors">
                <span className="font-bold text-slate-800 flex items-center">
                  <FileText className="w-4 h-4 mr-2" /> Formato manual AIFA
                </span>
              </div>
              <div className="p-5 min-h-[100px] flex items-center">
                <p className="text-sm text-slate-600">
                  Formulario oficial idéntico al formato excel utilizado por el
                  Comité de Operación.
                </p>
              </div>
            </button>
            {isUtc && (
              <button
                onClick={() => {
                  setReqFormat(RequestFormat.SCR);
                  setStep(2);
                }}
                className="rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-200 overflow-hidden text-left bg-white group/card hover:border-violet-300"
              >
                <div className="bg-violet-50 p-4 border-b border-violet-100 transition-colors">
                  <span className="font-bold text-slate-800 flex items-center">
                    <Layers className="w-4 h-4 mr-2" /> Mensaje SCR (IATA)
                  </span>
                </div>
                <div className="p-5 min-h-[100px] flex items-center">
                  <p className="text-sm text-slate-600">
                    Carga masiva estándar mediante el formato de slot clearance
                    request.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderBatchListStep = () => (
    <div className="flex flex-col min-h-full">
      <div className="p-8 max-w-6xl mx-auto space-y-8 flex-1 w-full animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 select-none">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Package className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                Solicitudes en paquete
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Lista de movimientos acumulados para envío.
              </p>
            </div>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <span className="text-blue-700 font-bold text-sm uppercase tracking-wider">
              {currentBatch.length} documentos
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {currentBatch.map((req, idx) => (
            <div
              key={req.id || idx}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center space-x-5">
                <div
                  className={`p-3 rounded-lg ${req.requestFormat === RequestFormat.MANUAL ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}
                >
                  {req.requestFormat === RequestFormat.MANUAL ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <Layers className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${req.requestType === RequestType.NEW ? "bg-blue-50 text-blue-700 border-blue-200" : req.requestType === RequestType.MODIFY ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-red-50 text-red-700 border-red-200"}`}
                    >
                      {req.requestType}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {req.requestFormat}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {req.airlineLetter && (
                      <span className="text-[10px] uppercase tracking-widest bg-slate-100 text-slate-700 px-2 py-1 rounded-full border border-slate-200">
                        A: {req.airlineLetter}
                      </span>
                    )}
                    {req.adminLetter && (
                      <span className="text-[10px] uppercase tracking-widest bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                        R: {req.adminLetter}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mt-1 uppercase tracking-tight">
                    {req.flightArr || req.flightDep || "Solicitud SCR"}
                    {req.origin && (
                      <span className="text-slate-400 font-normal mx-2">
                        ({req.origin} → {req.destination})
                      </span>
                    )}
                  </h4>
                </div>
              </div>
              <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setViewingRequest(req as SlotRequest)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold uppercase tracking-tight"
                >
                  <Eye className="w-4 h-4" />
                  <span>Vista previa</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentBatch((prev) =>
                      prev.filter((r) => r.id !== req.id),
                    );
                    if (currentBatch.length === 1) setStep(1);
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-50 flex justify-between items-center select-none w-full">
        <button
          onClick={() => setStep(1)}
          className="flex items-center px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all text-xs tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" /> Agregar más
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs tracking-widest"
          >
            Cancelar todo
          </button>
          <button
            onClick={() => setStep(4)}
            disabled={currentBatch.length === 0}
            className="flex items-center px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 text-xs tracking-widest"
          >
            Confirmar y enviar paquete
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailedPreviewStep = () => (
    <div className="flex flex-col min-h-full">
      <div className="p-8 max-w-full mx-auto space-y-8 animate-fade-in flex-1 w-full">
        <div className="flex flex-col space-y-2 select-none">
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            Vista previa del paquete
          </h3>
          <p className="text-slate-500 font-medium">
            Contenido técnico exacto a ser transmitido.
          </p>
        </div>
        <div className="space-y-12">
          {currentBatch.map((req, idx) => (
            <div
              key={req.id || idx}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto"
            >
              <div className="flex items-center justify-between mb-4 px-2 select-none">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Documento {idx + 1} • {req.requestFormat} ({req.requestType})
                </span>
              </div>
              {req.requestFormat === RequestFormat.MANUAL ? (
                renderOfficialManualForm(req, false)
              ) : (
                <div className="bg-slate-900 rounded-xl p-8 shadow-2xl overflow-auto select-text font-mono text-emerald-400 whitespace-pre border border-black">
                  {req.scrContent}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-50 flex justify-between items-center select-none w-full">
        <button
          onClick={() => setStep(3)}
          className="flex items-center px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all text-xs tracking-widest"
        >
          Editar
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={() => setStep(5)}
            className="flex items-center px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg text-xs tracking-widest"
          >
            Confirmar y enviar por correo
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="p-8 max-w-2xl mx-auto space-y-8 animate-fade-in pt-12 select-none">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          ¡Solicitud enviada!
        </h3>
        <p className="text-slate-500 font-medium">
          El paquete de slots ha sido procesado y enviado a la coordinación del
          AIFA.
        </p>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-4 text-center">
        <p className="text-sm text-slate-600 uppercase tracking-wider font-bold">
          Folio de seguimiento
        </p>
        <p className="text-2xl font-black text-blue-600 font-mono">
          AIFA-{new Date().getFullYear()}-
          {Math.floor(Math.random() * 9000) + 1000}
        </p>
      </div>
      <button
        onClick={() =>
          onSuccess(
            `Se han enviado ${currentBatch.length} solicitudes correctamente.`,
          )
        }
        className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black transition-all shadow-xl uppercase text-sm tracking-widest flex items-center justify-center"
      >
        Finalizar y volver
      </button>
    </div>
  );

  const renderViewModal = () => {
    if (!viewingRequest) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded shadow-2xl w-full max-w-[1300px] max-h-[95vh] overflow-hidden flex flex-col select-text">
          <div className="px-6 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 select-none">
            <span className="text-sm font-bold text-slate-800 uppercase">
              Vista previa de solicitud
            </span>
            <button
              onClick={() => setViewingRequest(null)}
              className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 font-bold"
            >
              X
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-slate-200 select-text">
            {viewingRequest.requestFormat === RequestFormat.MANUAL ? (
              <div className="overflow-x-auto w-full">
                {renderOfficialManualForm(viewingRequest, false)}
              </div>
            ) : (
              <div className="bg-white rounded p-8 shadow-inner font-mono text-black text-sm h-full min-h-[400px] border border-slate-200 select-text overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {viewingRequest.scrContent || "Contenido no disponible."}
                </pre>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0 select-none">
            <button
              onClick={() => setViewingRequest(null)}
              className="px-8 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-bold transition-all shadow-md text-sm tracking-wider"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const addToBatchInternal = (goToStep: 1 | 3) => {
    if (!validateCurrentRequest()) {
      return;
    }
    const currentRequest = getPayload(RequestStatus.DRAFT);
    setCurrentBatch((prev) => [...prev, currentRequest]);
    setStep(goToStep);
    if (goToStep === 1) {
      setReqType(null);
      setReqFormat(null);
      setTimeTypeSelected(false);
      setRows([]);
      setScrContent("");
      setAirlineLetter("");
      setFormError(null);
    }
  };

  const validateCurrentRequest = (): boolean => {
    setFormError(null);
    if (!reqType || !reqFormat) {
      setFormError(
        "Seleccione el tipo de solicitud y formato antes de continuar.",
      );
      return false;
    }

    if (reqFormat === RequestFormat.SCR) {
      const currentLetter = airlineLetter.trim().toUpperCase();
      if (!currentLetter) {
        setFormError("Debe ingresar el código correspondiente a su solicitud.");
        return false;
      }
      if (!isValidAirlineLetter(currentLetter)) {
        setFormError(
          "La letra de la aerolínea no es válida para este tipo de solicitud.",
        );
        return false;
      }
      if (!scrContent.trim()) {
        setFormError("Debe ingresar el contenido SCR antes de continuar.");
        return false;
      }
    }

    if (reqFormat === RequestFormat.MANUAL) {
      const activeRows = rows.filter(
        (r) => r.flightArr || r.flightDep || r.movementType,
      );
      if (activeRows.length === 0) {
        setFormError(
          "Debe agregar al menos un movimiento con Tipo mov (N, C, R, D).",
        );
        return false;
      }
      const invalidRow = activeRows.find(
        (r) => !r.movementType || !isValidManualMovementType(r.movementType),
      );
      if (invalidRow) {
        setFormError(
          "Cada movimiento debe incluir Tipo mov válido: N, C, R o D.",
        );
        return false;
      }

      const requiredFields: (keyof ManualRow)[] = [
        "airlineCode",
        "flightArr",
        "flightDep",
        "equipment",
        "timeArr",
        "timeDep",
        "origin",
        "destination",
        "frequency",
        "validityFrom",
        "validityTo",
        "slotNumber",
      ];
      const incompleteRow = activeRows.find((row) =>
        requiredFields.some((field) => !row[field]?.trim()),
      );
      if (incompleteRow) {
        setFormError(
          "Cada movimiento debe completar los campos obligatorios de vuelo, horario, ruta y slot.",
        );
        return false;
      }

      if (reqType === RequestType.NEW) {
        const invalidNewRow = activeRows.find((r) => r.movementType !== "N");
        if (invalidNewRow) {
          setFormError("Para Alta, todos los movimientos deben ser tipo N.");
          return false;
        }
      }

      if (reqType === RequestType.CANCEL) {
        const invalidCancelRow = activeRows.find((r) => r.movementType !== "D");
        if (invalidCancelRow) {
          setFormError(
            "Para Cancelación, todos los movimientos deben ser tipo D.",
          );
          return false;
        }
      }

      if (reqType === RequestType.MODIFY) {
        const groups = activeRows.reduce<Record<string, ManualRow[]>>(
          (acc, row) => {
            if (!row.groupId) return acc;
            acc[row.groupId] = acc[row.groupId] || [];
            acc[row.groupId].push(row);
            return acc;
          },
          {},
        );

        const groupIds = Object.keys(groups);
        if (groupIds.length === 0) {
          setFormError(
            "Las modificaciones deben contener al menos un par de movimientos C + R.",
          );
          return false;
        }

        for (const groupId of groupIds) {
          const group = groups[groupId];
          if (group.length !== 2) {
            setFormError(
              "Cada grupo de modificación debe contener exactamente dos filas relacionadas.",
            );
            return false;
          }
          const hasC = group.some((r) => r.movementType === "C");
          const hasR = group.some((r) => r.movementType === "R");
          if (!hasC || !hasR) {
            setFormError(
              "Cada grupo de modificación debe tener un movimiento C y un movimiento R.",
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const getPayload = (status: RequestStatus): Partial<SlotRequest> => {
    if (reqFormat === RequestFormat.SCR) {
      return {
        id: `draft_${Math.random().toString(36).substr(2, 9)}`,
        airlineId: airline.id,
        requestType: reqType!,
        requestFormat: RequestFormat.SCR,
        isUtc: isUtc,
        airlineLetter: airlineLetter.trim().toUpperCase(),
        scrContent: scrContent,
        status,
        createdAt: new Date().toISOString(),
      };
    }

    const activeRows = rows.filter(
      (r) => r.flightArr || r.flightDep || r.movementType,
    );
    const firstRow = activeRows[0] || rows[0] || EMPTY_ROW;
    return {
      id: `draft_${Math.random().toString(36).substr(2, 9)}`,
      airlineId: airline.id,
      requestType: reqType!,
      requestFormat: RequestFormat.MANUAL,
      isUtc: isUtc,
      airlineLetter: firstRow.movementType || undefined,
      manualData: { header: { ...headerData }, rows: [...activeRows] },
      flightArr: firstRow.flightArr,
      flightDep: firstRow.flightDep,
      origin: firstRow.origin,
      destination: firstRow.destination,
      timeArr: firstRow.timeArr,
      timeDep: firstRow.timeDep,
      frequency: firstRow.frequency,
      validityFrom: firstRow.validityFrom,
      validityTo: firstRow.validityTo,
      slotNumber: firstRow.slotNumber,
      status,
      createdAt: new Date().toISOString(),
    };
  };

  const getFullBatchRawText = () =>
    currentBatch
      .map((req) => {
        if (req.requestFormat === RequestFormat.SCR)
          return req.scrContent || "";
        if (req.manualData) {
          const h = req.manualData.header;
          let text = `Solicitud de horarios (slots) - AIFA\nLínea aérea: ${airline.name} | Fecha: ${h.date}\nHorario: ${req.isUtc ? "UTC" : "local"}\n--------------------------------------------------------------------------------\nMov  L.A.  Vlo-A  Vlo-D  Eqp  Hor-A  Hor-D  Org  Des  Frec  Vig-ini  Vig-fin  Slot\n`;
          req.manualData.rows.forEach((r) => {
            text += `${(r.movementType || "").padEnd(4)} ${(r.airlineCode || "").padEnd(5)} ${(r.flightArr || "").padEnd(6)} ${(r.flightDep || "").padEnd(6)} ${(r.equipment || "").padEnd(4)} ${(r.timeArr || "").padEnd(6)} ${(r.timeDep || "").padEnd(6)} ${(r.origin || "").padEnd(4)} ${(r.destination || "").padEnd(4)} ${(r.frequency || "").padEnd(7)} ${(r.validityFrom || "").padEnd(8)} ${(r.validityTo || "").padEnd(8)} ${r.slotNumber || ""}\n`;
          });
          return text;
        }
        return "Sin contenido";
      })
      .join("\n\n");

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 overflow-x-hidden">
        {step === 1 && renderSelectionStep()}
        {step === 2 &&
          (reqFormat === RequestFormat.SCR ? (
            <div className="p-8 bg-white h-full flex flex-col animate-fade-in select-text">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col flex-1 select-text overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center select-none">
                  <h3 className="font-bold text-slate-800 flex items-center text-lg uppercase tracking-tight">
                    <Layers className="w-5 h-5 mr-3 text-purple-600" />{" "}
                    CONTENIDO SCR ({reqType?.toUpperCase()})
                  </h3>
                </div>
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        Letra de la aerolínea
                      </label>
                      <input
                        type="text"
                        maxLength={1}
                        value={airlineLetter}
                        onChange={(e) =>
                          setAirlineLetter(
                            e.target.value.toUpperCase().slice(0, 1),
                          )
                        }
                        placeholder="Ej. N"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <p className="text-xs text-slate-500">
                        Ingrese manualmente el código de letra asociado a la
                        solicitud. No se autogenera.
                      </p>
                    </div>
                  </div>
                </div>
                {formError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    {formError}
                  </div>
                )}
                <div className="p-0 flex-1 select-text">
                  <textarea
                    className="w-full h-full min-h-[600px] p-6 font-mono text-[15px] bg-white focus:outline-none resize-none"
                    value={scrContent}
                    placeholder="Pegue aquí el mensaje SCR estándar IATA..."
                    onChange={(e) => setScrContent(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 h-full flex flex-col overflow-auto select-text items-center">
              {formError && (
                <div className="w-full mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {formError}
                </div>
              )}
              <div className="w-full bg-white shadow-2xl border-x border-slate-200/50">
                {renderOfficialManualForm(null, true)}
              </div>
            </div>
          ))}
        {step === 3 && renderBatchListStep()}
        {step === 4 && renderDetailedPreviewStep()}
        {step === 5 && (
          <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in flex flex-col h-full">
            <div className="flex flex-col space-y-2 select-none flex-shrink-0">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                Enviar paquete por correo
              </h3>
              <p className="text-slate-500 font-medium">
                Configure los destinatarios y el formato del mensaje.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Para (To)
                    </label>
                    <input
                      type="text"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="destinatario1@dominio.com..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        CC
                      </label>
                      <input
                        type="text"
                        value={emailCc}
                        onChange={(e) => setEmailCc(e.target.value)}
                        placeholder="cc1@mail.com..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        BCC
                      </label>
                      <input
                        type="text"
                        value={emailBcc}
                        onChange={(e) => setEmailBcc(e.target.value)}
                        placeholder="bcc1@mail.com..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Asunto (Subject)
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${includeInBody ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`}
                      onClick={() => setIncludeInBody(!includeInBody)}
                    >
                      <Check
                        className={`w-4 h-4 text-white ${includeInBody ? "opacity-100" : "opacity-0"}`}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 tracking-tight">
                      Incluir en cuerpo del correo
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${attachAsFile ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`}
                      onClick={() => setAttachAsFile(!attachAsFile)}
                    >
                      <Check
                        className={`w-4 h-4 text-white ${attachAsFile ? "opacity-100" : "opacity-0"}`}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 tracking-tight">
                      Adjuntar como archivo (.txt)
                    </span>
                  </label>
                </div>
              </div>
              <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 flex flex-col shadow-inner">
                <div className="flex items-center space-x-2 text-slate-400 mb-4 select-none">
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Vista previa del correo
                  </span>
                </div>
                <div className="bg-white rounded-xl flex-1 shadow-sm p-6 overflow-auto font-mono text-[15px] leading-relaxed select-text min-h-[200px]">
                  {includeInBody ? (
                    getFullBatchRawText()
                  ) : (
                    <p className="text-slate-400 italic font-sans text-center mt-20 uppercase tracking-widest text-[10px]">
                      El cuerpo del mensaje no incluirá el texto de las
                      solicitudes.
                    </p>
                  )}
                  {attachAsFile && (
                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center text-blue-600 select-none font-bold tracking-tight text-[10px]">
                      <Paperclip className="w-4 h-4 mr-2" /> Adjunto:
                      solicitudes_paquete.txt
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 6 && (
          <div className="p-8 max-w-2xl mx-auto space-y-8 animate-fade-in pt-12 pb-32">
            <div className="text-center space-y-4 select-none">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Confirmación de envío
              </h3>
              <p className="text-slate-500">
                Revise los destinatarios antes de proceder con el envío final.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Para:
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {emailTo}
                  </span>
                </div>
                {emailCc && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      CC:
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {emailCc}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Asunto:
                  </span>
                  <span className="text-sm font-bold text-slate-800 italic">
                    {emailSubject}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                  Se enviarán{" "}
                  <span className="font-bold text-blue-600">
                    {currentBatch.length} solicitudes
                  </span>{" "}
                  acumuladas en el paquete sin ninguna alteración técnica.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black transition-all shadow-xl shadow-emerald-100 text-sm tracking-widest flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />{" "}
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-3" /> Enviar
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(5)}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 font-bold transition-all text-sm tracking-widest"
              >
                Volver
              </button>
            </div>
          </div>
        )}
        {step === 7 && renderSuccessStep()}
      </div>

      {step === 2 && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-50 flex justify-between items-center select-none w-full">
          <button
            onClick={() => setStep(1)}
            className="flex items-center px-5 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => addToBatchInternal(1)}
              className="flex items-center px-6 py-2 bg-white border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 font-bold shadow-sm text-xs tracking-widest transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Añadir otro movimiento
            </button>
            <button
              onClick={() => addToBatchInternal(3)}
              className="flex items-center px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-100 text-xs tracking-widest transition-all active:scale-95"
            >
              Añadir al paquete y revisar{" "}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-50 flex justify-between items-center select-none w-full">
          <button
            onClick={() => setStep(4)}
            className="flex items-center px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-xs tracking-widest"
          >
            Volver
          </button>
          <button
            onClick={() => setStep(6)}
            disabled={!emailTo}
            className="flex items-center px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg text-xs tracking-widest disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {renderViewModal()}
    </div>
  );
};
