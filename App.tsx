import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./components/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { NewRequest } from "./components/NewRequest";
import { HistoryView } from "./components/History";
import { Stats } from "./components/Stats";
import { ScheduledView } from "./components/Scheduled";
import { SettingsView } from "./components/Settings";
import { User, Airline, AuthState, ViewType } from "./types";
import { ToastContainer, ToastMessage, ToastType } from "./components/Toast";

interface ProtectedRouteProps {
  user: User | null;
  airline: Airline | null;
  children: React.ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  airline,
  children,
  currentView,
  onNavigate,
  onLogout,
  isSidebarCollapsed,
}) => {
  if (!user || !airline) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout
      user={user}
      airline={airline}
      currentView={currentView}
      onNavigate={onNavigate}
      onLogout={onLogout}
      isCollapsed={isSidebarCollapsed}
    >
      {children}
    </Layout>
  );
};

// Main App Component acting as the controller
const App = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    airline: null,
    isLoading: false,
    error: null,
  });

  const [currentView, setCurrentView] = useState<ViewType>("scheduled");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Adjust initial view based on role after login
  useEffect(() => {
    if (auth.user) {
      if (auth.user.role === "admin") {
        setCurrentView("status");
      } else {
        setCurrentView("scheduled");
      }
    }
  }, [auth.user]);

  const addToast = (type: ToastType, title: string, message: string): void => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (user: User, airline: Airline) => {
    setAuth({
      user,
      airline,
      isLoading: false,
      error: null,
    });
  };

  const handleLogout = () => {
    setAuth({
      user: null,
      airline: null,
      isLoading: false,
      error: null,
    });
    setSidebarCollapsed(false);
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    // Reset sidebar when manually navigating to other sections
    if (view !== "new-request") {
      setSidebarCollapsed(false);
    }
  };

  const renderCurrentView = () => {
    if (!auth.user || !auth.airline) return null;

    switch (currentView) {
      case "scheduled":
        return <ScheduledView airline={auth.airline} />;
      case "status":
        return (
          <Dashboard
            airline={auth.airline}
            user={auth.user}
            onShowToast={(type, title, message) =>
              addToast(type, title, message)
            }
          />
        );
      case "new-request":
        return (
          <NewRequest
            airline={auth.airline}
            onToggleSidebar={setSidebarCollapsed}
            onSuccess={(message) => {
              setCurrentView("history"); // Redirigir al historial para ver la nueva solicitud
              setSidebarCollapsed(false);
              addToast(
                "success",
                "Solicitud creada",
                message || "La solicitud ha sido registrada exitosamente.",
              );
            }}
            onCancel={() => {
              setCurrentView("status");
              setSidebarCollapsed(false);
              addToast("info", "Cancelado", "Creación de solicitud cancelada.");
            }}
          />
        );
      case "history":
        return <HistoryView airline={auth.airline} user={auth.user} />;
      case "stats":
        return <Stats airline={auth.airline} user={auth.user} />;
      case "settings":
        return (
          <SettingsView
            airline={auth.airline}
            onShowToast={(type, title, message) =>
              addToast(type, title, message)
            }
          />
        );
      default:
        return (
          <Dashboard
            airline={auth.airline}
            user={auth.user}
            onShowToast={(type, title, message) =>
              addToast(type, title, message)
            }
          />
        );
    }
  };

  return (
    <HashRouter>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Routes>
        <Route
          path="/"
          element={
            !auth.user ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              user={auth.user}
              airline={auth.airline}
              currentView={currentView}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              isSidebarCollapsed={sidebarCollapsed}
            >
              {renderCurrentView()}
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
