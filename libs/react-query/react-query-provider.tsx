'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [client] = useState(() => new QueryClient({defaultOptions: {
    queries: {
      networkMode: 'online', 
      retry: 2,
    }
  },
}));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export default ReactQueryProvider