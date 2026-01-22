"use client";

import { useState } from "react";

interface FormData {
  canvasserId: string;
  dateOfSale: string;
  storeName: string;
  device: string;
  planType: string;
  planPrice: string;
  serialNumber: string;
}

export default function IncentivePlanSaleForm() {
  const [formData, setFormData] = useState<FormData>({
    canvasserId: "",
    dateOfSale: "",
    storeName: "",
    device: "",
    planType: "",
    planPrice: "",
    serialNumber: "",
  });

  const [showModal, setShowModal] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleFinalSubmit = async () => {
    // Your submission logic here
    console.log("Submitting form data:", formData);
    
    // Add your API call or submission logic
    // Example:
    // await fetch('/api/incentive-plan-sale', {
    //   method: 'POST',
    //   body: JSON.stringify(formData),
    // });
    
    setShowModal(false);
    // Reset form or show success message
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Incentive Plan Sale</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Canvasser ID</label>
            <input
              type="text"
              name="canvasserId"
              value={formData.canvasserId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Sale</label>
            <input
              type="date"
              name="dateOfSale"
              value={formData.dateOfSale}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Device</label>
            <input
              type="text"
              name="device"
              value={formData.device}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Plan Type</label>
            <select
              name="planType"
              value={formData.planType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Plan Type</option>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Plan Price</label>
            <input
              type="number"
              name="planPrice"
              value={formData.planPrice}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Serial Number (16-18 digits)</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              required
              pattern="\d{16,18}"
              title="Serial Number must be 16-18 digits"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Confirm Plan Sale
            </h2>
            <p className="text-base text-gray-500 mb-8">
              Review the details below before submitting.
            </p>

            <div className="space-y-5 mb-8">
              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Canvasser ID</span>
                <span className="text-base text-gray-900 font-medium">{formData.canvasserId}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Date of Sale</span>
                <span className="text-base text-gray-900 font-medium">{formData.dateOfSale}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Store Name</span>
                <span className="text-base text-gray-900 font-medium">{formData.storeName}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Device</span>
                <span className="text-base text-gray-900 font-medium">{formData.device}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Plan Type</span>
                <span className="text-base text-gray-900 font-medium">{formData.planType}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Plan Price</span>
                <span className="text-base text-gray-900 font-medium">₹{formData.planPrice}</span>
              </div>

              <div className="flex justify-between py-3">
                <span className="text-base text-gray-500">Serial Number</span>
                <span className="text-base text-gray-900 font-medium">{formData.serialNumber}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
