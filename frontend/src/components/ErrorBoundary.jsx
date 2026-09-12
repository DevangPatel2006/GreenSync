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
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter font-body-md text-on-surface">
          <div className="bg-surface-container-lowest rounded-xl p-space-xl border border-surface-variant shadow-md text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-space-md">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-primary-container mb-space-xs">
              Something went wrong
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              Something went wrong on our end. Please try again in a moment.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm hover:opacity-95 transition-opacity inline-flex items-center gap-space-xs"
              type="button"
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
