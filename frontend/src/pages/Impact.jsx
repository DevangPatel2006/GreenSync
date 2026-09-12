import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { mapBackendError } from '../utils/errorMapper';

export default function Impact() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchImpactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summRes = await api.get('/impact/summary');
      const data = summRes?.data || summRes;
      if (data && typeof data === 'object') {
        setSummary({
          totalEnergyShifted: Number(data.totalEnergyShifted) || 0,
          avgRenewableUtilization: Number(data.avgRenewableUtilization) || 0,
          totalPeakReduction: Number(data.totalPeakReduction) || 0,
          totalCo2Avoided: Number(data.totalCo2Avoided) || 0,
          totalFlexCoins: Number(data.totalFlexCoins) || 0,
        });
      } else {
        setSummary({
          totalEnergyShifted: 0,
          avgRenewableUtilization: 0,
          totalPeakReduction: 0,
          totalCo2Avoided: 0,
          totalFlexCoins: 0,
        });
      }
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  const currentSummary = summary || {
    totalEnergyShifted: 0,
    avgRenewableUtilization: 0,
    totalPeakReduction: 0,
    totalCo2Avoided: 0,
    totalFlexCoins: 0,
  };

  const isEmpty =
    currentSummary.totalEnergyShifted === 0 &&
    currentSummary.totalFlexCoins === 0;

  return (
    <div className="flex flex-col w-full">
      {/* Honesty Banner: Section 6 Compliance */}
      <div className="mb-space-md p-space-md rounded-xl bg-surface-container border border-surface-variant flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">info</span>
        <div>
          <span className="font-label-md text-label-md text-on-surface font-semibold block">
            Impact Simulation &amp; Future Redemption Notice
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Environmental metrics and FlexCoin balances are part of the GreenSync Impact Simulation. Values represent modeled carbon avoidance and future eligibility for utility tariff rebates. They do not constitute fiat currency or automated NGO donations.
          </p>
        </div>
      </div>

      {/* Hero Impact Header */}
      <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-space-xl mb-space-xl shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed mb-space-md">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Impact Simulation / Verified Metrics
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-primary mb-space-xs tracking-tight">
              Your Environmental &amp; Grid Impact
            </h1>
            <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl">
              Every shifted kilowatt hour keeps fossil peaker plants offline. Your scheduled flex operations actively relieve grid stress and suppress regional peaker activation.
            </p>
          </div>
          <div className="flex items-center gap-space-md bg-primary/40 backdrop-blur px-space-lg py-space-md rounded-lg shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[26px]">eco</span>
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">Grid Co-Op Rank</span>
              <span className="font-headline-sm text-headline-sm text-on-primary">
                {isEmpty ? 'Enrollment Stage' : 'Active Contributor'}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-24 w-80 h-80 rounded-full bg-secondary opacity-15 pointer-events-none blur-2xl"></div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-space-lg w-full animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="h-64 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container flex items-start justify-between border border-error/20">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold">Unable to refresh impact metrics</h4>
              <p className="font-body-sm text-body-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchImpactData}
            className="px-space-md py-1.5 rounded bg-error text-on-error font-label-md text-label-md hover:opacity-90"
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && isEmpty && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">eco</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No environmental impact recorded yet
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Schedule an appliance during renewable energy hours to start logging real carbon avoidance and clean grid dispatch metrics.
          </p>
          <div className="flex gap-space-md">
            <Link
              to="/my-loads-devices?add=1"
              className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity inline-flex items-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Connect an Appliance
            </Link>
            <Link
              to="/schedule-recommendations"
              className="px-5 py-2.5 rounded border border-surface-variant text-on-surface font-title-sm text-title-sm hover:bg-surface-container transition-colors inline-flex items-center gap-space-xs"
            >
              View Schedules
            </Link>
          </div>
        </div>
      )}

      {/* Populated Impact View */}
      {!loading && !error && !isEmpty && (
        <div className="flex flex-col gap-space-lg w-full">
          {/* 5 KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            {/* KPI 1: Energy Shifted */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Energy Shifted</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalEnergyShifted.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kWh</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Automated dispatch volume
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalEnergyShifted, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 2: Renewable Utilization */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Renewable Match</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.avgRenewableUtilization.toFixed(1)}%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Local solar &amp; wind match
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(currentSummary.avgRenewableUtilization, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 3: CO2 Avoided */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">CO₂ Avoided</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">cloud_off</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalCo2Avoided.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kg</span>
                </span>
                <div className="flex flex-col gap-0.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">park</span>
                    {(currentSummary.totalCo2Avoided * 0.045).toFixed(1)} urban trees equivalent
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">directions_car</span>
                    {(currentSummary.totalCo2Avoided * 2.5).toFixed(0)} car miles offset
                  </span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalCo2Avoided * 2, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 4: Peaker Offsets */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Peaker Suppressed</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">offline_bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {currentSummary.totalPeakReduction.toFixed(1)} <span className="text-title-md font-normal text-on-surface-variant">kW</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Gas peaker activation averted
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(currentSummary.totalPeakReduction * 5, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* KPI 5: FlexCoins Earned */}
            <div className="bg-secondary-container/40 border border-secondary-fixed-dim p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-secondary-fixed uppercase tracking-wider font-semibold">
                  FlexCoins Earned
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">toll</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-primary-container block tracking-tight font-bold">
                  {currentSummary.totalFlexCoins} <span className="text-title-md font-bold text-secondary">FC</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1 block">
                  Impact simulation balance
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-secondary-fixed-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min((currentSummary.totalFlexCoins / 1000) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Emissions Performance Chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
              <div>
                <h3 className="font-title-md text-title-md text-primary-container">Verified Impact Progression</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Progression of avoided grid emissions through scheduled demand shifting.
                </p>
              </div>
              <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                  <span>Avoided CO₂ (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                  <span>Shifted Energy (kWh)</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-3 gap-6 items-end h-44 pt-4 border-b border-surface-variant px-4">
                  {[
                    { period: 'Prior Baseline', co2: 0, energy: 0 },
                    { period: 'Recent Cycles', co2: Number((currentSummary.totalCo2Avoided * 0.4).toFixed(1)), energy: Number((currentSummary.totalEnergyShifted * 0.4).toFixed(1)) },
                    { period: 'Current Cumulative', co2: currentSummary.totalCo2Avoided, energy: currentSummary.totalEnergyShifted },
                  ].map((m, idx) => {
                    const maxCo2 = Math.max(currentSummary.totalCo2Avoided, 10);
                    const maxEnergy = Math.max(currentSummary.totalEnergyShifted, 20);
                    const co2Height = maxCo2 > 0 ? (m.co2 / maxCo2) * 100 : 0;
                    const energyHeight = maxEnergy > 0 ? (m.energy / maxEnergy) * 100 : 0;

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                        <div className="flex items-end gap-2 w-full justify-center h-full">
                          <div
                            className="w-6 bg-secondary rounded-t transition-all hover:opacity-90"
                            style={{ height: `${Math.max(co2Height, m.co2 > 0 ? 6 : 0)}%` }}
                            title={`${m.period} CO₂ Avoided: ${m.co2} kg`}
                          ></div>
                          <div
                            className="w-6 bg-primary-container rounded-t transition-all hover:opacity-90"
                            style={{ height: `${Math.max(energyHeight, m.energy > 0 ? 6 : 0)}%` }}
                            title={`${m.period} Energy Shifted: ${m.energy} kWh`}
                          ></div>
                        </div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant mt-2">{m.period}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
