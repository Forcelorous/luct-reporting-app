import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { auth, firestore } from '../services/FirebaseConfig';

import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import RoleBasedTabs from './RoleBasedTabs';

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#c9a84c" />
    </View>
  );
}

export default function AuthNavigator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snapshot = await firestore
            .collection('users')
            .doc(firebaseUser.uid)
            .get();

          const userRole = snapshot.exists
            ? snapshot.data().role
            : 'Student';

          setRole(userRole);
        } catch (error) {
          console.error('Error fetching role:', error);
          setRole('Student');
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="RoleBasedTabs">
          {() => <RoleBasedTabs role={role} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});