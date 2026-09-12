import React, { useState } from 'react';

export default function ImpactRewards() {
  const [viewMode, setViewMode] = useState('populated');
  const [balance, setBalance] = useState(1420);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRedeem = (item, cost) => {
    if (balance < cost) {
      showToast(`Insufficient FlexCoins for ${item}.`);
      return;
    }
    setBalance((prev) => prev - cost);
    showToast(`Redeemed: ${item}! Remaining balance: ${balance - cost} FC`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Interactive View State Controller */}
      <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-variant">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
          <span className="font-title-sm text-title-sm text-on-surface">Data Simulation Mode:</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Switch perspective to inspect edge states</span>
        </div>
        <div className="inline-flex rounded-lg bg-surface-container-high p-1 gap-1">
          <button
            className={`px-space-md py-1.5 rounded text-label-md font-label-md transition-colors ${
              viewMode === 'populated'
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setViewMode('populated')}
            type="button"
          >
            Populated Data
          </button>
          <button
            className={`px-space-md py-1.5 rounded text-label-md font-label-md transition-colors ${
              viewMode === 'empty'
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setViewMode('empty')}
            type="button"
          >
            New User (0 Impact)
          </button>
          <button
            className={`px-space-md py-1.5 rounded text-label-md font-label-md transition-colors ${
              viewMode === 'loading'
                ? 'bg-primary-container text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setViewMode('loading')}
            type="button"
          >
            Telemetry Syncing
          </button>
        </div>
      </div>

      {/* Hero Impact Header */}
      <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-space-xl mb-space-xl shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed mb-space-md">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Certified Flex Telemetry</span>
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
      {viewMode === 'loading' && (
        <div className="flex flex-col gap-space-lg w-full animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-space-md">
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="h-80 bg-surface-container-high rounded-xl"></div>
          <div className="h-64 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* Empty State */}
      {viewMode === 'empty' && (
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
          <button
            className="px-5 py-2.5 rounded bg-primary-container text-on-primary font-title-sm text-title-sm"
            onClick={() => setViewMode('populated')}
            type="button"
          >
            View Sample Impact
          </button>
        </div>
      )}

      {/* Populated Content */}
      {viewMode === 'populated' && (
        <div className="flex flex-col gap-space-xl">
          {/* Large KPI Metric Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {/* KPI 1: Energy Shifted */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Shifted</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">420.5 <span className="text-title-md font-normal text-on-surface-variant">kWh</span></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="font-semibold text-secondary">+18.2%</span> vs last month baseline
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>

            {/* KPI 2: Renewable Ratio */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Renewables</span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">86.4%</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Local solar &amp; wind match
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '86.4%' }}></div>
                </div>
              </div>
            </div>

            {/* KPI 3: CO2 Avoided */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">CO₂ Avoided</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">cloud_off</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">184.2 <span className="text-title-md font-normal text-on-surface-variant">kg</span></span>
                <div className="flex flex-col gap-0.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">park</span> 8.4 urban trees planted
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant">directions_car</span> 462 car miles offset
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
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Peaker Suppressed</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-[20px]">offline_bolt</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-on-surface block tracking-tight">14 <span className="text-title-md font-normal text-on-surface-variant">Events</span></span>
                <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  Gas peaker dispatch averted during peak
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>

            {/* KPI 5: FlexCoins Balance */}
            <div className="bg-secondary-container/40 border border-secondary-fixed-dim p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-secondary-fixed uppercase tracking-wider font-semibold">
                  FlexCoins Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">toll</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-primary-container block tracking-tight font-bold">
                  {balance} <span className="text-title-md font-bold text-secondary">FC</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1 block">
                  Catalog value: ~${(balance * 0.1).toFixed(2)} USD
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
                    { month: 'Oct (Curr)', co2: 184, energy: 420 },
                  ].map((m, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div className="flex items-end gap-1.5 w-full justify-center h-full">
                        <div
                          className="w-5 bg-secondary rounded-t transition-all hover:opacity-90"
                          style={{ height: `${(m.co2 / 200) * 100}%` }}
                          title={`${m.month} CO2 Avoided: ${m.co2} kg`}
                        ></div>
                        <div
                          className="w-5 bg-primary-container rounded-t transition-all hover:opacity-90"
                          style={{ height: `${(m.energy / 450) * 100}%` }}
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

          {/* Rewards & FlexCoins Redemption Marketplace */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg" id="rewards">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg pb-space-sm border-b border-surface-variant">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                  Sustainability Marketplace
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary-container">
                  Redeem Your FlexCoins
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Exchange your grid-flexibility earnings for smart hardware rebates, bill credits, or community clean power.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-secondary-container/40 px-3 py-1.5 rounded-lg border border-secondary-fixed-dim">
                <span className="text-label-md font-label-md text-on-secondary-fixed">Available:</span>
                <span className="font-title-sm text-title-sm text-primary-container font-bold">{balance} FC</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {[
                {
                  id: 1,
                  title: 'Smart Breaker Rebate',
                  cost: 800,
                  desc: '$80 Instant voucher toward high-amperage smart load controllers.',
                  icon: 'electric_meter',
                  tag: 'Hardware Rebate',
                },
                {
                  id: 2,
                  title: 'Community Solar Share',
                  cost: 450,
                  desc: 'Fund 1 month of local community solar generation for low-income households.',
                  icon: 'solar_power',
                  tag: 'Social Impact',
                },
                {
                  id: 3,
                  title: 'Urban Tree Plantation',
                  cost: 250,
                  desc: 'Certifies 2 native trees planted through our verified urban forestry partners.',
                  icon: 'forest',
                  tag: 'Restoration',
                },
                {
                  id: 4,
                  title: '$25 Utility Bill Credit',
                  cost: 250,
                  desc: 'Direct ledger balance offset applied directly onto your next electricity bill.',
                  icon: 'receipt_long',
                  tag: 'Bill Credit',
                },
              ].map((reward) => (
                <div
                  key={reward.id}
                  className="bg-surface rounded-xl border border-surface-variant p-space-md flex flex-col justify-between hover:border-primary-container transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                        <span className="material-symbols-outlined text-[22px]">{reward.icon}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                        {reward.tag}
                      </span>
                    </div>
                    <h4 className="font-title-sm text-title-sm text-on-surface">{reward.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{reward.desc}</p>
                  </div>

                  <div className="mt-space-lg pt-space-sm border-t border-surface-variant flex items-center justify-between">
                    <span className="font-title-sm text-title-sm text-primary-container font-bold">
                      {reward.cost} FC
                    </span>
                    <button
                      className="px-3 py-1.5 rounded bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-95 transition-opacity"
                      onClick={() => handleRedeem(reward.title, reward.cost)}
                      type="button"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
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
