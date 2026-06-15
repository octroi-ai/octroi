import React from "react";

interface StatusBadgeProps {
  status: "compliant" | "non_compliant" | "review_needed" | "not_assessed";
  label?: string;
}

const STATUS_CONFIG = {
  compliant: { bg: "bg-green-100", text: "text-green-800", label: "Conforme" },
  non_compliant: { bg: "bg-red-100", text: "text-red-800", label: "Non conforme" },
  review_needed: { bg: "bg-yellow-100", text: "text-yellow-800", label: "À vérifier" },
  not_assessed: { bg: "bg-gray-100", text: "text-gray-800", label: "Non évalué" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {label || config.label}
    </span>
  );
}
