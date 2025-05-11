import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text,TextInput, View, Dimensions, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';

import { useAlert } from '../context/AlertContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import axios from 'axios';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ip from '../connections/ip'
import colors  from '../constants/colors'; 

import CustomAlert from '../components/CustomAlert'; // Import the custom alert component



const { height, width } = Dimensions.get('window');

export default function AddNewCarScreen() {

  const { showAlert, hideAlert } = useAlert();

  const [vin, setVin] = useState('');
  const [model, setModel] = useState('');
  const [nickname, setNickname] = useState('');
  const [carImage, setCarImage] = useState(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // Can be 'message' or 'loading'
  const [navigationTarget, setNavigationTarget] = useState(null);


  const isValidVin = vin.length === 17;
  

  const handleImagePick = () => {
    Alert.alert(
      "Upload Image",
      "Choose an image source",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openImagePicker(),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };
  
  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need media library permissions.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      setCarImage(result.assets[0].uri);
    }
  };
  
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions.');
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      setCarImage(result.assets[0].uri);
    }
  };
  

  const handleSubmit = async () => {
  
    try {

      // Show loading alert while waiting for the response
      showAlert('Searching for vehicle', 'loading');
    
      const response = await axios.get(`http://${ip}:5000/api/vehicles/${vin}`);
      const data = response.data;
      if (data) {

            // Simulate an API call (replace this with your actual API call)
            setTimeout(() => {
              // After the "loading" state is finished, show a message
              showAlert('Vehicle Added Successfully','success',"Garage");
            }, 3000); // Simulating a 3-second delay

        
            const carModel = data.vehicle.car_model;
        if (carImage) {
          // Define the folder path (car_app)
          const carAppFolderPath = FileSystem.documentDirectory + 'car_app/';

          // Check if the folder exists, if not, create it
          const folderInfo = await FileSystem.getInfoAsync(carAppFolderPath);
          if (!folderInfo.exists) {
            await FileSystem.makeDirectoryAsync(carAppFolderPath, { intermediates: true });
          }

          // Generate the image's new URI in the car_app folder
          const imageName = carImage.split('/').pop();
          const imageUri = carAppFolderPath + imageName;

          // Copy the image to the new location inside car_app folder
          await FileSystem.copyAsync({
            from: carImage,
            to: imageUri,
          });
  
          // Get the existing cars from AsyncStorage (if any)
        const existingCars = JSON.parse(await AsyncStorage.getItem('cars')) || [];

        // Create a new car object
        const newCar = {
          vin,
          model :carModel,
          nickname,
          imageUri,
        };

        console.log("new car data form react = ",newCar);

        // Add the new car to the array
        existingCars.push(newCar);
        // console.log(data.vehicle.car_model);
        // Alert.alert("new car", JSON.stringify(newCar));

        // Save the updated array of cars to AsyncStorage
        await AsyncStorage.setItem('cars', JSON.stringify(existingCars));

        } else {
            // Get the existing cars from AsyncStorage (if any)
            const existingCars = JSON.parse(await AsyncStorage.getItem('cars')) || [];
            // Create a new car object
            const newCar = {
            vin,
            model :carModel,
            nickname,
            imageUri: null,
            };

            // Add the new car to the array
            existingCars.push(newCar);
            // console.log(data.vehicle.car_model);
            // Alert.alert("new car", JSON.stringify(newCar));

            // Save the updated array of cars to AsyncStorage
            await AsyncStorage.setItem('cars', JSON.stringify(existingCars));

        }
      } else {
        Alert.alert("Car Not Found", "No car data found for this VIN.");
      }
    } catch (error) {
      // console.log(error);
      showAlert('Vehicle Not Found','error');
      //Alert.alert("Car Not Found", "No car data found for this VIN.");
    }
  };

  const navigation = useNavigation();  // Hook to access navigation

  const handleCancel = () => {

    navigation.navigate('Garage');
  };

  return (
    <LinearGradient colors={["#006BFF","#034196","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B","#090A0B"]} style={styles.container}>
      
      <View style={styles.navigationBar}>
        <Text style={styles.navigationBarText}>Add Your Car</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vehicle Identification Number (VIN)</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. WBA8D9C50HA123456"
            maxLength={17}
            autoCapitalize="characters"
            value={vin}
            onChangeText={setVin}
          />
        </View>
        
        <Text style={styles.label}>Give your car a name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My Golf R"
          value={nickname}
          onChangeText={setNickname}
        />

        <Text style={styles.label}>Upload a car image (optional)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
          <FontAwesome6 name="upload" size={24} color= {colors.white} />
          <Text style={styles.uploadText}> Upload</Text>
        </TouchableOpacity>
        {carImage && <Image source={{ uri: carImage }} style={styles.image} />}



        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: isValidVin ? colors.primary : colors.background_secondary }]}
            onPress={handleSubmit}
            disabled={!isValidVin}
          >
            <Text style={styles.submitText}>Add Car</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.secondary }]}
            onPress={handleCancel}
          >
            <Text style={styles.submitText}>Cancel</Text>
          </TouchableOpacity>

          {/* this part was for backdoor testing */}
          {/* <Text style={styles.helpText} onPress={() => {navigation.navigate('SignIn')}}>Need Help?</Text> */} 
        </View>
          
      </View>

   
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height:height,
  },
  navigationBar: {
    marginTop: 40,
    width: width,
    height: height * 0.1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  navigationBarButtons: {
    position: 'absolute',
    left: 15,
    backgroundColor: '#006BFF',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationBarText: {
    fontSize: 25,
    color:  colors.white,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  inputContainer:{
    marginHorizontal: 15,
    height:height *0.9,
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: '500',
    color: colors.white,
  },
  input: {
    height:50,
    width: '100%',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color:colors.white,
    backgroundColor: colors.background_secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: colors.background_secondary,
  },
  uploadText: {
    color:colors.white,
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  bottomContainer:{
    position: 'absolute',
    bottom:15,
    width: '100%',
    marginBottom: 20,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
    textDecorationLine: 'underline',
    marginBottom: 40,
    color: colors.white,
  },
});
