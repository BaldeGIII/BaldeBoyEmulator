import React from "react";

// Define the props and state for ErrorBoundary
type ErrorBoundaryProps = {
  fallback: (error: Error) => React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * ErrorBoundary Component
 * Catches and handles runtime errors in child components.
 * Provides a fallback UI when errors occur.
 *
 * @example
 * <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
 *   <ChildComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Update state when an error is caught
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  // Log error details
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
