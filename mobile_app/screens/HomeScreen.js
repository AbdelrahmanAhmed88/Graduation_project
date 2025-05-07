import React, { useState,useEffect, useMemo, useRef} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity,Dimensions,ScrollView } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useRoute } from '@react-navigation/native';
import colors  from '../constants/colors'; 
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';

import * as Notifications from 'expo-notifications';


import ip from '../connections/ip'

//dimentions and orientation
import * as ScreenOrientation from 'expo-screen-orientation';
const { height, width } = Dimensions.get('window');

//images to use as default in case there is no image provided by user
import model_A_image from '../assets/model_A_with_no_background.png';
import model_B_image from '../assets/model_B_with_no_background.png';
import model_C_image from '../assets/model_C_with_no_background.png';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
  }),
});


export default function HomeScreen({ navigation }) {

  const route = useRoute();
  const { model = 'Model A', nickname,vin,image } = route.params || {}; 

  //oriantaion part
  const [orientation, setOrientation] = useState(1);  // 1 stands for portrait and landscape can take 2,3,4 depending on the screen
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [styles, setStyles] = useState(portraitStyles(screenWidth, screenHeight));

  //websocket connection and notification part
    const socket = useRef(null);
    const [notification, setNotification] = useState("There is no notifications");
  
    useEffect(() => {
      if (!ip || !vin) return;
  
      const ws = new WebSocket(`ws://${ip}:5000`);
      socket.current = ws;
  
      ws.onopen = () => {
        console.log('WebSocket connection established');
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            vehicle_id: vin
          })
        );
      };
  
      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
  
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚗 Car Update',
              body: msg.message || 'New message from car',
            },
            trigger: null,
          });
          setNotification(msg.message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error.message);
        }
      };
  
      ws.onerror = (err) => {
        console.error('WebSocket error:', err.message);
      };
  
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
  
      return () => {
        console.log('Cleaning up WebSocket connection');
        ws.close();
      };
    }, []);
  

  
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
    }
  

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
      <Image style={styles.backgroundImage} source={require('../assets/Background.jpg')}/>

      <ScrollView 
        style={[styles.ScrollViewStyle,{width: screenWidth,height: screenHeight}]}
        contentContainerStyle={styles.scrollContent}
      >

          <View style={styles.row_one}>
              <View style={styles.carControl}>
              {/* Car Model Name */}
              <Text style={styles.carName}>{model}</Text>

              {/* Car Image */}
              <Image source={imageSource} style={styles.carImage} resizeMode='contain'  />

              {/* Car Status */}
              <Text style={styles.statusText}>
                car is <Text style={styles.lockedText}>LOCKED</Text>
              </Text>

              {/* Control Buttons Row */}
              <View style={styles.buttonRow}>
                <CustomButton icon="lock"/>
                <CustomButton icon="unlock" onPress={() => navigation.navigate('Control')} />
                <CustomButton icon="lightbulb-o" />
                <CustomButton icon="volume-up"  onPress={testing}/>
                <CustomButton image={require('../assets/fan-icon.png')} />
              </View>
            </View>

            {/* Driver Status and Profile */}
            <View style={styles.container_two}>
              <View style={styles.profile_status_Container}>
                <TouchableOpacity style={styles.profile_status_buttons}>
                <Image source={require('../assets/emoji/Awake.png')} style={styles.emoji} />
                  <Text style={styles.emojiText}>Awake</Text>
                </TouchableOpacity>
                <View style={styles.profile_status_buttons}>
                  
                  <TouchableOpacity style={styles.profileContainer} onPress={() => navigation.navigate('userProfile')}>
                  <View style={styles.outerCircle}>
                    <Image source={require('../assets/profile.png')} style={styles.profileImage} />
                  </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notification Bar */}
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


      {/* Bottom Navigation */}
      <View style={[styles.bottomNav,{width:screenWidth}]}>
        <TouchableOpacity onPress={() => navigation.navigate('Garage')}>
          <FontAwesome6 name="square-parking" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome6 name="car" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Feather name="settings" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const portraitStyles = (screenWidth,screenHeight) => StyleSheet.create({
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
    height: screenHeight*1.1,
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
    height: screenHeight * 0.6 ,
    overflow:'hidden',
    paddingTop: 20,
  },
  carName: {
    fontSize: 30,
    color: colors.white,
    fontWeight: 'bold',
  },
  carImage: {
    width: screenWidth,
    height: "60%",
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
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
    marginBottom: 20,
  },
  container_two: {

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
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    justifyContent: 'space-around',
    backgroundColor: colors.background_secondary,
    padding: 10,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
});

const landscapeStyles = (screenWidth,screenHeight) => StyleSheet.create({
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
    justifyContent:'space-between',
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
    width: screenWidth*0.5,
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
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    justifyContent: 'space-around',
    backgroundColor: colors.background_secondary,
    padding: 10,
  },
  navIcon: {
    width: 30,
    height: 30,
  },

});

