import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import CustomForm from '../components/CustomForm';
import axios from 'axios';
import ip from '../connections/ip';
import colors from '../constants/colors';
import CustomAlert from '../components/CustomAlert';

export default function SignInScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { vin , userId , userName} = route.params || {}; 

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // Can be 'message' or 'loading'
  const [navigationTarget, setNavigationTarget] = useState(null);
  const showAlert = (message, type = 'message', target = null) => {
    setAlertMessage(message);
    setAlertType(type); // Set the type to 'loading' for the loading alert
    setNavigationTarget(target);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    
  };


  const handleSignIn = async (formData) => {
    try {
      const {email, password} = formData;
      const userData = {vehicle_id:vin, email: email, password: password };    
      
      // Show loading alert while waiting for the response
      showAlert('Signing in', 'loading');
      const response = await axios.post(`http://${ip}:5000/api/vehicles/login`,userData);
      const matched = response.data.credentials;
      // console.log(matched);
      if (matched === 'matched') {
        showAlert('Signed in successfully!', 'success', { screen: 'editUserData', params: {vin,userId} });

        // navigation.navigate('settings',{vin: vin});
        return;
      } else {
        showAlert('email or password is incorrect','error');
        return;
      }
    } catch (error) {
      if (error.response.status === 404) {
        showAlert('email or password is incorrect','error');
      } else {
        // Handle other errors (network issues, unexpected responses, etc.)
        console.log(error);
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>

     {/* Custom Alert */}
     <CustomAlert visible={alertVisible} message={alertMessage} onClose={hideAlert} type={alertType} navigationTarget={navigationTarget} />


      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
        <Text style={styles.title}>Admin Access Required</Text>
        <Text style={styles.subtitle}>
          Only admins can modify <Text style={styles.userName}>{userName}</Text>'s profile. Please sign in with your admin account to proceed.
        </Text>
          <CustomForm
            fields={[{ name: 'email', label: 'Email' }, { name: 'password', label: 'Password' }]}
            onSubmit={handleSignIn}
            buttonText="Sign In"
          />
          {/* <Text style={styles.linkText}>
            Don't have an Account? <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>Sign Up</Text>
          </Text> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_secondary,
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
    color: colors.primary,
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
  userName: {
    color: colors.secondary,
    fontWeight: 'bold',
  }
});