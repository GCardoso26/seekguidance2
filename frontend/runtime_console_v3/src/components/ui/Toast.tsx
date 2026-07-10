"use client";

import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export const customToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      className: "border-l-4 border-l-success",
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4 text-danger" />,
      className: "border-l-4 border-l-danger",
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
      className: "border-l-4 border-l-warning",
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="h-4 w-4 text-info" />,
      className: "border-l-4 border-l-info",
    });
  },

  xp: (amount: number, action: string) => {
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15">
          <span className="text-h4 text-warning" aria-hidden>
            ★
          </span>
        </div>
        <div>
          <p className="text-small font-medium">+{amount} XP!</p>
          <p className="text-hint">{action}</p>
        </div>
      </div>,
      { duration: 4000 },
    );
  },
};
