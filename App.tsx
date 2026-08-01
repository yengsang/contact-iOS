import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BootstrapScreen } from './src/screens/BootstrapScreen';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BootstrapScreen />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
