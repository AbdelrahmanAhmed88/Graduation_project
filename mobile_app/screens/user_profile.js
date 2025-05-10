import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import ip from '../connections/ip';
import colors from '../constants/colors';
import { useAlert } from '../context/AlertContext';

const { height, width } = Dimensions.get('window');

export default function UserProfile() {
  const { showAlert, hideAlert } = useAlert();

  const route = useRoute();
  const { vin , userId} = route.params || {}; 
  const [name, setName] = useState('');
  const [drivingDuration, setDrivingDuration] = useState('');
  const [speedLimit, setSpeedLimit] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [aggressiveDriving, setAggressiveDriving] = useState('');
  const [drowsiness, setDrowsiness] = useState('');
  const [focus, setFocus] = useState('');
  const [image, setImage] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        showAlert('Loading...', 'loading');
        const response = await axios.get(`http://${ip}:5000/api/users/${userId}`);
        const userData = response.data.user;
        if (userData) {
          setName(userData.name);
          setSpeedLimit(userData.speed_limit ? "Enabled" : "Disabled");
          setMaxSpeed(`${userData.max_speed} KM/H`);
          setAggressiveDriving(userData.aggressive_mode ? "Enabled" : "Disabled");
          setDrowsiness(userData.drowsiness_mode ? "Enabled" : "Disabled");
          setFocus(userData.focus_mode ? "Enabled" : "Disabled");
          setDrivingDuration("1 Hour"); // or handle dynamically if needed

          // fetch user image
          const imageUrl = await`http://${ip}:5000/users/images/${userData.image}`;
          setImage(imageUrl);
          hideAlert();
        }
      } catch (error) {
        // console.error("Error fetching user data:", error);
        if (error.response.status === 404) {
          showAlert('User not found', 'error');
        }
      }
    };
  
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return (
    <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>

        <View style={styles.imageContainer}>
        {image ? (
            <Image
              source={{ uri: image }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require("../assets/profile.png")} // Default image in case of failure
              style={styles.profileImage}
              resizeMode="cover"
            />
          )}
        </View>

        <Text style={styles.name}>{name}</Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Driving Duration</Text>
            <Text style={styles.infoTextValue}>1 Hour</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Speed Limit</Text>
            <Text style={styles.infoTextValue}>{speedLimit}</Text>
          </View>


          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Max Speed</Text>
            <Text style={styles.infoTextValue}>{maxSpeed}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Aggressive Driving</Text>
            <Text style={styles.infoTextValue}>{aggressiveDriving}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Drowsiness</Text>
            <Text style={styles.infoTextValue}>{drowsiness}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Focus</Text>
            <Text style={styles.infoTextValue}>{focus}</Text>
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background_primary,
  },
  backgroundImage: {
    width: width,
    height: height*1.1,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  imageContainer: {
    width: width,
    height: height * 0.45,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'flex-start',
    backgroundColor: colors.background_primary,
  },
  profileImage: {
    height: height * 0.7,
    width:width,
  },
  scrollContainer: {
    width: width,
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginTop: height * 0.47,
    alignSelf: 'center',
  },
  // rowContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   paddingHorizontal: 10,
  //   marginTop: 10,
  // },
  infoContainer: {
    backgroundColor: colors.background_primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    padding: 20,
    width: width*0.94,
    height: height * 0.1,
    marginVertical: 10,
    marginHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoTextValue: {
    color: '#A16455',
    alignSelf:'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
