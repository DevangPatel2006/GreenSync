import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { mapBackendError } from '../utils/errorMapper';

export default function AdminGridDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [forecastSlots, setForecastSlots] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminRes, forecastRes] = await Promise.allSettled([
        api.get('/impact/admin'),
        api.get('/energy/forecast?hours=8'),
      ]);

      if (adminRes.status === 'fulfilled') {
        const data = adminRes.value?.data || adminRes.value;
        if (data && typeof data === 'object') {
          setAdminMetrics({
            totalFlexibleLoad: Number(data.totalFlexibleLoad) || 0,
            totalEnergyShifted: Number(data.totalEnergyShifted) || 0,
            avgRenewableUtilization: Number(data.avgRenewableUtilization) || 0,
            totalPeakReduction: Number(data.totalPeakReduction) || 0,
            activeUserCount: Number(data.activeUserCount) || 0,
            totalFlexCoinsIssued: Number(data.totalFlexCoinsIssued) || 0,
          });
        }
      } else {
        const err = adminRes.reason;
        if (err?.response?.status === 403) {
          setError('Access denied: Administrator privileges required.');
        } else {
          setError(mapBackendError(err) || 'Failed to load grid administrative metrics.');
        }
      }

      if (forecastRes.status === 'fulfilled') {
        const points = Array.isArray(forecastRes.value) ? forecastRes.value : (forecastRes.value?.forecast || []);
        const slots = points.slice(0, 8).map((pt) => {
          const d = pt.timestamp ? new Date(pt.timestamp) : new Date();
          const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          return {
            time,
            solar: Math.min(100, Math.max(0, Math.round(pt.renewableAvailability ?? 0))),
            load: Math.min(100, Math.max(0, Math.round(pt.gridDemand ?? 0))),
          };
        });
        setForecastSlots(slots);
      }
    } catch (err) {
      setError(mapBackendError(err) || 'Telemetry retrieval failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  // Guard: if non-admin, redirect to /dashboard
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Header Pattern copied from Dashboard.jsx */}
      <div className="flex flex-wrap items-center justify-between pb-space-lg border-b border-surface-variant gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Grid Operator Console</span>
            <span>•</span>
            <span className="text-secondary font-title-sm">System-Wide Coordination</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container mt-0.5 tracking-tight">
            Regional Grid &amp; Flexibility Dispatch
          </h1>
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed text-label-sm font-label-sm">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Simulated Aggregate Telemetry
          </div>
          <button
            onClick={() => {
              fetchAdminData();
              showToast('System telemetry refreshed.');
            }}
            className="px-3 py-1.5 rounded-lg border border-surface-variant hover:bg-surface-container text-on-surface text-label-md font-label-md flex items-center gap-1 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Section 6 & 7 Honesty Disclosure Banner */}
      <div className="mb-space-lg p-space-md rounded-xl bg-surface-container border border-surface-variant flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">verified</span>
        <div>
          <span className="font-label-md text-label-md text-on-surface font-semibold block">
            Simulated Aggregate System Impact (Section 6 &amp; 7 Compliance)
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Data aggregated across all connected nodes represents modeled grid demand shifting. Calculations are based on regional hourly ISO emissions intensity indices and simulated residential/commercial telemetry.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col gap-space-lg w-full animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="h-32 bg-surface-container-high rounded-xl"></div>
            <div className="h-32 bg-surface-container-high rounded-xl"></div>
            <div className="h-32 bg-surface-container-high rounded-xl"></div>
            <div className="h-32 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="h-80 bg-surface-container-high rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="mb-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container flex items-start justify-between border border-error/20">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold">Telemetry Retrieval Failed</h4>
              <p className="font-body-sm text-body-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-space-md py-1.5 rounded bg-error text-on-error font-label-md text-label-md hover:opacity-90"
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-space-xl">
          {/* KPI Metric Bento Grid (copied pattern from Dashboard.jsx) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* KPI 1: Total Flexible Load */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Total Flexible Capacity
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {adminMetrics.totalFlexibleLoad} <span className="text-title-md font-normal text-on-surface-variant">kW</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="font-semibold text-secondary">Active Dispatch</span> across {adminMetrics.activeUserCount} nodes
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full"
                    style={{
                      width: `${adminMetrics.totalFlexibleLoad > 0 ? Math.min(100, Math.round((adminMetrics.totalFlexibleLoad / 50) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Shifted Energy */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Total Energy Shifted
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {adminMetrics.totalEnergyShifted} <span className="text-title-md font-normal text-on-surface-variant">kWh</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="font-semibold text-secondary">
                    {adminMetrics.totalEnergyShifted > 0 ? `+${adminMetrics.totalEnergyShifted.toFixed(1)} kWh` : '0.0 kWh'}
                  </span> shifted to clean hours
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{
                      width: `${adminMetrics.totalEnergyShifted > 0 ? Math.min(100, Math.round((adminMetrics.totalEnergyShifted / 100) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* KPI 3: Renewable Utilization */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Avg Renewable Match
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {adminMetrics.avgRenewableUtilization}%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Solar &amp; Wind curtailment captured
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(adminMetrics.avgRenewableUtilization, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 4: Peak Reduction */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Peak Reduction
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">offline_bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {adminMetrics.totalPeakReduction} <span className="text-title-md font-normal text-on-surface-variant">kW</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Peaker generation avoided in peak hours
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full"
                    style={{
                      width: `${adminMetrics.totalPeakReduction > 0 ? Math.min(100, Math.round((adminMetrics.totalPeakReduction / 50) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Dispatch & Curtailment Control (2 Column Grid matching Dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Left 8 Cols: Aggregate Fleet Telemetry */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
                <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md pb-space-sm border-b border-surface-variant">
                  <div>
                    <h3 className="font-title-md text-title-md text-primary-container">
                      Aggregate Regional Demand Shifting (Hourly Model)
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Real-time versus shifted flexibility curve across participating ISO nodes.
                    </p>
                  </div>
                  <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                      <span>Solar Generation (MW)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                      <span>Dispatched Load (kW)</span>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <div className="min-w-[500px]">
                    <div className="grid grid-cols-8 gap-4 items-end h-48 pt-6 border-b border-surface-variant px-2">
                      {(forecastSlots.length > 0 ? forecastSlots : [
                        { time: '08:00', solar: 0, load: 0 },
                        { time: '10:00', solar: 0, load: 0 },
                        { time: '12:00', solar: 0, load: 0 },
                        { time: '14:00', solar: 0, load: 0 },
                        { time: '16:00', solar: 0, load: 0 },
                        { time: '18:00', solar: 0, load: 0 },
                        { time: '20:00', solar: 0, load: 0 },
                        { time: '22:00', solar: 0, load: 0 },
                      ]).map((slot, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                          <div className="flex items-end gap-1.5 w-full justify-center h-full">
                            <div
                              className="w-4 bg-secondary rounded-t"
                              style={{ height: `${slot.solar}%` }}
                              title={`Solar: ${slot.solar}%`}
                            ></div>
                            <div
                              className="w-4 bg-primary-container rounded-t"
                              style={{ height: `${slot.load}%` }}
                              title={`Dispatched Load: ${slot.load}%`}
                            ></div>
                          </div>
                          <span className="text-label-sm font-label-sm text-on-surface-variant mt-2">{slot.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Node Curtailment Table */}
              <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
                <h3 className="font-title-md text-title-md text-primary-container mb-space-sm">
                  Active Regional Balancing Nodes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-variant text-label-md font-label-md text-on-surface-variant">
                        <th className="py-2.5 px-3">Node Identifier</th>
                        <th className="py-2.5 px-3">Connected Devices</th>
                        <th className="py-2.5 px-3">Renewable Availability</th>
                        <th className="py-2.5 px-3">Dispatch State</th>
                        <th className="py-2.5 px-3 text-right">Flex Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant font-body-sm text-body-sm text-on-surface">
                      {[
                        {
                          id: 'ISO-WEST-01',
                          devices: Math.ceil((adminMetrics?.activeUserCount || 0) * 0.4),
                          ren: `${Math.round(adminMetrics?.avgRenewableUtilization || 0)}%`,
                          status: (adminMetrics?.totalFlexibleLoad || 0) > 0 ? 'Active Dispatch' : 'Standby Reserve',
                          cap: `${((adminMetrics?.totalFlexibleLoad || 0) * 0.4).toFixed(1)} kW`,
                        },
                        {
                          id: 'ISO-CENTRAL-04',
                          devices: Math.floor((adminMetrics?.activeUserCount || 0) * 0.35),
                          ren: `${Math.round((adminMetrics?.avgRenewableUtilization || 0) * 0.95)}%`,
                          status: (adminMetrics?.totalFlexibleLoad || 0) > 0 ? 'Optimal Window' : 'Standby Reserve',
                          cap: `${((adminMetrics?.totalFlexibleLoad || 0) * 0.35).toFixed(1)} kW`,
                        },
                        {
                          id: 'ISO-NORTH-02',
                          devices: Math.max(0, (adminMetrics?.activeUserCount || 0) - Math.ceil((adminMetrics?.activeUserCount || 0) * 0.4) - Math.floor((adminMetrics?.activeUserCount || 0) * 0.35)),
                          ren: `${Math.round((adminMetrics?.avgRenewableUtilization || 0) * 0.85)}%`,
                          status: 'Standby Reserve',
                          cap: `${((adminMetrics?.totalFlexibleLoad || 0) * 0.25).toFixed(1)} kW`,
                        },
                      ].map((node, i) => (
                        <tr key={i} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-3 font-semibold text-primary-container">{node.id}</td>
                          <td className="py-3 px-3 text-on-surface-variant">{node.devices} enrolled loads</td>
                          <td className="py-3 px-3">
                            <span className="text-secondary font-medium">{node.ren}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-secondary-container/60 text-on-secondary-fixed">
                              {node.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">{node.cap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: System Reserve & FlexCoins Issued */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
                <h3 className="font-title-md text-title-md text-primary-container mb-space-sm">
                  System Reserve Margin
                </h3>
                <div className="space-y-space-md">
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="text-on-surface-variant">Target Operating Reserve</span>
                      <span className="font-semibold text-on-surface">15.0%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="text-on-surface-variant">Demand Response Dispatch</span>
                      <span className="font-semibold text-primary-container">
                        {adminMetrics?.totalFlexibleLoad > 0
                          ? `${Math.min(100, Math.round((adminMetrics.totalPeakReduction / adminMetrics.totalFlexibleLoad) * 100))}% Dispatched`
                          : '0.0% Dispatched'}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary-container h-full rounded-full"
                        style={{
                          width: `${adminMetrics?.totalFlexibleLoad > 0
                            ? Math.min(100, Math.round((adminMetrics.totalPeakReduction / adminMetrics.totalFlexibleLoad) * 100))
                            : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary-container/40 border border-secondary-fixed-dim rounded-xl p-space-lg">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-md text-label-md text-on-secondary-fixed uppercase tracking-wider font-semibold">
                    FlexCoins Issued
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">toll</span>
                  </div>
                </div>
                <div className="font-headline-lg text-headline-lg text-primary-container font-bold">
                  {adminMetrics.totalFlexCoinsIssued.toLocaleString()} <span className="text-title-md text-secondary">FC</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant mt-1">
                  Total simulated incentive points disbursed for verified demand response flexibility across all registered accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
          <div className="bg-primary-container text-on-primary px-4 py-3 rounded-lg shadow-md flex items-center gap-space-sm border border-secondary">
            <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
            <span className="font-title-sm text-title-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
