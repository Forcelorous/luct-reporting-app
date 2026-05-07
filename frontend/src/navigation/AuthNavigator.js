import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/FirebaseConfig';

import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import RoleBasedTabs from './RoleBasedTabs';

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

export default function AuthNavigator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const snapshot = await getDoc(docRef);

          if (!snapshot.exists()) {
            console.warn('No Firestore profile found for UID:', firebaseUser.uid);
            await signOut(auth);
            Alert.alert(
              'Profile Not Found',
              'Your account profile is missing. Please register again.',
            );
            setLoading(false);
            return;
          }

          const data = snapshot.data();
          const userRole = (data.role || '').toLowerCase();

          console.log('User role (raw):', data.role, '→ normalized:', userRole);

          setRole(userRole);
          setUser(firebaseUser);
        } catch (error) {
          console.error('Error fetching role:', error.message);
          await signOut(auth);
          Alert.alert('Error', 'Could not load your profile. Please log in again.');
        }
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
      {user && role ? (
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
    backgroundColor: '#FFFFFF',
  },
});