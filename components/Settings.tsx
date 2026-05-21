import React, { useEffect, useState } from "react";
import { Airline, NotificationSettings } from "../types";
import { mockSupabase } from "../services/mockSupabase";
import { Loader2, Mail, RotateCcw, Save } from "lucide-react";

interface SettingsProps {
  airline: Airline;
  onShowToast?: (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  airline,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const current = await mockSupabase.db.getNotificationSettings();
        setSettings(current);
      } catch (error) {
        onShowToast?.(
          "error",
          "Configuración",
          "No se pudo cargar la configuración de correos.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [onShowToast]);

  const updateProfile = (
    key: keyof NotificationSettings,
    field: "cc",
    value: string,
  ) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [key]: {
              ...prev[key],
              [field]: value,
            },
          }
        : prev,
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await mockSupabase.db.saveNotificationSettings(settings);
      setSettings(saved);
      onShowToast?.(
        "success",
        "Configuración guardada",
        "Los correos por defecto quedaron actualizados.",
      );
    } catch (error) {
      onShowToast?.(
        "error",
        "Configuración",
        "No se pudo guardar la configuración de correos.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = mockSupabase.db.getDefaultNotificationSettings();
    setSettings(defaults);
    onShowToast?.(
      "info",
      "Configuración restablecida",
      "Se cargaron los destinatarios sugeridos por defecto.",
    );
  };

  const renderProfileCard = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
  ) => {
    if (!settings) return null;
    const profile = settings[key];

    return (
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Cc
            </label>
            <input
              type="text"
              value={profile.cc}
              onChange={(e) => updateProfile(key, "cc", e.target.value)}
              placeholder="correo1@dominio.com, correo2@dominio.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              Estos correos se reflejan como copia por defecto en nuevas
              solicitudes de aerolíneas y en las respuestas del administrador.
            </p>
          </div>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex items-center text-slate-500 font-medium">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Cargando
          configuración...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-8 space-y-8">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
            <Mail className="w-4 h-4 mr-2" /> Notificaciones por correo
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Configuración global de avisos
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Defina los destinatarios por defecto para el envío de nuevas
            solicitudes desde las aerolíneas y para las respuestas emitidas por
            la administración del aeropuerto.
          </p>
          <p className="mt-3 text-xs text-slate-500 uppercase tracking-widest font-bold">
            Perfil activo: {airline.name}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-5 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Restaurar sugeridos
          </button>
          <button
            onClick={handleSave}
            disabled={!settings || saving}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Guardar configuración
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {renderProfileCard(
          "submissionDefaults",
          "Nuevas solicitudes de aerolíneas",
          "Estos destinatarios se precargan en el paso de envío cuando una aerolínea arma un paquete de solicitudes.",
        )}
        {renderProfileCard(
          "adminResponseDefaults",
          "Respuesta del administrador",
          "Estos destinatarios se usarán para preparar el correo cuando la administración apruebe o rechace una solicitud.",
        )}
      </div>
    </div>
  );
};