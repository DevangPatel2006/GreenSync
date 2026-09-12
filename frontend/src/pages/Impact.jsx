import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { mapBackendError } from '../utils/errorMapper';

export default function Impact() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalEnergyShifted: 420.5,
    avgRenewableUtilization: 86.4,
    totalPeakReduction: 14.0,
    totalCo2Avoided: 184.2,
    totalFlexCoins: 1420,
  });

  const fetchImpactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summRes = await api.get('/impact/summary');
      const data = summRes?.data || summRes;
      if (data && typeof data === 'object') {
        setSummary((prev) => ({
          totalEnergyShifted: data.totalEnergyShifted ?? prev.totalEnergyShifted,
          avgRenewableUtilization: data.avgRenewableUtilization ?? prev.avgRenewableUtilization,
          totalPeakReduction: data.totalPeakReduction ?? prev.totalPeakReduction,
          totalCo2Avoided: data.totalCo2Avoided ?? prev.totalCo2Avoided,
          totalFlexCoins: data.totalFlexCoins ?? prev.totalFlexCoins,
        }));
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

  const isEmpty =
    summary.totalEnergyShifted === 0 &&
    summary.totalFlexCoins === 0;

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
                Impact Simulation / Future Redemption
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
              <span className="font-headline-sm text-headline-sm text-on-primary">Top 4% Regional</span>
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
          <div className="h-80 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container flex items-start justify-between border border-error/20">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold">Unable to refresh telemetry</h4>
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
      {!loading && isEmpty && (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl border border-surface-variant text-center flex flex-col items-center justify-center my-space-md">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">energy_savings_leaf</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            Start Your Carbon Reduction Journey
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Once you automate your first flexible charging or heating load, real-time CO₂ reductions and FlexCoin earnings will appear here.
          </p>
          <Link
            to="/schedule-recommendations"
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm"
          >
            Schedule Flexible Load
          </Link>
        </div>
      )}

      {/* Populated Content */}
      {!loading && !isEmpty && (
        <div className="flex flex-col gap-space-xl">
          {/* Large KPI Metric Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {/* KPI 1: Energy Shifted */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Shifted</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {summary.totalEnergyShifted} <span className="text-title-md font-normal text-on-surface-variant">kWh</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="font-semibold text-secondary">+18.2%</span> vs baseline
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>

            {/* KPI 2: Renewable Ratio */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-variant">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Renewables</span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">
                  {summary.avgRenewableUtilization}%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Local solar &amp; wind match
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(summary.avgRenewableUtilization, 100)}%` }}></div>
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
                  {summary.totalCo2Avoided} <span className="text-title-md font-normal text-on-surface-variant">kg</span>
                </span>
                <div className="flex flex-col gap-0.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">park</span>
                    {(summary.totalCo2Avoided * 0.045).toFixed(1)} urban trees equivalent
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">directions_car</span>
                    {(summary.totalCo2Avoided * 2.5).toFixed(0)} car miles offset
                  </span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '64%' }}></div>
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
                  {summary.totalPeakReduction} <span className="text-title-md font-normal text-on-surface-variant">kW</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Gas peaker activation averted during peak hours
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '70%' }}></div>
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
                  {summary.totalFlexCoins} <span className="text-title-md font-bold text-secondary">FC</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1 block">
                  Est. catalog value: ~${(summary.totalFlexCoins * 0.1).toFixed(2)} USD
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-secondary-fixed-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Emissions Performance Chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
              <div>
                <h3 className="font-title-md text-title-md text-primary-container">Historical Carbon Offsets (Last 6 Months)</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Monthly progression of avoided grid emissions through demand shifting.
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
                <div className="grid grid-cols-6 gap-6 items-end h-44 pt-4 border-b border-surface-variant px-4">
                  {[
                    { month: 'May', co2: 45, energy: 110 },
                    { month: 'Jun', co2: 78, energy: 190 },
                    { month: 'Jul', co2: 120, energy: 280 },
                    { month: 'Aug', co2: 155, energy: 360 },
                    { month: 'Sep', co2: 172, energy: 395 },
                    { month: 'Oct (Curr)', co2: summary.totalCo2Avoided || 184, energy: summary.totalEnergyShifted || 420 },
                  ].map((m, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div className="flex items-end gap-1.5 w-full justify-center h-full">
                        <div
                          className="w-5 bg-secondary rounded-t transition-all hover:opacity-90"
                          style={{ height: `${Math.min((m.co2 / 200) * 100, 100)}%` }}
                          title={`${m.month} CO2 Avoided: ${m.co2} kg`}
                        ></div>
                        <div
                          className="w-5 bg-primary-container rounded-t transition-all hover:opacity-90"
                          style={{ height: `${Math.min((m.energy / 450) * 100, 100)}%` }}
                          title={`${m.month} Energy Shifted: ${m.energy} kWh`}
                        ></div>
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant mt-2">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
