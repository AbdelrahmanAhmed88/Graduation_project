import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomForm from '../components/CustomForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ip from '../connections/ip';

export default function SignUpScreen() {
  const navigation = useNavigation();

  const checkStorage = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    console.log('Stored data:', values);
  };

  const handleSignUp = async (formData) => {
    try {
      const { fullName, email, password } = formData; 
      const userData = { FullName: fullName, Email: email, Password: password };      

      const response = await axios.post(`http://${ip}:5000/api/signup`, userData);
      console.log(response.data);
      Alert.alert('Success', 'Account created');
      navigation.navigate('SignIn');
    } catch (error) {
      if (error.response.status === 404) {
        Alert.alert('Error', 'This email is already registered.');
      } else {
        // Handle other errors (network issues, unexpected responses, etc.)
        console.log(error);
        Alert.alert('Error', 'Failed to sign up. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Create New Account</Text>
          <Text style={styles.subtitle}>Please fill in to continue</Text>
          <CustomForm
            fields={[{ name: 'fullName', label: 'Full Name' }, { name: 'email', label: 'Email Address' }, { name: 'password', label: 'Password' }]}
            onSubmit={handleSignUp}
            buttonText="Sign Up"
          />
          <Text style={styles.linkText}>
            Have an Account? <Text style={styles.link} onPress={() => navigation.navigate('SignIn')}>Sign In</Text>
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
    marginBottom: 70,
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