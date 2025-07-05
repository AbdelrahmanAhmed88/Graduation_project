import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useRoute } from '@react-navigation/native';
import colors from '../constants/colors';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { getSelectedVehicle } from '../storage/vehicleStorage';
import { BlurView } from 'expo-blur';
import { useAlert } from '../context/AlertContext';
import ip from '../connections/ip';
import * as ScreenOrientation from 'expo-screen-orientation';
const { height, width } = Dimensions.get('window');
import model_A_image from '../assets/model_A_with_no_background.png';
import model_B_image from '../assets/model_B_with_no_background.png';
import model_C_image from '../assets/model_C_with_no_background.png';

import NfcManager, {Ndef,NfcTech} from 'react-native-nfc-manager';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
  }),
});

export default function HomeScreen({ navigation }) {
  const { showAlert, hideAlert } = useAlert();
  const [vehicle, setVehicle] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [currentDriverID, setCurrentDriverID] = useState(null);
  const [orientation, setOrientation] = useState(1);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [styles, setStyles] = useState(portraitStyles(screenWidth, screenHeight));
  const socket = useRef(null);
  const [notification, setNotification] = useState("There is no notifications");

  //nfc part
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcTag, setNfcTag] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      const selectedVehicle = await getSelectedVehicle();
      if (selectedVehicle) {
        setVehicle(selectedVehicle);
      }
    };
    fetchVehicle();
  }, []);

  useEffect(() => {
    if (vehicle?.vin) {
      fetchCurrentDriverImage();
    }
  }, [vehicle]);

  useEffect(() => {
    async function initNfc() {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);

      if (supported) {
        await NfcManager.start();

        const enabled = await NfcManager.isEnabled(); // Check if NFC is enabled
        setNfcEnabled(enabled);
      }
    }

    initNfc();
  }, []);

  async function writeNdef() {
    if (!nfcSupported) {
      showAlert('This device does not support NFC', 'error');
      return;
    }

    if (!nfcEnabled) {
      showAlert('NFC Disabled', 'Please enable NFC in system settings', 'error');
      return;
    }

    try {
      const message = [Ndef.textRecord('Hello from React Native')];
      await NfcManager.requestTechnology(NfcTech.Ndef);
      await NfcManager.writeNdefMessage(message);
      showAlert('Success', 'NDEF message sent!', 'success'); 
    } catch (ex) {
      console.warn('Error writing NFC', ex);
      showAlert('Error', 'Failed to write to NFC', 'error');  
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  const model = vehicle?.model;
  const vin = vehicle?.vin;

  const fetchCurrentDriverImage = async () => {
    try {
      const response = await axios.get(`http://${ip}:5000/api/vehicles/${vin}/currentDriver`);
      const userId = response.data.currentDriver.user_id;
      setCurrentDriverID(userId);
      if (userId) {
        const imageUrl = `http://${ip}:5000/users/images/${userId}.jpeg`;
        setImageUrl(imageUrl);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
      } else {
        showAlert('An error occurred', 'error');
      }
    }
  };

  useEffect(() => {
    fetchCurrentDriverImage();
  }, [vin]);

  useEffect(() => {
    if (!ip || !vin) return;

    const initializeWebSocket = () => {
      const ws = new WebSocket(`ws://${ip}:5000`);
      socket.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            vehicle_id: vin,
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.message_title === "MOBILECMD") {
            // Handle MOBILECMD case
          } else {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Car Alert',
                body: msg.message || 'New message from car',
              },
              trigger: null,
            });
            setNotification(msg.message);
          }

          if (msg.control_type === "update_current_user") {
            fetchCurrentDriverImage();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error.message);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err.message);
      };

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        setTimeout(() => initializeWebSocket(), 3000);
      };
    };

    initializeWebSocket();

    return () => {
      console.log('Cleaning up WebSocket connection');
      socket.current?.close();
    };
  }, [vin]);

  const sendCMDtoServer = async (cmd) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      const controlCmd = {
        vehicle_id: vin,
        message_title: "MOBILECMD",
        message: cmd,
      };
      socket.current.send(JSON.stringify(controlCmd));
    } else {
      console.warn('WebSocket is not open');
    }
  };

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      setOrientation(orientationInfo.orientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    const styleFn = orientation === 1 ? portraitStyles : landscapeStyles;
    setStyles(styleFn(screenWidth, screenHeight));
  }, [orientation, screenWidth, screenHeight]);

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const testing = () => {
    console.log('testing');
    console.log('orientation: ' + orientation);
    console.log('screenWidth: ' + screenWidth);
    console.log('screenHeight: ' + screenHeight);
  };

  let imageSource = null;
  if (model === 'Model A') {
    imageSource = model_A_image;
  } else if (model === 'Model B') {
    imageSource = model_B_image;
  } else if (model === 'Model C') {
    imageSource = model_C_image;
  }

  return (
    <View style={styles.container}>
      <Image style={styles.backgroundImage} source={require('../assets/Background.jpg')} />
      <ScrollView
        style={[styles.ScrollViewStyle, { width: screenWidth, height: screenHeight }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row_one}>
          <View style={styles.carControl}>
            <Text style={styles.carName}>{model}</Text>
            <Image source={imageSource} style={styles.carImage} resizeMode="contain" />
            {/* <Text style={styles.statusText}>
              car is <Text style={styles.lockedText}>LOCKED</Text>
            </Text> */}
            <View style={styles.buttonRow}>
              <CustomButton icon="lock" onPress={() => sendCMDtoServer("LOCK")} />
              <CustomButton icon="unlock" onPress={() => writeNdef()} />
              <CustomButton icon="lightbulb-o" onPress={() => sendCMDtoServer("lightbulb")} />
              <CustomButton icon="volume-up" onPress={() => sendCMDtoServer("ALARM")} />
              <CustomButton image={require('../assets/fan-icon.png')} onPress={() => sendCMDtoServer("fan")} />
            </View>
          </View>
          <View style={styles.container_two}>
            <View style={styles.profile_status_Container}>
              <TouchableOpacity
                style={styles.profile_status_buttons}
                onPress={() => navigation.navigate('currentDriver', { vin, currentDriverID, scrollTo: 'drowsiness' })}
              >
                <Image source={require('../assets/emoji/Awake.png')} style={styles.emoji} />
                <Text style={styles.emojiText}>Awake</Text>
              </TouchableOpacity>
              {currentDriverID ? (
                <View style={styles.profile_status_buttons}>
                  <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => navigation.navigate('currentDriver', { vin, currentDriverID })}
                  >
                    <View style={styles.outerCircle}>
                      <Image source={{ uri: imageUrl }} style={styles.profileImage} />
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profile_status_buttons}>
                  <TouchableOpacity style={styles.profileContainer} onPress={fetchCurrentDriverImage}>
                    <View style={styles.outerCircle}>
                      <Image source={require('../assets/no_driver.png')} style={styles.profileImage} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.notificationBar}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <View style={styles.shadowCard} />
              <View style={styles.notification}>
                <FontAwesome6 name="user-check" size={24} color={colors.primary} />
                <Text style={styles.notificationText}>{notification}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomNavBlurContainer}>
        <BlurView
          style={styles.bottomNavBlur}
          intensity={40}
          tint="systemMaterialDark"
          experimentalBlurMethod="dimezisBlurView"
        >
          <View style={styles.bottomNavBlurOverlay}>
            <TouchableOpacity onPress={() => navigation.navigate('Garage')}>
              <FontAwesome6 name="square-parking" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome6 name="car" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('settings', { vin: vin })}>
              <Feather name="settings" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const portraitStyles = (screenWidth, screenHeight) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ScrollViewStyle: {
    padding: 10,
    marginTop: 30,
  },
  scrollContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    height: screenHeight * 1.1,
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  carControl: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    height: screenHeight * 0.6,
    overflow: 'hidden',
    paddingTop: 20,
  },
  carName: {
    fontSize: 30,
    color: colors.white,
    fontWeight: 'bold',
  },
  carImage: {
    width: screenWidth,
    height: '60%',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
  },
  lockedText: {
    color: 'red',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: colors.background_secondary,
  },
  container_two: {},
  profile_status_Container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 10,
  },
  profile_status_buttons: {
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 165,
    height: 150,
  },
  emoji: {
    width: 100,
    height: 100,
  },
  emojiText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 19,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 150,
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.secondary,
    borderStyle: 'dotted',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBar: {
    backgroundColor: colors.background_secondary,
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
    height: 130,
  },
  notification: {
    backgroundColor: colors.background_primary,
    flexDirection: 'row',
    width: '100%',
    height: 60,
    borderRadius: 15,
    paddingLeft: 25,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  shadowCard: {
    position: 'absolute',
    top: 45,
    left: 13,
    width: '98%',
    height: 60,
    borderRadius: 15,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  notificationTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationText: {
    color: colors.primary,
    paddingLeft: 15,
    fontSize: 16,
    width: '85%',
  },
  bottomNavBlurContainer: {
    position: 'absolute',
    bottom: 20,
    width: screenWidth * 0.9,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 100,
    elevation: 20,
  },
  bottomNavBlur: {
    width: screenWidth * 0.9,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    height: 60,
  },
  bottomNavBlurOverlay: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
});

