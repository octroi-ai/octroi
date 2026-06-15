"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Une erreur est survenue
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {this.state.error?.message || "Erreur inattendue"}
              </p>
              <button
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Reessayer
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
