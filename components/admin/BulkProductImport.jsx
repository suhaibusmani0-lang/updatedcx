"use client";

import React, { useState } from "react";
import { UploadCloud, Download, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { showToast } from "@/lib/showToast";
import * as XLSX from "xlsx";

const COLUMNS = [
  { header: "Name",              required: true,  hint: "Any text",                          example: "Leather Boots" },
  { header: "Category",         required: true,  hint: "Must match an existing category",   example: "Footwear" },
  { header: "Price",            required: true,  hint: "Number",                             example: "2999" },
  { header: "Sale Price",       required: false, hint: "Number, less than Price",            example: "2499" },
  { header: "Stock",            required: false, hint: "Number (default: 0)",                example: "10" },
  { header: "Description",      required: false, hint: "Long text",                          example: "Comfortable leather boots." },
  { header: "Short Description",required: false, hint: "Short text",                         example: "Great boots." },
  { header: "Badge",            required: false, hint: "Any text e.g. New, Sale",            example: "New" },
  { header: "Status",           required: false, hint: "Active / Inactive (default: Active)",example: "Active" },
  { header: "Featured",         required: false, hint: "Yes / No (default: No)",             example: "No" },
  { header: "New Arrival",      required: false, hint: "Yes / No (default: No)",             example: "Yes" },
  { header: "Best Seller",      required: false, hint: "Yes / No (default: No)",             example: "No" },
];

const BULK_IMPORT_ENDPOINT = "/api/admin/products/bulk-import";

export default function BulkProductImport({ onImportComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleFileChange = (event) => {
    setResult(null);
    setFile(event.target.files?.[0] || null);
  };

  const handleDownloadTemplate = () => {
    const headers = COLUMNS.map((c) => c.header);
    const example = COLUMNS.map((c) => c.example);

    // Products sheet
    const productSheet = XLSX.utils.aoa_to_sheet([headers, example]);
    // Set column widths
    productSheet["!cols"] = COLUMNS.map((c) =>
      ({ wch: Math.max(c.header.length, c.example.length) + 4 })
    );

    // Guide sheet
    const guideData = [
      ["Column", "Required", "Accepted Values", "Example"],
      ...COLUMNS.map((c) => [c.header, c.required ? "Yes" : "No", c.hint, c.example]),
    ];
    const guideSheet = XLSX.utils.aoa_to_sheet(guideData);
    guideSheet["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 38 }, { wch: 30 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, productSheet, "Products");
    XLSX.utils.book_append_sheet(workbook, guideSheet, "Guide");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-import-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      showToast("error", "Please choose an XLSX file to upload.");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(BULK_IMPORT_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.message || "Import failed.");
        setResult({ error: data.message || "Import failed." });
        return;
      }

      setResult(data.data || {});
      showToast(
        data.data?.imported > 0 ? "success" : "error",
        `${data.data?.imported ?? 0} imported, ${data.data?.skipped ?? 0} skipped.`
      );
      if (data.data?.imported > 0 && typeof onImportComplete === "function") {
        onImportComplete();
      }
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Upload failed.");
      setResult({ error: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Bulk Import</h2>
          <p className="text-sm text-gray-500">Upload an Excel file to import multiple products at once.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
        >
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Column Guide Toggle */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span>Column Reference Guide</span>
          {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showGuide && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase tracking-wide">
                  <th className="px-3 py-2 text-left">Column</th>
                  <th className="px-3 py-2 text-left">Required</th>
                  <th className="px-3 py-2 text-left">Accepted Values</th>
                  <th className="px-3 py-2 text-left">Example</th>
                </tr>
              </thead>
              <tbody>
                {COLUMNS.map((col) => (
                  <tr key={col.header} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{col.header}</td>
                    <td className="px-3 py-2">
                      {col.required ? (
                        <span className="text-red-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{col.hint}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{col.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Excel File (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-50"
        />
        <p className="mt-1 text-xs text-gray-400">Maximum file size is 5MB. Only .xlsx files are supported.</p>
      </div>

      {/* Import Button */}
      <button
        type="button"
        onClick={handleImport}
        disabled={uploading || !file}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
          uploading || !file ? "bg-gray-400 cursor-not-allowed" : "bg-[#1A1A1A] hover:bg-[#C17A56]"
        }`}
      >
        <UploadCloud size={16} />
        {uploading ? "Importing..." : "Upload and Import"}
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {result.error ? (
            <div className="flex items-start gap-2 text-red-700">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Import failed</p>
                <p className="text-sm">{result.error}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Import finished</p>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span className="text-green-700">✓ {result.imported ?? 0} imported</span>
                    {(result.skipped ?? 0) > 0 && (
                      <span className="text-red-600">✗ {result.skipped} skipped</span>
                    )}
                    <span className="text-gray-500">Total: {result.total ?? 0}</span>
                  </div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-white p-3">
                  <p className="font-medium text-sm text-red-700 mb-2">Row errors ({result.errors.length})</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 max-h-52 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>
                        <span className="font-medium">Row {err.row}:</span> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
