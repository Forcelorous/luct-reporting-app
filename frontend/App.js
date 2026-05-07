import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider } from './src/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

export default App;