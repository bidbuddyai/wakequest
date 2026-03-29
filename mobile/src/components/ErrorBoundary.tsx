import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0E27', padding: 20 }}>
          <ScrollView>
            <Text style={{ color: '#FF6B35', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
              App Error
            </Text>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>
              Error: {this.state.error?.toString()}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 20 }}>
              Stack Trace:
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 10 }}>
              {this.state.errorInfo?.componentStack}
            </Text>
            <Pressable
              onPress={this.handleRetry}
              style={{
                backgroundColor: '#FF6B35',
                padding: 15,
                borderRadius: 10,
                marginTop: 30,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                Retry
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
