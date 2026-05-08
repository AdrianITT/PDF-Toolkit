import React, { type ReactNode, type ErrorInfo } from 'react';
import { Result, Button, Typography } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ hasError: true, error, errorInfo: info.componentStack || null });
  }

  componentDidMount() {
    this.handleError = this.handleError.bind(this);
    window.addEventListener('error', this.handleError);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleError);
  }

  handleError(event: ErrorEvent) {
    console.error('[ErrorBoundary]', event);
    this.setState({ hasError: true, error: new Error(event.message) });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Algo salió mal"
          subTitle={this.state.error?.message || 'Ha ocurrido un error inesperado'}
          extra={
            <div>
              <Button type="primary" onClick={() => window.location.reload()}>
                Recargar Página
              </Button>
              <Button onClick={this.handleReset}>
                Intentar de Nuevo
              </Button>
              {this.state.errorInfo && (
                <details style={{ marginTop: 16, textAlign: 'left', maxHeight: 300, overflow: 'auto' }}>
                  <Typography.Text type="secondary">
                    <pre style={{ fontSize: 12 }}>{this.state.errorInfo}</pre>
                  </Typography.Text>
                </details>
              )}
            </div>
          }
        />
      );
    }
    return <>{this.props.children}</>;
  }
}
