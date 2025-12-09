"use client";

import { useState } from "react";

export default function ReportPage() {
  const [planSearch, setPlanSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  const planTypes = ["ADLD", "COMBO"];
  const stores = [
    "Croma - ABS - Noida-Gaur Mall",
    "Croma - ARS - Noida - Mall of India",
    "Croma - ARS - Noida-Logix Mall",
    "VS- Up (Noida Sec.18) Br",
  ];
  const devices = [
    "Super Premium - S25",
    "Luxury Flip - Z Flip FE",
    "Luxury Flip - Z Flip 6",
    "Mid - F17",
    "Samsung Galaxy S24",
  ];

  const filteredPlans = planTypes.filter((plan) =>
    plan.toLowerCase().includes(planSearch.toLowerCase())
  );
  const filteredStores = stores.filter((store) =>
    store.toLowerCase().includes(storeSearch.toLowerCase())
  );
  const filteredDevices = devices.filter((device) =>
    device.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-10">
      <header className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Report Page</h1>
            <p className="text-sm text-neutral-400">Incentives Summary — No of Incentive Paid: 2474 | Unpaid: 230</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Live
              </span>
            </div>
          </div>

          {/* Utilities */}
          <div className="flex items-center gap-3">
            <a
              href="/login/role"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 17L21 12L16 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Logout</span>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Plan Type Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Plan Type"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              onFocus={() => setShowPlanDropdown(true)}
              onBlur={() => setTimeout(() => setShowPlanDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-neutral-750 transition w-48"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showPlanDropdown && filteredPlans.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan}
                    onClick={() => {
                      setPlanSearch(plan);
                      setShowPlanDropdown(false);
                    }}
                    className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                  >
                    {plan}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Store Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Store"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              onFocus={() => setShowStoreDropdown(true)}
              onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-neutral-750 transition w-64"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showStoreDropdown && filteredStores.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredStores.map((store) => (
                  <div
                    key={store}
                    onClick={() => {
                      setStoreSearch(store);
                      setShowStoreDropdown(false);
                    }}
                    className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                  >
                    {store}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Select Device"
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              onFocus={() => setShowDeviceDropdown(true)}
              onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 200)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-neutral-750 transition w-56"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showDeviceDropdown && filteredDevices.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredDevices.map((device) => (
                  <div
                    key={device}
                    onClick={() => {
                      setDeviceSearch(device);
                      setShowDeviceDropdown(false);
                    }}
                    className="px-4 py-2 text-sm text-white hover:bg-neutral-700 cursor-pointer"
                  >
                    {device}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="max-w-6xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(99,102,241,0.3)]">
            <h3 className="text-white text-4xl font-bold mb-2">465</h3>
            <p className="text-indigo-100 text-sm font-medium">Active Stores</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(16,185,129,0.3)]">
            <h3 className="text-white text-4xl font-bold mb-2">556</h3>
            <p className="text-emerald-100 text-sm font-medium">SECs Active</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-[0_10px_40px_rgba(37,99,235,0.3)]">
            <h3 className="text-white text-4xl font-bold mb-2">2704</h3>
            <p className="text-blue-100 text-sm font-medium">Reports Submitted</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="max-w-7xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Date of Sale</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">SEC ID</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Store Name</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Device Name</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">Plan Type</th>
                <th className="text-left text-neutral-600 text-xs font-medium uppercase tracking-wider p-4">IMEI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[
                { time: "2024-11-15 14:32:15", date: "2024-11-15", sec: "SEC001", store: "Croma- ABS - Noida-Gaur Mall", device: "Super Premium - S25", plan: "ADLD", imei: "358240051111110", amount: "₹2,500" },
                { time: "2024-11-15 14:28:42", date: "2024-11-15", sec: "SEC002", store: "Croma- ARS-Noida- Mall of India", device: "Luxury Flip - Z Flip FE", plan: "COMBO", imei: "358240051111111", amount: "₹1,800" },
                { time: "2024-11-15 14:25:18", date: "2024-11-15", sec: "SEC003", store: "Croma- ABS - Noida-Gaur Mall", device: "Mid - F17", plan: "ADLD", imei: "358240051111112", amount: "₹2,200" },
                { time: "2024-11-15 14:22:05", date: "2024-11-15", sec: "SEC004", store: "Croma- ARS -Noida-Logix Mall", device: "Samsung Galaxy S24", plan: "COMBO", imei: "358240051111113", amount: "₹1,500" },
                { time: "2024-11-15 14:18:33", date: "2024-11-15", sec: "SEC005", store: "Croma- ABS - Noida-Gaur Mall", device: "Luxury Flip - Z Flip 6", plan: "ADLD", imei: "358240051111114", amount: "₹1,900" },
                { time: "2024-11-15 14:15:27", date: "2024-11-15", sec: "SEC006", store: "VS- Up (Noida Sec.18) Br", device: "Samsung Galaxy S24", plan: "COMBO", imei: "358240051111115", amount: "₹1,600" },
                { time: "2024-11-15 14:12:14", date: "2024-11-15", sec: "SEC007", store: "Croma- ARS - Noida-Gaur Mall", device: "Mid - F17", plan: "ADLD", imei: "358240051111116", amount: "₹2,100" },
                { time: "2024-11-15 14:08:51", date: "2024-11-15", sec: "SEC008", store: "VS- Up (Noida Sec.18) Br", device: "Super Premium - S25", plan: "COMBO", imei: "358240051111117", amount: "₹1,400" },
                { time: "2024-11-15 14:05:38", date: "2024-11-15", sec: "SEC009", store: "Croma- ARS -Noida-Logix Mall", device: "Luxury Flip - Z Flip FE", plan: "ADLD", imei: "358240051111118", amount: "₹1,750" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50 transition">
                  <td className="text-neutral-600 text-sm p-4">{row.date}</td>
                  <td className="text-neutral-900 text-sm font-medium p-4">{row.sec}</td>
                  <td className="text-neutral-900 text-sm p-4">{row.store}</td>
                  <td className="text-neutral-600 text-sm p-4">{row.device}</td>
                  <td className="text-neutral-600 text-sm p-4">{row.plan}</td>
                  <td className="text-neutral-500 text-xs font-mono p-4">{row.imei}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
