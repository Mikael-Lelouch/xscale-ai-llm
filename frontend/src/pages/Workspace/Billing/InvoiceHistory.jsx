import React from "react";
import { Download, Eye, CheckCircle, Clock, AlertCircle } from "react-feather";

const InvoiceRow = ({ invoice }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="text-green-400" size={16} />;
      case "pending":
      case "sent":
        return <Clock className="text-yellow-400" size={16} />;
      case "failed":
        return <AlertCircle className="text-red-400" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "text-green-300";
      case "pending":
      case "sent":
        return "text-yellow-300";
      case "failed":
        return "text-red-300";
      default:
        return "text-gray-300";
    }
  };

  return (
    <tr className="border-b border-gray-600 hover:bg-gray-700 bg-opacity-30 transition">
      <td className="px-6 py-4 text-sm text-white">
        {invoice.invoice_number}
      </td>
      <td className="px-6 py-4 text-sm text-gray-300">
        {new Date(invoice.issued_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-white">
        ${invoice.amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-sm">
        <div className={`flex items-center gap-2 ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-400">
        {invoice.due_date
          ? new Date(invoice.due_date).toLocaleDateString()
          : "-"}
      </td>
      <td className="px-6 py-4 text-sm">
        {invoice.pdf_url ? (
          <a
            href={invoice.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition"
          >
            <Download size={16} />
            Download
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
    </tr>
  );
};

export default function InvoiceHistory({ invoices = [] }) {
  if (invoices.length === 0) {
    return (
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">
          No Invoices Yet
        </h3>
        <p className="text-gray-500">
          Your invoices will appear here once you upgrade to a paid plan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600">
      <table className="w-full">
        <thead className="bg-gray-800 bg-opacity-50 border-b border-gray-600">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Invoice #
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Amount
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Due Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
