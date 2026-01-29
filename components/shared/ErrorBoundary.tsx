/**
 * Error Boundary Component
 * Catches React component errors and displays a user-friendly message
 */

"use client";

import React from "react";
import { logError } from "@/lib/utils/errors";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, "ErrorBoundary");
    console.error("Error caught by boundary:", errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md rounded-lg bg-card p-6 shadow-card">
            <h2 className="text-h2 mb-4 text-accentNegative">
              Something went wrong
            </h2>
            <p className="text-body mb-4 text-textSecondary">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.resetError}
              className="rounded-button bg-accentPrimary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accentPrimaryHover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
