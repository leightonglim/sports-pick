import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

/**
 * Enhanced Error Boundary component to catch JavaScript errors in child components
 * and display a fallback UI with improved error reporting
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorStack: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorStack: error.stack 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console with more details
    console.error("Uncaught error:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // Save error details to state for display
    this.setState({ 
      errorInfo,
      errorStack: error.stack
    });
    
    // If you have error monitoring services like Sentry, you would log here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  // Helper to format component stack for better readability
  formatComponentStack(componentStack) {
    if (!componentStack) return "No component stack available";
    
    return componentStack
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map((line, i) => <div key={i}>{line.trim()}</div>);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI when an error occurs
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              borderTop: '4px solid #dc2626',
            }}
          >
            <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
            
            <Typography variant="h4" component="h1" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, an unexpected error has occurred. Our team has been notified.
            </Typography>
            
            {/* Always show basic error message - works in both production and development */}
            <Box sx={{ my: 3, textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="overline" display="block" gutterBottom>
                Error Message:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
                {this.state.error ? this.state.error.toString() : "Unknown error"}
              </Typography>
            </Box>
            
            {/* Show component stack trace - valuable in production too */}
            {this.state.errorInfo && (
              <Box sx={{ my: 3, textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="overline" display="block" gutterBottom>
                  Component Stack:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ overflow: 'auto', fontSize: '0.75rem' }}>
                  {this.formatComponentStack(this.state.errorInfo.componentStack)}
                </Typography>
              </Box>
            )}
            
            {/* Show error stack - helpful for debugging */}
            {this.state.errorStack && (
              <Box sx={{ my: 3, textAlign: 'left', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="overline" display="block" gutterBottom>
                  Error Stack:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ overflow: 'auto', fontSize: '0.75rem' }}>
                  {this.state.errorStack}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="outlined" onClick={this.handleGoHome}>
                Go to Home
              </Button>
              <Button variant="contained" onClick={this.handleReload}>
                Reload Page
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;