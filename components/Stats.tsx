import React, { useEffect, useState } from "react";
import { SlotRequest, RequestStatus, Airline, User } from "../types";
import { mockSupabase } from "../services/mockSupabase";
import { CalendarDays, Clock, CheckCircle, Inbox, Loader2 } from "lucide-react";

interface StatsProps {
  airline: Airline;
  user: User;
}

export const Stats: React.FC<StatsProps> = ({ airline, user }) => {
  const [requests, setRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"weekly" | "monthly">("weekly");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = isAdmin
        ? await mockSupabase.db.getRequestsAll()
        : await mockSupabase.db.getRequests(airline.id);
      setRequests(data);
      setLoading(false);
    };
    load();
  }, [airline.id, isAdmin]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = requests.filter((r) =>
    r.createdAt?.startsWith(todayStr),
  ).length;
  const pendingCount = requests.filter(
    (r) => r.status === RequestStatus.PENDING,
  ).length;
  const approvedCount = requests.filter(
    (r) => r.status === RequestStatus.APPROVED,
  ).length;
  const rejectedCount = requests.filter(
    (r) => r.status === RequestStatus.REJECTED,
  ).length;

  const buildChartData = (days: number) => {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split("T")[0];
      const isToday = dateStr === todayStr;
      let label = "";
      if (days === 7) {
        label = isToday
          ? "Hoy"
          : d.toLocaleDateString("es-MX", { weekday: "short" });
      } else {
        if (i === 0 || i === days - 1 || i % 6 === 0) {
          label = d.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
          });
        }
        if (isToday) label = "Hoy";
      }
      const count = requests.filter((r) =>
        r.createdAt?.startsWith(dateStr),
      ).length;
      return { dateStr, label, count, isToday };
    });
  };

  const chartData =
    chartMode === "weekly" ? buildChartData(7) : buildChartData(30);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-slate-500 text-sm font-medium">
          Cargando estadísticas...
        </span>
      </div>
    );
  }

  const statusRows = [
    {
      label: "Pendientes",
      count: pendingCount,
      barClass: "bg-amber-400",
      textClass: "text-amber-600",
      pctClass: "text-amber-400",
    },
    {
      label: "Aprobadas",
      count: approvedCount,
      barClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      pctClass: "text-emerald-400",
    },
    {
      label: "Rechazadas",
      count: rejectedCount,
      barClass: "bg-rose-500",
      textClass: "text-rose-600",
      pctClass: "text-rose-400",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 animate-fade-in">
      {/* Header */}
      <div className="space-y-1 select-none">
        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
          Estadísticas de Solicitudes
        </h3>
        <p className="text-sm text-slate-500 font-medium">
          Conteo y visualización de solicitudes recibidas por período.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Hoy
            </p>
          </div>
          <p className="text-4xl font-black text-blue-600">{todayCount}</p>
          <p className="text-xs text-blue-400 mt-1 font-medium">
            solicitudes recibidas
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
              <Inbox className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Total
            </p>
          </div>
          <p className="text-4xl font-black text-slate-800">
            {requests.length}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            historial completo
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/60 to-white rounded-2xl p-6 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Pendientes
            </p>
          </div>
          <p className="text-4xl font-black text-amber-500">{pendingCount}</p>
          <p className="text-xs text-amber-400 mt-1 font-medium">
            en espera de revisión
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/60 to-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Aprobadas
            </p>
          </div>
          <p className="text-4xl font-black text-emerald-500">
            {approvedCount}
          </p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            solicitudes aprobadas
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200/60 p-8 select-none">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="font-bold text-slate-800 text-base">
              Solicitudes por día
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribución temporal de solicitudes recibidas
            </p>
          </div>
          <div className="flex bg-slate-100/50 border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setChartMode("weekly")}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                chartMode === "weekly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-white/80"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setChartMode("monthly")}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                chartMode === "monthly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-white/80"
              }`}
            >
              Mensual
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Y axis */}
          <div
            className="flex flex-col justify-between text-right pr-1 shrink-0"
            style={{ height: "192px" }}
          >
            {Array.from({ length: 5 }, (_, i) =>
              Math.round(maxCount * (1 - i / 4)),
            ).map((v, i) => (
              <span key={i} className="text-[10px] text-slate-300 font-medium">
                {v}
              </span>
            ))}
          </div>

          {/* Bars + grid */}
          <div className="flex-1 relative">
            {/* Horizontal grid lines */}
            <div
              className="absolute inset-0 flex flex-col justify-between pointer-events-none"
              style={{ height: "192px" }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-t border-slate-100" />
              ))}
            </div>

            <div className="flex items-end gap-0.5" style={{ height: "192px" }}>
              {chartData.map((day, i) => {
                const heightPct =
                  day.count > 0 ? Math.max((day.count / maxCount) * 100, 5) : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center group cursor-default"
                    title={`${day.dateStr}: ${day.count} solicitud${day.count !== 1 ? "es" : ""}`}
                  >
                    <div
                      className="w-full flex flex-col justify-end items-center"
                      style={{ height: "180px" }}
                    >
                      {day.count > 0 && (
                        <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count}
                        </span>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          day.isToday
                            ? "bg-blue-600 shadow-lg shadow-blue-200"
                            : day.count > 0
                              ? "bg-blue-200 group-hover:bg-blue-400"
                              : "bg-slate-100"
                        }`}
                        style={{
                          height: day.count > 0 ? `${heightPct}%` : "3px",
                        }}
                      />
                    </div>
                    {day.label && (
                      <span
                        className={`text-[9px] text-center font-medium mt-1.5 leading-tight ${
                          day.isToday
                            ? "text-blue-600 font-black"
                            : "text-slate-400"
                        }`}
                      >
                        {day.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-5 mt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-600" />
            <span className="text-[10px] text-slate-500 font-medium">Hoy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-200" />
            <span className="text-[10px] text-slate-500 font-medium">
              Días anteriores
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
            <span className="text-[10px] text-slate-500 font-medium">
              Sin solicitudes
            </span>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        {statusRows.map(({ label, count, barClass, textClass, pctClass }) => {
          const pct =
            requests.length > 0
              ? Math.round((count / requests.length) * 100)
              : 0;
          return (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">
                  {label}
                </span>
                <span className={`text-2xl font-black ${textClass}`}>
                  {count}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barClass} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`text-xs font-bold mt-2 ${pctClass}`}>
                {pct}% del total
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
