"use client";

import { useState } from "react";
import { UtensilsCrossed, User, Phone, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface SetupDialogProps {
  open: boolean;
  onComplete: (data: {
    tableNumber: string;
    customerName: string;
    whatsappNumber: string;
  }) => void;
}

export default function SetupDialog({ open, onComplete }: SetupDialogProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [errors, setErrors] = useState<{
    table?: string;
    name?: string;
    phone?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    // Validate table number
    if (!tableNumber || tableNumber.trim() === "") {
      newErrors.table = "Table number is required";
    }

    // Validate name
    if (!customerName || customerName.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Validate WhatsApp number
    const cleanedPhone = whatsappNumber.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    } else if (cleanedPhone.length > 15) {
      newErrors.phone = "Phone number is too long";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete({
      tableNumber: tableNumber.trim(),
      customerName: customerName.trim(),
      whatsappNumber: cleanedPhone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <DialogTitle>Welcome to Ngantri!</DialogTitle>
          </div>
          <DialogDescription>
            Please provide your details to get started with your order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Table Number */}
          <div>
            <label
              htmlFor="table"
              className="block text-sm font-bold text-gray-900 mb-2"
            >
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <span>Table Number</span>
                <span className="text-red-600">*</span>
              </div>
            </label>
            <input
              type="text"
              id="table"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                setErrors((prev) => ({ ...prev, table: undefined }));
              }}
              placeholder="e.g., 19"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-semibold ${
                errors.table ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.table && (
              <p className="text-sm text-red-600 mt-2 font-semibold">
                {errors.table}
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-bold text-gray-900 mb-2"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Your Name</span>
                <span className="text-red-600">*</span>
              </div>
            </label>
            <input
              type="text"
              id="name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Enter your name"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-2 font-semibold">
                {errors.name}
              </p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-bold text-gray-900 mb-2"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>WhatsApp Number</span>
                <span className="text-red-600">*</span>
              </div>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-bold text-base">
                +62
              </span>
              <input
                type="tel"
                id="phone"
                value={whatsappNumber}
                onChange={(e) => {
                  setWhatsappNumber(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="812-3456-7890"
                className={`w-full pl-14 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                  errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600 mt-2 font-semibold">
                {errors.phone}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-2 font-medium">
              We&apos;ll send order updates via WhatsApp
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Ordering
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
