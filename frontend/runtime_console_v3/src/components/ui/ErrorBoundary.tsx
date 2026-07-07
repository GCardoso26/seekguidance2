"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { PageError } from "@/components/ui/async-state";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] items-center justify-center bg-luxury-onyx p-6">
            <PageError
              title="Algo deu errado"
              message="Ocorreu um erro inesperado. Recarregue a página ou tente novamente em instantes."
              onRetry={() => window.location.reload()}
            />
          </div>
        )
      );
    }

    return this.props.children;
  }
}
