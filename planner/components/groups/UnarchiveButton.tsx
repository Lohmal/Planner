"use client";

import { useState } from "react";

interface UnarchiveButtonProps {
  id: number;
  type: "group" | "subgroup";
  onSuccess?: () => void;
}

export default function UnarchiveButton({ id, type, onSuccess }: UnarchiveButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnarchive = async () => {
    if (!confirm(`Bu ${type === "group" ? "grubu" : "alt grubu"} arşivden çıkarmak istediğinizden emin misiniz?`)) {
      return;
    }

    setIsProcessing(true);

    try {
      const endpoint = type === "group" ? `/api/groups/${id}/archive` : `/api/subgroups/${id}/archive`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archive: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `${type === "group" ? "Grup" : "Alt grup"} arşivden çıkarılırken bir hata oluştu`
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Force reload if no callback is provided
        window.location.reload();
      }
    } catch (error) {
      console.error(`${type === "group" ? "Grup" : "Alt grup"} arşivden çıkarılırken hata:`, error);
      alert(
        error instanceof Error
          ? error.message
          : `${type === "group" ? "Grup" : "Alt grup"} arşivden çıkarılırken bir hata oluştu`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button onClick={handleUnarchive} className="btn btn-sm btn-primary" disabled={isProcessing}>
      {isProcessing ? "İşleniyor..." : "Arşivden Çıkar"}
    </button>
  );
}
