import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { mapBackendError } from '../utils/errorMapper';

export default function Rewards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchRewardsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, histRes] = await Promise.allSettled([
        api.get('/rewards/balance'),
        api.get('/rewards/history'),
      ]);

      if (balRes.status === 'fulfilled' && balRes.value) {
        const val = balRes.value.balance !== undefined ? balRes.value.balance : balRes.value;
        setBalance(typeof val === 'number' ? val : (Number(val) || 0));
      } else {
        setBalance(0);
      }

      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        setHistory(histRes.value);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setError(mapBackendError(err));
      setBalance(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const handleRedeem = (item, cost) => {
    if (balance < cost) {
      showToast(`Insufficient FlexCoins for ${item}.`);
      return;
    }
    setBalance((prev) => prev - cost);
    showToast(`Redeemed: ${item}! Remaining balance: ${balance - cost} FC (Impact Simulation)`);
  };

  const isEmpty = (balance === null || balance === 0) && history.length === 0;

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

      {/* Hero Rewards Header */}
      <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-space-xl mb-space-xl shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed mb-space-md">
              <span className="material-symbols-outlined text-[16px] text-secondary">toll</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                FlexCoin Rewards Ledger
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-primary mb-space-xs tracking-tight">
              Rewards &amp; FlexCoins Marketplace
            </h1>
            <p className="font-body-lg text-body-lg text-primary-fixed max-w-xl">
              Earn FlexCoins by scheduling flexible appliances during peak clean power generation. Redeem your points for hardware rebates, clean energy vouchers, or utility credits.
            </p>
          </div>
          <div className="flex items-center gap-space-md bg-primary/40 backdrop-blur px-space-lg py-space-md rounded-lg shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[26px]">military_tech</span>
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">Flex Milestone Tier</span>
              <span className="font-headline-sm text-headline-sm text-on-primary">Tier 3 Prosumer</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-24 w-80 h-80 rounded-full bg-secondary opacity-15 pointer-events-none blur-2xl"></div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-space-lg w-full animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
            <div className="h-36 bg-surface-container-high rounded-xl"></div>
          </div>
          <div className="h-64 bg-surface-container-high rounded-xl"></div>
          <div className="h-64 bg-surface-container-high rounded-xl"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container flex items-start justify-between border border-error/20">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-error text-[24px]">error</span>
            <div>
              <h4 className="font-title-sm text-title-sm font-semibold">Unable to refresh rewards</h4>
              <p className="font-body-sm text-body-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRewardsData}
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
            <span className="material-symbols-outlined text-[32px]">toll</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
            No FlexCoins Earned Yet
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
            Complete your first scheduled flexibility shift to start earning FlexCoins for verified clean energy utilization.
          </p>
        </div>
      )}

      {/* Populated Content */}
      {!loading && !isEmpty && (
        <div className="flex flex-col gap-space-xl">
          {/* Top Balance & Milestones Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* FlexCoins Balance Card */}
            <div className="bg-secondary-container/40 border border-secondary-fixed-dim p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-secondary-fixed uppercase tracking-wider font-semibold">
                  Current FlexCoins Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[20px]">toll</span>
                </div>
              </div>
              <div>
                <span className="font-headline-lg text-headline-lg text-primary-container block tracking-tight font-bold">
                  {(balance || 0).toLocaleString()} <span className="text-title-md font-bold text-secondary">FC</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant font-semibold mt-1 block">
                  Est. catalog value: ~${((balance || 0) * 0.1).toFixed(2)} USD
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-secondary-fixed-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(100, Math.round(((balance || 0) / 2000) * 100))}%` }}></div>
                </div>
              </div>
            </div>

            {/* Milestones & Clean Shift Level */}
            <div className="bg-surface-container-lowest border border-surface-variant p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                  Tier Milestone Progress
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                </div>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm text-primary-container block font-bold">
                  {(balance || 0) >= 1000 ? 'Level 3: Community Grid Champion' : (balance || 0) >= 500 ? 'Level 2: Flex Shifter' : (balance || 0) >= 100 ? 'Level 1: Active Participant' : 'Starter Tier'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                  {(balance || 0) >= 2000
                    ? 'Top tier achieved! Maximum FlexCoin multiplier active.'
                    : `Next reward milestone unlocks in ${Math.max(0, 1000 - (balance || 0))} FC.`}
                </span>
              </div>
              <div className="mt-space-md pt-space-xs">
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.min(100, Math.round(((balance || 0) / 1000) * 100))}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Earning History & Explainability Breakdown (Section 15, Section 18) */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md pb-space-sm border-b border-surface-variant">
              <div>
                <h3 className="font-title-md text-title-md text-primary-container">
                  FlexCoin Earning History &amp; Points Breakdown
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Transparent allocation of rewards per Section 18 explainability principles.
                </p>
              </div>
              <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
                <span>Formula: 0.4×Renewable + 0.3×Peak + 0.2×Shift + Bonuses</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-variant text-label-md font-label-md text-on-surface-variant">
                    <th className="py-2.5 px-3">Date &amp; Event</th>
                    <th className="py-2.5 px-3">Impact Type</th>
                    <th className="py-2.5 px-3">Points Breakdown</th>
                    <th className="py-2.5 px-3 text-right">Coins Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant font-body-sm text-body-sm text-on-surface">
                  {history.map((tx, idx) => (
                    <tr key={tx._id || idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-on-surface">{tx.reason}</div>
                        <div className="text-label-sm font-label-sm text-on-surface-variant">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm uppercase bg-surface-container text-on-surface-variant">
                          {tx.impactType || 'reward'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {tx.breakdown ? (
                          <div className="flex flex-wrap gap-1 text-label-sm font-label-sm text-on-surface-variant">
                            <span className="bg-secondary-container/60 text-on-secondary-fixed px-1.5 py-0.5 rounded">
                              Ren: +{tx.breakdown.renewablePoints}
                            </span>
                            <span className="bg-surface-container-high px-1.5 py-0.5 rounded">
                              Peak: +{tx.breakdown.peakPoints}
                            </span>
                            <span className="bg-surface-container-high px-1.5 py-0.5 rounded">
                              Shift: +{tx.breakdown.shiftPoints}
                            </span>
                            {tx.breakdown.flexibilityBonus > 0 && (
                              <span className="bg-primary-container/20 text-primary-container px-1.5 py-0.5 rounded">
                                Flex: +{tx.breakdown.flexibilityBonus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">Standard dispatch weight</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-primary-container">
                          +{tx.coins || tx.amount || 0} FC
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rewards & FlexCoins Redemption Marketplace */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-space-lg" id="rewards">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg pb-space-sm border-b border-surface-variant">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                  Sustainability Marketplace (Simulation)
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
