import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  ActivityIndicator, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform,
  ScrollView, ImageBackground
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/FirebaseConfig';
import Input from '../../components/Input';
import CustomButton from '../../components/CustomButtons';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' :'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <Image
              source={require('../../../assets/icon.jpg')}
              style={styles.logo}
              resizeMode="cover"
            />
            <View style={styles.dividerLine} />
            <Text style={styles.tagline}>LUCT Reporting System</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to continue
            </Text>

            <Input
              label="Email:"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password:"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            {loading ? (
              <ActivityIndicator size="large" color="#c9a84c" style={{ marginTop: 20 }} />
            ) : (
              <CustomButton title="Sign In" onPress={handleLogin} />
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Register here</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.copyright}>
            © Limkokwing University of Creative Technology
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  flex: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logo: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    overflow: 'hidden', 
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#c9a84c'
  },
  dividerLine: { width: 60, height: 1.5, backgroundColor: '#c9a84c', marginBottom: 12 },
  tagline: { fontSize: 12, color: '#c9a84c', letterSpacing: 2.5, fontWeight: '700', textTransform: 'uppercase' },
  card: { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.75)', borderRadius: 18, padding: 24, borderWidth: 1.5, borderColor: '#c9a84c', elevation: 8, marginBottom: 24 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#c9a84c', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#aaaaaa', marginBottom: 20 },
  footer: { alignItems: 'center', marginBottom: 16 },
  footerText: { color: '#cccccc', fontSize: 14 },
  footerLink: { color: '#c9a84c', fontWeight: '700' },
  copyright: { fontSize: 11, color: '#888888', textAlign: 'center' },
});