const landscapeStyles = (screenWidth, screenHeight) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ScrollViewStyle: {
    padding: 10,
    paddingTop: 0,
    marginTop: 10,
  },
  scrollContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    height: screenHeight,
  },
  row_one: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  carControl: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth * 0.5,
    height: screenHeight * 0.85,
    paddingTop: 10,
  },
  carName: {
    fontSize: 30,
    color: colors.white,
    fontWeight: 'bold',
  },
  carImage: {
    width: screenWidth * 0.5,
    height: screenHeight * 0.4,
  },
  statusText: {
    fontSize: 20,
    color: '#fff',
  },
  lockedText: {
    color: 'red',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
  },
  container_two: {
    width: screenWidth * 0.45,
  },
  profile_status_Container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  profile_status_buttons: {
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 165,
    height: 150,
  },
  emoji: {
    width: 100,
    height: 100,
  },
  emojiText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 19,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 150,
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.secondary,
    borderStyle: 'dotted',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBar: {
    backgroundColor: colors.background_secondary,
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
    height: 130,
  },
  notification: {
    backgroundColor: colors.background_primary,
    flexDirection: 'row',
    width: '100%',
    height: 60,
    borderRadius: 15,
    paddingLeft: 25,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  shadowCard: {
    position: 'absolute',
    top: 45,
    left: 13,
    width: '98%',
    height: 60,
    borderRadius: 15,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  notificationTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationText: {
    color: colors.primary,
    paddingLeft: 15,
    fontSize: 16,
    width: '85%',
  },
  bottomNavBlurContainer: {
    position: 'absolute',
    bottom: 20,
    width: screenWidth * 0.9,
    height: 50,
    borderRadius: 30,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 100,
    elevation: 20,
  },
  bottomNavBlur: {
    width: screenWidth * 0.9,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    height: 60,
  },
  bottomNavBlurOverlay: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
});