import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GreenSync Uncaught Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-gutter font-body-md text-on-surface">
          <div className="max-w-md w-full bg-surface-container-lowest border border-surface-variant rounded-xl p-space-xl text-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-space-md">
              <span className="material-symbols-outlined text-[32px] text-error">warning</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
              Something went wrong
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              Something went wrong on our end. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm px-space-lg py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
