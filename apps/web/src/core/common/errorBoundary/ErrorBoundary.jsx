import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "react-feather";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onRetry === "function") {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.handleRetry)
          : this.props.fallback;
      }

      // Compact widget error UI
      if (this.props.compact) {
        return (
          <div className="card custom-card border-warning my-2">
            <div className="card-body p-3 d-flex align-items-center justify-content-between text-warning">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-warning flex-shrink-0" />
                <span className="fs-13 fw-medium">
                  {this.props.widgetName || "Widget"} temporarily unavailable
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                onClick={this.handleRetry}
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        );
      }

      // Full-section error UI
      return (
        <div className="card custom-card my-3 shadow-sm border-0">
          <div className="card-body text-center p-5">
            <div className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
              <AlertTriangle size={32} />
            </div>
            <h4 className="fw-semibold mb-2">
              {this.props.title || "Something went wrong in this section"}
            </h4>
            <p className="text-muted fs-14 mb-4">
              {this.props.message ||
                "An unexpected issue occurred while rendering this component. The rest of the application is still running normally."}
            </p>
            {this.state.error && (
              <div className="alert bg-light text-start p-3 mb-4 mx-auto" style={{ maxWidth: "600px" }}>
                <code className="text-danger fs-12 d-block text-break">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={this.handleRetry}
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
