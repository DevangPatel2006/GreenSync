import React, { useState } from 'react';
import { useImpact } from '../hooks/useImpact';
import { useEnergy } from '../hooks/useEnergy';

export default function AdminGridDashboard() {
  const { adminData, loading: adminLoading } = useImpact();
  const { current } = useEnergy();
  const [toastMessage, setToastMessage] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleTriggerDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      showToast('Regional demand response event broadcast to 342 active controllable nodes!');
    }, 1200);
  };

  const nodes = [
    { id: 'TX-8801', name: 'Regional Grid Node #TX-8801', status: 'Optimal Renewable', flex: '420 kW', cap: '78%', type: 'Wind Corridor' },
    { id: 'TX-8802', name: 'Regional Grid Node #TX-8802', status: 'Moderate Load', flex: '310 kW', cap: '62%', type: 'Solar Array' },
    { id: 'CA-4100', name: 'Regional Grid Node #CA-4100', status: 'Peak Congestion', flex: '280 kW', cap: '94%', type: 'Urban Core' },
    { id: 'NY-1200', name: 'Regional Grid Node #NY-1200', status: 'Balanced Baseload', flex: '238 kW', cap: '54%', type: 'Hydro/Nuclear' },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-space-lg border-b border-surface-variant gap-space-sm mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Operator Control Center</span>
            <span>•</span>
            <span className="text-secondary font-title-sm">Regional Dispatch Authority</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container mt-0.5 tracking-tight">
            Admin Grid Dispatch Control
          </h1>
        </div>

        <div className="flex items-center gap-space-sm">
          <span className="px-3 py-1 rounded-full text-label-sm font-label-sm bg-secondary-container text-on-secondary-fixed border border-secondary-fixed-dim flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Grid Telemetry Live
          </span>
          <button
            type="button"
            className="px-4 py-2 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity flex items-center gap-space-xs"
            onClick={handleTriggerDispatch}
            disabled={isDispatching}
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>{isDispatching ? 'Broadcasting...' : 'Trigger Flex DR Event'}</span>
          </button>
        </div>
      </div>

      {/* Grid Condition Banner */}
      <div className="w-full bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md mb-space-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center shrink-0 border border-secondary-fixed-dim">
              <span className="material-symbols-outlined text-secondary text-[26px]">grid_view</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-[#F1F6E3] text-[#2F3D13] border border-secondary-fixed-dim">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  System Reserve: Healthy (+18.4% Margin)
                </span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">
                  • 4 Balancing Nodes Monitored
                </span>
              </div>
              <div className="font-title-md text-title-md text-on-surface">
                Aggregate regional clean dispatch capability: {adminData?.totalFlexibleLoadKw || 1248.5} kW available
              </div>
            </div>
          </div>
          <div className="text-left lg:text-right border-t lg:border-t-0 border-surface-variant pt-space-xs lg:pt-0">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Current Grid Clean Mix</span>
            <div className="text-body-md font-title-sm text-primary-container">
              {current?.renewablePercentage ?? 74}% Renewable Generation
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">Total Flexible Capacity</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">electric_bolt</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display text-display text-primary-container tracking-tight">
              {adminData?.totalFlexibleLoadKw || '1,248'}
            </span>
            <span className="font-title-md text-title-md text-on-surface-variant">kW</span>
          </div>
          <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
            Across <span className="font-semibold text-on-surface">{adminData?.activeUsers || 342} enrolled assets</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">Energy Shifted (Month)</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">swap_horiz</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display text-display text-primary-container tracking-tight">
              {adminData?.totalShiftedEnergyMwh || '14.8'}
            </span>
            <span className="font-title-md text-title-md text-on-surface-variant">MWh</span>
          </div>
          <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
            Offsetting <span className="font-semibold text-on-surface">6.4 tons CO₂</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">Renewable Utilization</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">solar_power</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display text-display text-primary-container tracking-tight">
              {adminData?.renewableUtilization || '78.4'}
            </span>
            <span className="font-title-md text-title-md text-on-surface-variant">%</span>
          </div>
          <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
            Curtailment avoided: <span className="font-semibold text-on-surface">94.2%</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-md hover:border-primary-container transition-colors">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">Peak Shed Response</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">trending_down</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display text-display text-primary-container tracking-tight">
              {adminData?.peakReductionKw || '42.6'}
            </span>
            <span className="font-title-md text-title-md text-on-surface-variant">kW</span>
          </div>
          <div className="mt-space-xs text-on-surface-variant font-label-md text-label-md">
            Max relief during <span className="font-semibold text-on-surface">6pm–8pm peaks</span>
          </div>
        </div>
      </div>

      {/* Regional Balancing Nodes Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-space-lg mb-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md pb-space-sm border-b border-surface-variant">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Balancing Sub-nodes
            </span>
            <h2 className="font-headline-sm text-headline-sm text-primary-container">
              Regional Grid Substation Health &amp; Dispatch Status
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Telemetry feed across connected regional substations and automated flexible demand capacity.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-variant text-label-sm font-label-sm text-on-surface-variant uppercase">
                <th className="py-space-sm px-space-md">Node Identifier</th>
                <th className="py-space-sm px-space-md">Classification</th>
                <th className="py-space-sm px-space-md">Grid Status</th>
                <th className="py-space-sm px-space-md">Capacity Utilization</th>
                <th className="py-space-sm px-space-md">Controllable Flex</th>
                <th className="py-space-sm px-space-md text-right">Dispatch Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant text-body-md font-body-md text-on-surface">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-space-md px-space-md font-semibold text-primary-container">
                    {node.name}
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant">
                    {node.type}
                  </td>
                  <td className="py-space-md px-space-md">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm ${
                        node.status.includes('Optimal')
                          ? 'bg-[#F1F6E3] text-[#2F3D13] border border-secondary-fixed-dim'
                          : node.status.includes('Peak')
                          ? 'bg-error/10 text-error border border-error/30'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          node.status.includes('Optimal')
                            ? 'bg-secondary'
                            : node.status.includes('Peak')
                            ? 'bg-error'
                            : 'bg-on-surface-variant'
                        }`}
                      ></span>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface">
                    {node.cap}
                  </td>
                  <td className="py-space-md px-space-md font-semibold text-secondary">
                    {node.flex}
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button
                      type="button"
                      className="px-3 py-1 rounded border border-surface-variant text-label-md font-label-md text-on-surface hover:border-primary-container hover:text-primary-container transition-colors"
                      onClick={() => showToast(`Optimized dispatch dispatched to ${node.id}`)}
                    >
                      Dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
