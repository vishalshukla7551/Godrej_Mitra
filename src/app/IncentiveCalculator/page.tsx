"use client";

import { useState } from "react";
import SECHeader from "@/components/sec/SECHeader";
import SECFooter from "@/components/sec/SECFooter";

export default function IncentiveCalculatorPage() {
  const [deviceType, setDeviceType] = useState("");
  const [planType, setPlanType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [calculatedIncentive, setCalculatedIncentive] = useState(0);

  // Incentive rates (you can modify these based on your actual rates)
  const incentiveRates = {
    "Super Premium - S25": {
      ADLD: 2500,
      COMBO: 1800,
    },
    "Luxury Flip - Z Flip FE": {
      ADLD: 2200,
      COMBO: 1600,
    },
    "Luxury Flip - Z Flip 6": {
      ADLD: 2400,
      COMBO: 1700,
    },
    "Mid - F17": {
      ADLD: 1800,
      COMBO: 1300,
    },
    "Samsung Galaxy S24": {
      ADLD: 2000,
      COMBO: 1500,
    },
  };

  const devices = Object.keys(incentiveRates);
  const planTypes = ["ADLD", "COMBO"];

  const calculateIncentive = () => {
    if (deviceType && planType && quantity > 0) {
      const rate = incentiveRates[deviceType]?.[planType] || 0;
      const total = rate * quantity;
      setCalculatedIncentive(total);
    } else {
      setCalculatedIncentive(0);
    }
  };

  const handleCalculate = () => {
    calculateIncentive();
  };

  const resetCalculator = () => {
    setDeviceType("");
    setPlanType("");
    setQuantity(1);
    setCalculatedIncentive(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SECHeader />

      {/* Main Content */}
      <main className="flex-1 pb-32 px-4 pt-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Incentive Calculator
            </h1>
            <p className="text-sm text-gray-600">
              Calculate your potential earnings based on device sales
            </p>
          </div>

          {/* Calculator Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            {/* Device Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Device
              </label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a device</option>
                {devices.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose plan type</option>
                {planTypes.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl text-center text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={!deviceType || !planType}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
            >
              Calculate Incentive
            </button>

            {/* Reset Button */}
            <button
              onClick={resetCalculator}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Result */}
          {calculatedIncentive > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center">
              <h3 className="text-lg font-semibold mb-2">Your Potential Incentive</h3>
              <div className="text-3xl font-bold mb-2">₹{calculatedIncentive.toLocaleString()}</div>
              <p className="text-sm opacity-90">
                {quantity} × {deviceType} ({planType})
              </p>
            </div>
          )}

          {/* Rate Information */}
          {deviceType && planType && (
            <div className="mt-4 bg-blue-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Rate Information</h4>
              <p className="text-sm text-blue-800">
                {deviceType} - {planType}: ₹{incentiveRates[deviceType]?.[planType]?.toLocaleString() || 0} per unit
              </p>
            </div>
          )}
        </div>
      </main>

      <SECFooter />
    </div>
  );
}