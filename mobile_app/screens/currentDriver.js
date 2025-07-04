import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback ,useRef } from 'react';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import ip from '../connections/ip';
import colors from '../constants/colors';
import { useAlert } from '../context/AlertContext';
import LottieView from 'lottie-react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';

const { height, width } = Dimensions.get('window');

function formatDrivingDuration(startTime) {
  const now = Date.now() / 1000; // current time in seconds
  const duration = Math.floor(now - startTime); // total driving time in seconds

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours} hour(s)     ${minutes} minute(s)`;
  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `Just started`;
}

export default function UserProfile({ navigation }) {
  const { showAlert, hideAlert } = useAlert();

  const scrollViewRef = useRef(null);
  const drowsinessRef = useRef(null);
  const distractionRef = useRef(null);
  const emotionRef = useRef(null);

  const route = useRoute();
  const { vin, currentDriverID } = route.params || {};

  const [name, setName] = useState('');
  const [speedLimit, setSpeedLimit] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [aggressiveDriving, setAggressiveDriving] = useState('');
  const [drowsiness, setDrowsiness] = useState('');
  const [drowsinessState, setDrowsinessState] = useState('');
  const [drowsinessImage , setDrowsinessImage] = useState('')
  const [drowsinessText,setDrowsinessText] = useState('');
  const [drowsinessTextColor,setDrowsinessTextColor] = useState('');
  const [focus, setFocus] = useState('');
  const [focusState, setFocusState] = useState('');
  const [focusImage, setFocusImage] = useState('');
  const [focusText,setFocusText] = useState('');
  const [focusTextColor,setFocusTextColor] = useState('');
  const [emotionState, setEmotionState] = useState('neutral');
  const [emotionStateText,setEmotionStateText] = useState('');
  const [emotionStateTextColor,setEmotionStateTextColor] = useState('');
  const [emotionStateImage,setEmotionStateImage] = useState('');
  const [emotionContainerColor,setEmotionContainerColor] = useState('');
  const [drivingScore, setDrivingScore] = useState(0);
  const [image, setImage] = useState('');
  const [scoreLottie, setScoreLottie] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [drivingDuration,setDrivingDuration] = useState("")

  const fetchUserData = async () => {
    try {
      showAlert('Loading...', 'loading');
      const response = await axios.get(`http://${ip}:5000/api/users/${currentDriverID}`);
      const userData = response.data.user;

      const statusResponse = await axios.get(`http://${ip}:5000/api/vehicles/${vin}/currentDriver`);
      const DriverStatus = statusResponse.data.currentDriver;
      if(DriverStatus)
        {
          setDrowsinessState(DriverStatus.drowsiness_state.toLowerCase());
          setFocusState(DriverStatus.focus_state.toLowerCase());
          setEmotionState(DriverStatus.emotion_state.toLowerCase());
          setDrivingDuration(formatDrivingDuration(DriverStatus.start_time));
        }

      if (userData) {
        setName(userData.name);
        setSpeedLimit(userData.speed_limit ? 'Enabled' : 'Disabled');
        setMaxSpeed(`${userData.max_speed} KM/H`);
        setAggressiveDriving(userData.aggressive_mode ? 'Enabled' : 'Disabled');
        setDrowsiness(userData.drowsiness_mode ? 'Enabled' : 'Disabled');
        setFocus(userData.focus_mode ? 'Enabled' : 'Disabled');
        setDrivingScore(userData.driving_score);

        const imageUrl = `http://${ip}:5000/users/images/${userData.image}`;
        setImage(imageUrl);

        if (userData.driving_score === 10) {
          setScoreLottie(require('../assets/border-success-secoundry.json'));
        } else if (userData.driving_score > 7) {
          setScoreLottie(require('../assets/border-success.json'));
        } else if (userData.driving_score < 3) {
          setScoreLottie(require('../assets/border-warning.json'));
        } else {
          setScoreLottie(require('../assets/border-danger.json'));
        }


        hideAlert();
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showAlert('User not found', 'error');
      } else {
        showAlert('An error occurred', 'error');
      }
    }
  };


  
