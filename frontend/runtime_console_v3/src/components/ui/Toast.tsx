"use client";

import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export const customToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      className: "border-l-4 border-l-green-500",
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      className: "border-l-4 border-l-red-500",
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      className: "border-l-4 border-l-amber-500",
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="h-4 w-4 text-primary" />,
      className: "border-l-4 border-l-primary",
    });
  },

  xp: (amount: number, action: string) => {
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <span className="text-lg">⭐</span>
        </div>
        <div>
          <p className="font-medium">+{amount} XP!</p>
          <p className="text-xs text-muted-foreground">{action}</p>
        </div>
      </div>,
      { duration: 4000 },
    );
  },
};
