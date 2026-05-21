
import React, { useState } from 'react';
import { mockSupabase } from '../services/mockSupabase';
import { Plane, Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, airline: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, airline, error: authError } = await mockSupabase.auth.signIn(email);

      if (authError || !user) {
        setError(authError || 'Error de autenticación');
        setLoading(false);
        return;
      }
      
      onLoginSuccess(user, airline);
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900"></div>
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 shadow-2xl bg-slate-950/95 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
          <div className="relative hidden md:block bg-slate-800">
            <div className="absolute inset-0 bg-slate-950/65"></div>
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <span className="inline-flex rounded-full bg-sky-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Acceso seguro AIFA
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">
                Bienvenido al sistema de coordinación de vuelos
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                Controla slots, demoras y solicitudes con un panel centralizado diseñado para operadores aéreos y personal de gestión.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-200 shadow-sm shadow-slate-900/20">
                  <Plane className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Plataforma AIFA
                  </p>
                  <h1 className="text-3xl font-semibold text-white">Inicio de Sesión</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Ingresa con tu correo institucional para acceder al panel de coordinación y seguimiento operativo.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-12 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    placeholder="usuario@aerolinea.com"
                  />
                </div>
                <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                  <p className="font-semibold uppercase tracking-[0.24em] text-slate-500">Credenciales demo</p>
                  <p>● Aerolínea: juan@iberia.com</p>
                  <p>● Administrador AIFA: admin@aifa.aero</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-12 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70 ${loading ? 'opacity-80' : ''}`}
              >
                {loading ? 'Autenticando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs uppercase tracking-[0.24em] text-slate-600">
              &copy; 2024 AIFA | Coordinación de Horarios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
