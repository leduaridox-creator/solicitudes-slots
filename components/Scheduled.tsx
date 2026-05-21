import React, { useState } from 'react';
import { Airline, ScheduledFlight } from '../types';
import { Clock, PlaneLanding, PlaneTakeoff, Search, Timer, CheckCircle } from 'lucide-react';

interface ScheduledProps {
  airline: Airline;
}

// Extendemos la interfaz localmente para soportar la ruta personalizada
interface ExtendedScheduledFlight extends ScheduledFlight {
  isArrival: boolean;
}

export const ScheduledView: React.FC<ScheduledProps> = ({ airline }) => {
  // Datos operacionales simplificados con la lógica de Origen -> NLU o NLU -> Destino
  const [scheduledFlights] = useState<ExtendedScheduledFlight[]>([
    { id: '1', flightNumber: '6403', origin: 'MAD', destination: 'MEX', isArrival: true, scheduledTime: '18:00', actualTime: '18:12', status: 'Landed' },
    { id: '2', flightNumber: '3402', origin: 'CUN', destination: 'GDL', isArrival: true, scheduledTime: '14:20', actualTime: '14:20', status: 'On Time' },
    { id: '3', flightNumber: '1288', origin: 'MEX', destination: 'BCN', isArrival: false, scheduledTime: '22:15', actualTime: '22:45', status: 'Delayed' },
    { id: '4', flightNumber: '0991', origin: 'MEX', destination: 'JFK', isArrival: false, scheduledTime: '09:30', actualTime: '09:30', status: 'Boarding' },
    { id: '5', flightNumber: '1120', origin: 'MID', destination: 'MEX', isArrival: true, scheduledTime: '07:45', actualTime: '07:45', status: 'On Time' },
    { id: '6', flightNumber: '5521', origin: 'CUN', destination: 'MTY', isArrival: false, scheduledTime: '11:10', actualTime: '11:15', status: 'On Time' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'ARR' | 'DEP'>('ALL');

  const filtered = scheduledFlights.filter(f => {
    const flightFullCode = `${airline.iataCode}${f.flightNumber}`;
    const searchString = `${flightFullCode} ${f.origin} ${f.destination}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    if (movementFilter === 'ARR') return matchesSearch && f.isArrival;
    if (movementFilter === 'DEP') return matchesSearch && !f.isArrival;
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in select-text">
      <div className="flex flex-col space-y-2 select-none">
        <h3 className="text-2xl font-bold text-slate-800">Vuelos Programados</h3>
        <p className="text-slate-500">Horario operativo en tiempo real para {airline.name} vía AIFA (NLU).</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 select-none">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setMovementFilter('ALL')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              movementFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setMovementFilter('ARR')}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              movementFilter === 'ARR'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlaneLanding className="w-4 h-4 mr-2" />
            Llegada
          </button>
          <button
            onClick={() => setMovementFilter('DEP')}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              movementFilter === 'DEP'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlaneTakeoff className="w-4 h-4 mr-2" />
            Salida
          </button>
        </div>

        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Buscar por vuelo, ruta o ciudad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 select-text">
          <thead className="bg-slate-50 select-none">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vuelo</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Ruta</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hora Programada</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hora Real</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Diferencia</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 select-text">
            {filtered.length > 0 ? (
              filtered.map((flight) => {
                const [hS, mS] = flight.scheduledTime.split(':').map(Number);
                const [hA, mA] = flight.actualTime.split(':').map(Number);
                const diff = (hA * 60 + mA) - (hS * 60 + mS);
                
                // Formateo de ruta solicitado: MAD → NLU o NLU → GDL
                const routeFormatted = flight.isArrival 
                  ? `${flight.origin} → NLU` 
                  : `NLU → ${flight.destination}`;
                
                return (
                  <tr key={flight.id} className="hover:bg-slate-50 transition-colors select-text">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-lg mr-3 bg-white border border-slate-100 shadow-sm flex items-center justify-center w-10 h-10 select-none overflow-hidden shrink-0">
                           <img 
                              src={airline.logoUrl} 
                              alt={airline.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=AIR';
                              }}
                           />
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tighter">
                          {airline.iataCode}{flight.flightNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-black tracking-widest uppercase text-center">
                      {routeFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 text-center">
                      {flight.scheduledTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center text-sm font-bold text-blue-600 font-mono">
                        <Timer className="w-3.5 h-3.5 mr-1.5 select-none" />
                        {flight.actualTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {diff === 0 ? (
                        <span className="text-slate-400 italic">En tiempo</span>
                      ) : (
                        <span className={`font-bold ${diff > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {diff > 0 ? `+${diff} min` : `${diff} min`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap select-none">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        flight.status === 'On Time' ? 'bg-green-100 text-green-700' :
                        flight.status === 'Delayed' ? 'bg-orange-100 text-orange-700' :
                        flight.status === 'Landed' ? 'bg-slate-100 text-slate-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {flight.status === 'On Time' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {flight.status === 'Delayed' && <Clock className="w-3 h-3 mr-1" />}
                        {flight.status === 'Landed' && <PlaneLanding className="w-3 h-3 mr-1" />}
                        {flight.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 select-none">
                  No hay resultados que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};