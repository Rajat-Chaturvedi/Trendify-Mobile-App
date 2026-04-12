// App.tsx — root entry point
// Requirements: 2.4, 12.2, 12.3

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { restoreSession } from './src/services/authService';
import { useAuthStore } from './src/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Restore auth session on app start
    restoreSession().then((token) => {
      if (token) {
        useAuthStore.getState().setToken(token);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary fallbackLabel="The app encountered an unexpected error.">
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
