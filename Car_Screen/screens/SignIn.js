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
      const {email, password} = formData;
      const userData = { Email: email, Password: password };    

      const response = await axios.post(`http://${ip}:5000/api/signin`,userData);
      const users = response.data;
      if (users) {
        Alert.alert('Success', 'Sign in successful!');
        navigation.navigate('Garage');
      } else {
        Alert.alert('Error', 'Invalid email or password!');
      }
    } catch (error) {
      if (error.response.status === 404) {
        Alert.alert('Error', 'User not found.');
      } else {
        // Handle other errors (network issues, unexpected responses, etc.)
        console.log(error);
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Please sign in to your account</Text>
          <CustomForm
            fields={[{ name: 'email', label: 'Email' }, { name: 'password', label: 'Password' }]}
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