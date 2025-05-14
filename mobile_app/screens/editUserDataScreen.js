import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, Image, ScrollView, TextInput, Switch, TouchableOpacity, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import ip from '../connections/ip';
import colors from '../constants/colors';
import { useAlert } from '../context/AlertContext';

const { height, width } = Dimensions.get('window');

export default function App() {
  const { showAlert, hideAlert } = useAlert();

  const route = useRoute();
  const { vin, userId } = route.params || {}; 
  const [name, setName] = useState('');
  const [drivingDuration, setDrivingDuration] = useState(''); 
  const [speedLimit, setSpeedLimit] = useState(false);
  const [maxSpeed, setMaxSpeed] = useState('');
  const [aggressiveDriving, setAggressiveDriving] = useState(false);
  const [drowsiness, setDrowsiness] = useState(false);
  const [focus, setFocus] = useState(false);
  const [image, setImage] = useState('');

  // Animated values for opacity of switches
  const [opacitySpeedLimit] = useState(new Animated.Value(1)); 
  const [opacityAggressiveDriving] = useState(new Animated.Value(1));
  const [opacityDrowsiness] = useState(new Animated.Value(1));
  const [opacityFocus] = useState(new Animated.Value(1));

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editMaxSpeed, setEditMaxSpeed] = useState('');

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`http://${ip}:5000/api/users/${userId}`);
      // console.log(response.data);
      const userData = response.data.user;
      if (userData) {
        setName(userData.name);
        setSpeedLimit(userData.speed_limit);
        setMaxSpeed(`${userData.max_speed}`);
        setAggressiveDriving(userData.aggressive_mode);
        setDrowsiness(userData.drowsiness_mode);
        setFocus(userData.focus_mode);
        setDrivingDuration("1 Hour"); // or handle dynamically if needed

        // Fetch user image
        const imageUrl = `http://${ip}:5000/users/images/${userData.image}`;
        setImage(imageUrl);

        // Set initial editable fields
        setEditName(userData.name);
        setEditMaxSpeed(`${userData.max_speed}`);
      }
    } catch (error) {
      if(error.response.status === 404)
        console.error("User not found");
    }
  };

  useEffect(() => {
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleSaveChanges = async () => {
    try {
      const updatedData = {
        name: editName.trim(),
        speed_limit: speedLimit,
        max_speed: parseInt(editMaxSpeed),
        aggressive_mode: aggressiveDriving,
        drowsiness_mode: drowsiness,
        focus_mode: focus
      };

      // Send updated data to backend
      const response = await axios.patch(`http://${ip}:5000/api/users/${userId}`, updatedData);
      if(editName !== name)
      {
        console.log("Updating vehicle name");
        // Update vehicle name in vehicle 
        console.log(vin);
        const vehicleResponse = await axios.patch(`http://${ip}:5000/api/vehicles/${vin}/users/${userId}`, {name: editName.trim()});
        console.log(vehicleResponse.data);
      }
      if (response.status === 200) {
        showAlert('data updated successfully!','success',{ screen: 'vehicleDrivers', params: {vin} });
        fetchUserData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Error updating user data.");
    }
  };

  // Animate the switches on toggle (simple opacity animation)
  const animateSwitch = (value, opacityValue) => {
    Animated.timing(opacityValue, {
      toValue: 1, // Full opacity when toggled
      duration: 200, // Duration of the fade-in/fade-out effect
      useNativeDriver: true,  // Using native driver for performance
    }).start();
  };

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
        <TextInput
            value={editName}
            onChangeText={setEditName}
            style={styles.name}
          />
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Speed Limit</Text>
          <Animated.View style={{ opacity: opacitySpeedLimit }}>
            <Switch
              value={speedLimit}
              onValueChange={(value) => {
                setSpeedLimit(value);
                animateSwitch(value, opacitySpeedLimit);  // Trigger opacity animation
              }}
              trackColor={{ false: colors.background_secondary, true: colors.primary }}
              thumbColor={speedLimit ? colors.primary : colors.secondary}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </Animated.View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Max Speed</Text>
          <TextInput
            value={editMaxSpeed}
            onChangeText={setEditMaxSpeed}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Aggressive Driving</Text>
          <Animated.View style={{ opacity: opacityAggressiveDriving }}>
            <Switch
              value={aggressiveDriving}
              onValueChange={(value) => {
                setAggressiveDriving(value);
                animateSwitch(value, opacityAggressiveDriving);
              }}
              trackColor={{ false: colors.background_secondary, true: colors.primary }}
              thumbColor={aggressiveDriving ? colors.primary : colors.secondary}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </Animated.View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Drowsiness</Text>
          <Animated.View style={{ opacity: opacityDrowsiness }}>
            <Switch
              value={drowsiness}
              onValueChange={(value) => {
                setDrowsiness(value);
                animateSwitch(value, opacityDrowsiness);
              }}
              trackColor={{ false: colors.background_secondary, true: colors.primary }}
              thumbColor={drowsiness ? colors.primary : colors.secondary}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </Animated.View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Focus</Text>
          <Animated.View style={{ opacity: opacityFocus }}>
            <Switch
              value={focus}
              onValueChange={(value) => {
                setFocus(value);
                animateSwitch(value, opacityFocus);
              }}
              trackColor={{ false: colors.background_secondary, true: colors.primary }}
              thumbColor={focus ? colors.primary : colors.secondary}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </Animated.View>
        </View>


        <View>
          <TouchableOpacity style={styles.Button} onPress={handleSaveChanges}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    width: width,
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
    width: width,
  },
  name: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginTop: height * 0.47,
    alignSelf: 'center',
  },
  infoContainer: {
    backgroundColor: colors.background_primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    padding: 20,
    width: width * 0.94,
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
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    textAlign: 'right',
    padding: 10,
    fontSize: 16,
    width: width * 0.6,
    color: '#A16455',
    height: 50,
  },
  Button: {
    backgroundColor: colors.secondary,
    width: width * 0.9,
    height: height * 0.07,
    marginBottom: 15,
    marginHorizontal: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
