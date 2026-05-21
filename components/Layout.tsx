import React from "react";
import { User, Airline, ViewType } from "../types";
import {
  LogOut as LogOutIcon,
  LayoutDashboard as DashboardIcon,
  PlusCircle as PlusIcon,
  Plane as PlaneIcon,
  User as UserLogo,
  History as HistoryIcon,
  CalendarDays as CalendarIcon,
  Inbox as InboxIcon,
  BarChart2 as StatsIcon,
  Settings as SettingsIcon,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  airline: Airline;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  airline,
  currentView,
  onNavigate,
  onLogout,
  isCollapsed = false,
}) => {
  const isAdmin = user.role === "admin";

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isCollapsed ? "w-20" : "w-64"} bg-slate-900 text-white flex flex-col shadow-xl z-20 shrink-0 select-none transition-all duration-300 ease-in-out`}
      >
        <div
          className={`p-6 flex items-center border-b border-slate-800 ${isCollapsed ? "justify-center px-2" : "space-x-3"}`}
        >
          <div className="bg-white p-1 rounded-full h-10 w-10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            <img
              src={airline.logoUrl}
              alt={airline.name}
              className="h-8 w-8 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-fade-in">
              <h1 className="font-bold text-lg leading-tight truncate">
                {isAdmin ? "AIFA Admin" : airline.name}
              </h1>
              <p className="text-xs text-slate-400">
                {isAdmin ? "Control de Slots" : `${airline.iataCode} Ops`}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {/* Vistas comunes o específicas */}
          {isAdmin ? (
            <>
              <button
                onClick={() => onNavigate("status")}
                className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  currentView === "status"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <InboxIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && (
                  <span className="font-medium animate-fade-in">
                    Bandeja de Entrada
                  </span>
                )}
              </button>
              <button
                onClick={() => onNavigate("scheduled")}
                className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  currentView === "scheduled"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <CalendarIcon
                  className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium animate-fade-in">
                    Programados
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("scheduled")}
                className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  currentView === "scheduled"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <CalendarIcon
                  className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium animate-fade-in">
                    Programados
                  </span>
                )}
              </button>
              <button
                onClick={() => onNavigate("new-request")}
                className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  currentView === "new-request"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <PlusIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && (
                  <span className="font-medium animate-fade-in">
                    Nueva Solicitud
                  </span>
                )}
              </button>
              <button
                onClick={() => onNavigate("status")}
                className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                  currentView === "status"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <DashboardIcon
                  className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium animate-fade-in">Estatus</span>
                )}
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate("history")}
            className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
              currentView === "history"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <HistoryIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && (
              <span className="font-medium animate-fade-in">Historial</span>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={() => onNavigate("stats")}
              className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                currentView === "stats"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <StatsIcon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
              {!isCollapsed && (
                <span className="font-medium animate-fade-in">
                  Estadísticas
                </span>
              )}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onNavigate("settings")}
              className={`flex items-center w-full py-3 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                currentView === "settings"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <SettingsIcon
                className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`}
              />
              {!isCollapsed && (
                <span className="font-medium animate-fade-in">
                  Configuración
                </span>
              )}
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div
            className={`flex items-center mb-4 ${isCollapsed ? "justify-center px-0" : "px-2"}`}
          >
            <UserLogo className="h-8 w-8 text-slate-400 bg-slate-800 p-1 rounded-full shrink-0" />
            {!isCollapsed && (
              <div className="overflow-hidden ml-3 animate-fade-in">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.role === "admin" ? "Administrador" : "Aerolínea"}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={`flex items-center w-full py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors ${isCollapsed ? "justify-center px-0" : "justify-start px-4"}`}
          >
            <LogOutIcon className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
            {!isCollapsed && (
              <span className="animate-fade-in">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-white select-text">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0 border-b border-slate-200 select-none">
          <h2 className="text-xl font-semibold text-slate-800">
            {isAdmin && currentView === "status"
              ? "Bandeja de Entrada de Solicitudes"
              : currentView === "status"
                ? "Estatus de Solicitudes"
                : currentView === "history"
                  ? "Historial Global"
                  : currentView === "scheduled"
                    ? "Vuelos Programados"
                    : currentView === "stats"
                      ? "Estadísticas de Solicitudes"
                      : currentView === "settings"
                        ? "Configuración de Notificaciones"
                      : "Nueva Solicitud"}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Sistema Operativo AIFA
            </span>
          </div>
        </header>
        <div className="flex-1 relative">{children}</div>
      </main>
    </div>
  );
};
