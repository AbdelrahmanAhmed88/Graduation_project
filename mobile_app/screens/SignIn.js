import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomForm from '../components/CustomForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ip from '../connections/ip';

export default function SignInScreen() {
  const navigation = useNavigation();

  const handleSignIn = async (formData) => {
    try {
      const { username, password } = formData;

      // Search for user by username (assuming username is unique)
      const users = await AsyncStorage.getAllKeys();
      let foundUser = null;
      for (let key of users) {
        const userData = JSON.parse(await AsyncStorage.getItem(key));
        if (userData.email === username && userData.password === password) {
          foundUser = userData;
          break;
        }
      }

      if (foundUser) {
        Alert.alert('Success', 'Sign in successful!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Invalid email or password!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Please sign in to your account</Text>
          <CustomForm
            fields={[{ name: 'username', label: 'Email' }, { name: 'password', label: 'Password' }]}
            onSubmit={handleSignIn}
            buttonText="Sign In"
          />
          <Text style={styles.linkText}>
            Don't have an Account? <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>Sign Up</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 60,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
});