useEffect(() => {
  if (route.params?.scrollTo === 'drowsiness' && drowsinessRef.current && scrollViewRef.current) {
    setTimeout(() => {
      drowsinessRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current.scrollTo({ y: pageY - 200, animated: true }); // Adjust offset as needed
      });
    }, 500);
  }
  else if (route.params?.scrollTo === 'distraction' && distractionRef.current && scrollViewRef.current) {
    setTimeout(() => {
      distractionRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current.scrollTo({ y: pageY - 200, animated: true }); // Adjust offset as needed
      });
    }, 500);
  }
  else if (route.params?.scrollTo === 'emotion' && emotionRef.current && scrollViewRef.current) {
    setTimeout(() => {
      emotionRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current.scrollTo({ y: pageY - 200, animated: true }); // Adjust offset as needed
      });
    }, 500);
  }
}, [route.params?.scrollTo]);


  useEffect(() => {
    if (currentDriverID) {
      fetchUserData();
    }
  }, []);
  useEffect(() => {
    if (drowsinessState === "awake") {
      setDrowsinessImage(require('../assets/emoji/Awake.png'));
      setDrowsinessText('awake and alert');
      setDrowsinessTextColor(colors.secondary);
    } else if (drowsinessState === "break") {
      setDrowsinessImage(require('../assets/emoji/Break.png'));
      setDrowsinessText("Driver needs a break");
      setDrowsinessTextColor(colors.warning);
    } else if (drowsinessState === "drowsy") {
      setDrowsinessImage(require('../assets/emoji/Drowsy.png'));
      setDrowsinessText("Feeling drowsy — stay alert");
      setDrowsinessTextColor(colors.warning);
    } else if (drowsinessState === "asleep") {
      setDrowsinessImage(require('../assets/emoji/Asleep.png'));
      setDrowsinessText("asleep Immediate attention required!")
      setDrowsinessTextColor(colors.danger);
    }
  }, [drowsinessState]);

  useEffect(() => {
    if(emotionState === "angry")
    {
      setEmotionStateImage(require('../assets/emotions/Angry.png'));
      setEmotionStateText('angry');
      setEmotionStateTextColor(colors.danger);
      setEmotionContainerColor("#FF843E");
    }
    else if (emotionState === "happy")
    {
      setEmotionStateImage(require('../assets/emotions/Happy.png'));
      setEmotionStateText('happy');
      setEmotionStateTextColor(colors.secondary);
      setEmotionContainerColor("#FDDD6F");
    }
    else if (emotionState === "neutral")
    {
      setEmotionStateImage(require('../assets/emotions/Neutral.png'));
      setEmotionStateText('neutral');
      setEmotionStateTextColor(colors.secondary);
      setEmotionContainerColor("#DFEBFF");
    } 
    else if (emotionState === "sad")
    {
      setEmotionStateImage(require('../assets/emotions/Sad.png'));
      setEmotionStateText('sad');
      setEmotionStateTextColor(colors.warning);
      setEmotionContainerColor("#8CA4EE");
    }
    else if (emotionState === "fear")
    {
      setEmotionStateImage(require("../assets/emotions/Fear.png"));
      setEmotionStateText('fear');
      setEmotionStateTextColor(colors.warning);
      setEmotionContainerColor("#A1E7EB");
    }
  },[emotionState]);
  
  useEffect(() =>{ 
    if(focusState === "focused")
    {
      setFocusImage(require('../assets/driver_focus_state/focused.png'));
    }
    else if (focusState === "distracted")
    {
      setFocusImage(require('../assets/driver_focus_state/unfocused.png'));
    }
  },[focusState])


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../assets/Background-blured.jpg')}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
            <FontAwesome6 name="drivers-license" size={27} color={colors.primary} />
            <Text style={styles.title}>Current Driver</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../assets/profile.png')}
                style={styles.profileImage}
                resizeMode="cover"
              />
            )}
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>

        <View style={[styles.externalContainer, { height: 520 }]}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Driving Duration</Text>
            <Text style={styles.infoTextValue}>{drivingDuration}</Text>
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

          <View style={{ ...styles.infoContainer, borderBottomWidth: 0 }}>
            <Text style={styles.infoText}>Focus</Text>
            <Text style={styles.infoTextValue}>{focus}</Text>
          </View>
        </View>

        <View style={styles.singleContainers}>
          <View style={styles.overlay}>
            <Text style={styles.containerMainText}>Driving Score</Text>
            <View style={styles.scoreOuterCircle}>
              {scoreLottie ? (
                <LottieView
                  source={scoreLottie}
                  autoPlay
                  loop
                  style={styles.scoreInnerCircle}
                />
              ) : null}
              <Text style={styles.scoreText}>{drivingScore}</Text>
            </View>
          </View>
        </View>

        <View ref={drowsinessRef} style={styles.singleContainers}>
          <View style={styles.overlay}>
            <Text style={styles.containerMainText}>Drowsiness Monitor</Text>
            <Image
              source={drowsinessImage}
              style={styles.drowsiness_container_image}
              resizeMode="contain"
            />
            <Text style={styles.singleContainerText}>
              <Text style={{color: colors.primary}}>Driver is </Text>
              <Text style={[styles.StatusValue, { color: drowsinessTextColor }]}>
                {drowsinessText}
              </Text>
            </Text>
          </View>
        </View>

        <View ref={distractionRef} style={styles.singleContainers}>
          <View style={styles.overlay}>
            <Text style={styles.containerMainText}>Distraction Mode</Text>
            <Image
              source={focusImage}
              style={styles.drowsiness_container_image}
              resizeMode="contain"
            />
            <Text style={{...styles.singleContainerText,textAlign:'center',marginTop: 20}}>
              <Text style={{color: colors.primary}}>Driver is </Text>
              <Text style={[styles.StatusValue, { color: focusState === "focused" ? colors.secondary : colors.danger }]}>
                {focusState}
            </Text>
            </Text>
          </View>
        </View>

        <View ref={emotionRef} style={{...styles.singleContainers,marginBottom: 100,backgroundColor:emotionContainerColor}}>
          <View style={styles.overlay}>
            <Text style={{...styles.containerMainText,color:colors.black}}>Emotional State</Text>
            <Image
              source={emotionStateImage}
              style={styles.drowsiness_container_image}
              resizeMode="contain"
            />
            <Text style={{...styles.singleContainerText,textAlign:'center',marginTop: 20}}>
              <Text style={{color: colors.black}}>Driver seems </Text>
              <Text style={[styles.StatusValue, { color: colors.black }]}>
                {emotionState}
            </Text>
            </Text>
          </View>
        </View>

      </ScrollView>

      

      <View style={styles.bottomNavBlurContainer}>
        <BlurView
          style={styles.bottomNavBlur}
          intensity={40}
          tint="systemUltraThinMaterialDark" 
          experimentalBlurMethod="dimezisBlurView" 
        >
          <View style={styles.bottomNavBlurOverlay}>
            <TouchableOpacity onPress={() => navigation.navigate('Garage')}>
              <FontAwesome6 name="square-parking" size={30} color="white" />
            </TouchableOpacity>
           <TouchableOpacity onPress={() => navigation.popToTop()}>
              <FontAwesome6 name="car" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {navigation.navigate('settings',{vin: vin})}}
            >
              <Feather name="settings" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.background_secondary,
    width:width,
  },
  title: {
    fontSize: 25,
    marginLeft: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  backgroundImage: {
    width: width,
    height: height * 1.1,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  profileContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
    borderRadius: 500,
    overflow: 'hidden',
    backgroundColor: colors.background_primary,
  },
  profileImage: {
    height: height * 0.45,
  },
  scrollContainer: {
    width: width,
    objectFit:'cover',
    objectPosition:'top',
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    alignSelf: 'center',
  },
  infoContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    padding: 20,
    width: '90%',
    height: height * 0.1,
    marginVertical: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  infoTextValue: {
    color: '#A16455',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
    width: 85,
  },
  externalContainer: {
    backgroundColor: colors.background_secondary,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 150,
  },
  singleContainers: {
    marginTop: 40,
    width: width * 0.95,
    marginHorizontal: width * 0.025,
    height: 350,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background_secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 0,
  },
  singleContainerText:{
    alignSelf:'center',
    fontSize:20,
    width:"70%",
  },
  StatusValue:{
    fontWeight: 'bold',
  },
  scoreOuterCircle: {
    width: width,
    height: 250,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  containerMainText: {
    fontWeight:'bold',
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    marginVertical: 20,
    marginLeft: 20,
  },
  scoreInnerCircle: {
    width: 250,
    height: 250,
    position: 'absolute',
  },
  scoreText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: colors.white,
  },
  drowsiness_container_image:{
    width:200,
    height:200,
    alignSelf: 'center',

  },
  bottomNavBlurContainer: {
    position: 'absolute',
    bottom: 20,
    width: width * 0.9,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 100,
    elevation: 20, // Android shadow
    // borderWidth: 2,
    borderColor: colors.primary, 
  },
  bottomNavBlur:{
    width: "100%",
    alignitems: 'center',
    justifyContent: "space-evenly",
    flexDirection: 'row',
    height: 60,
  },
  bottomNavBlurOverlay:{
    width:"100%",
    alignItems: 'center',
    justifyContent:'space-evenly',
    flexDirection:'row',
  }
});
