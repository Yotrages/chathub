'use client';
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/libs/redux/store';

interface ClientProviderProps {
  children: ReactNode;
}

const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        } 
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ClientProvider;
