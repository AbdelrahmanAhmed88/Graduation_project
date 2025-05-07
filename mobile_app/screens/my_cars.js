import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../constants/colors';
import CustomAlert from '../components/CustomAlert'; // Import the custom alert component


import { BlurView } from 'expo-blur';

//images to use as default in case there is no image provided by user
import model_A_image from '../assets/model_A_with_background.png';
import model_B_image from '../assets/model_B_with_background.png';
import model_C_image from '../assets/model_C_with_background.png';



const { height, width } = Dimensions.get('window');

export default function MyCarsScreen() {
  const [cars, setCars] = useState([]); // Corrected variable name here
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // Can be 'message' or 'loading'

  const showAlert = (message, type = 'message') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const navigation = useNavigation();  // Hook to access navigation

  const handleSubmit = () => {
    navigation.navigate('addNewCar');
  };

  const handleDelete = async (carToDelete) => {
    try {
      //console.log("Deleting car:", carToDelete);
      // Remove the car from state
      const updatedCars = cars.filter(car => car.vin !== carToDelete.vin);
      setCars(updatedCars);

      // Update AsyncStorage with the new list of cars
      await AsyncStorage.setItem('cars', JSON.stringify(updatedCars));

      // Show a success message
      showAlert('Car deleted successfully', 'success');
    } catch (error) {
      console.error("Failed to delete car", error);
      showAlert('Failed to delete car', 'message');
    }
  };

  useEffect(() => {
    const loadSavedCars = async () => {
      try {
        const savedCars = await AsyncStorage.getItem('cars');
        if (savedCars !== null) {
          const carsArray = JSON.parse(savedCars);
          const CarsList = [];
  
          for (const car of carsArray) {
            let imageSource;
            if (car.imageUri) {
              imageSource = { uri: car.imageUri };
            } else {
              if (car.model === 'Model A') {
                imageSource = model_A_image;
              } else if (car.model === 'Model B') {
                imageSource = model_B_image;
              } else if (car.model === 'Model C') {
                imageSource = model_C_image;
              }
            }
          
            CarsList.push({
              vin: car.vin,
              model: car.model,
              nickname: car.nickname,
              carImageUri: imageSource,
            });
          }
              
          setCars(CarsList);
        } else {
          console.log("No saved cars found.");
        }
      } catch (error) {
        console.error("Failed to load saved car data", error);
      }
    };
  
    loadSavedCars();
  }, []);
  

  return (
    <View style={styles.container}>
      {/* Custom Alert */}
      <CustomAlert visible={alertVisible} message={alertMessage} onClose={hideAlert} type={alertType} />

      <View style={styles.navigationBar}>
        <Text style={styles.navigationBarText}>Garage</Text>
      </View>

      <ScrollView style={styles.carCardsContainer}>


      <TouchableOpacity
        style={styles.carCard }
        onPress={() => navigation.navigate('Home', {
          model: 'Model A',
          nickname: 'Test Car',
          vin: 'TESTVIN123456',
          image: model_A_image
        })}>
        <Image source={model_A_image} style={styles.carCardImage} />
        <View style={styles.bottomInfo}>
          <View style={styles.bottomBlur}>
            <View>
              <Text style={styles.carCardNicknameText}>Test Car Made for navigation</Text>
              <Text style={styles.carCardModelText}>Model A</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

        {cars.map((car, index) => (
            <TouchableOpacity key={index} style={styles.carCard}   
            
            onPress={() => navigation.navigate('Home', {
              model: car.model,
              nickname: car.nickname,
              vin: car.vin,
              image: car.carImageUri
            })}>
            <Image source={car.carImageUri} style={styles.carCardImage} />

            <View style={styles.bottomInfo}>
                {/* <BlurView intensity={10} tint="dark" style={styles.bottomBlur}   experimentalBlurMethod="dimezisBlurView"> */}
                <View style={styles.bottomBlur}  >
                    <View>
                        <Text style={styles.carCardNicknameText}>{car.nickname}</Text>
                        <Text style={styles.carCardModelText}>{car.model}</Text>
                    </View>
                    <TouchableOpacity
                    style={[styles.deleteCarButton, { backgroundColor: colors.background_secondary }]}
                    onPress={() => handleDelete(car)}
                    >
                    <FontAwesome6 name="trash-can" size={24} color={colors.white} />
                    </TouchableOpacity>
                {/* </BlurView> */}
                </View>
            </View>
            </TouchableOpacity>

        ))}

        <TouchableOpacity
          style={[styles.addCarButton, { backgroundColor: colors.background_secondary }]}
          onPress={handleSubmit}
        >
          <FontAwesome6 name="plus" size={40} color={colors.primary} />
          <Text style={styles.submitText}>Add Car</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height,
    backgroundColor: colors.background_primary,
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
  navigationBarText: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  carCardsContainer: {
    paddingHorizontal: 10,
  },
  carCard: {
    height: 200,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginTop: 20,
    overflow:'hidden',
  },
  carCardTexts: {
    paddingLeft: 20,
    paddingBottom: 20,
  },
  carCardNicknameText: {
    fontSize: 22,
    color: colors.white,
    fontWeight:'bold',
  },
  carCardModelText: {
    fontSize: 18,
    color: colors.gray,
  },
  carCardImage: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    resizeMode: 'cover',
    position:'absolute',
    zIndex:-1,
  },
  blur: {
    width: "100%",
    height:'100%',
    position: 'absolute',
    bottom:0,
  },
  addCarButton: {
    height: 180,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    paddingTop: 10,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',

  },
  bottomBlur: {
    width: '100%',
    padding: 10,
    justifyContent:'space-between',
    flexDirection:'row',
  },
  deleteCarButton:
  {
    width: 40,
    height: 40,
    alignItems:'center',
    justifyContent: 'center',
    borderRadius:20,
  }
});
