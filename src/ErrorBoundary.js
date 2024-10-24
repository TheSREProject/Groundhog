// src/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Lifecycle method to update state when an error is caught
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Log the error to an external service if needed
  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary: ", error, errorInfo);
    // Here, you could also send the error to a logging service, if desired
    // logErrorToService(error, errorInfo);
  }

  // Render the fallback UI if an error has been caught
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      );
    }

    // Render children components if no error has occurred
    return this.props.children;
  }
}

export default ErrorBoundary;
