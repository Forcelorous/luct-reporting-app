import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  ActivityIndicator, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import Input from '../../components/Input';
import CustomButton from '../../components/CustomButtons';
import { auth, firestore } from '../../services/FirebaseConfig';

const ROLES = ['Student', 'Lecturer', 'PRL', 'PL'];

const ROLE_LABELS = {
  Student:  { label: 'Student',             icon: '🎓' },
  Lecturer: { label: 'Lecturer',            icon: '👨‍🏫' },
  PRL:      { label: 'Principal Lecturer',  icon: '🧑‍💼' },
  PL:       { label: 'Program Leader',      icon: '👔' },
};

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!selectedRole) {
      Alert.alert('Error', 'Please select your role.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(trimmedEmail, password);
      await firestore.collection('users').doc(userCredential.user.uid).set({
        name: trimmedName,
        email: trimmedEmail,
        role: selectedRole,
        createdAt: new Date(),
      });
      Alert.alert('Success', `Account created as ${ROLE_LABELS[selectedRole].label}`);
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <Text style={styles.appName}>LUCT</Text>
        <Text style={styles.appSubtitle}>Reporting System</Text>
      </View>

  
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Select your role and fill in your details</Text>

        <Text style={styles.roleTitle}>I am a:</Text>
        <View style={styles.rolesGrid}>
          {ROLES.map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleCard,
                selectedRole === role && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={styles.roleIcon}>{ROLE_LABELS[role].icon}</Text>
              <Text style={[
                styles.roleLabel,
                selectedRole === role && styles.roleLabelSelected,
              ]}>
                {ROLE_LABELS[role].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {loading
          ? <ActivityIndicator size="large" color="#00ff55" style={{ marginTop: 16 }} />
          : <CustomButton title="Register" onPress={handleRegister} />
        }
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2b8db1',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#070606',
    letterSpacing: 4,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#301e1e',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#08ee00',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#513737',
    marginBottom: 10,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleCard: {
    width: '47%',
    borderWidth: 2,
    borderColor: '#311b1b',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  roleCardSelected: {
    borderColor: '#00ff2a',
    backgroundColor: '#eff6ff',
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff0000',
    textAlign: 'center',
  },
  roleLabelSelected: {
    color: '#1a56db',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#15ff00',
    fontSize: 14,
  },
  footerLink: {
    color: '#fff',
    fontWeight: '700',
  },
});