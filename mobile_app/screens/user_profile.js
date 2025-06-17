import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import ip from '../connections/ip';
import colors from '../constants/colors';
import { useAlert } from '../context/AlertContext';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

const { height, width } = Dimensions.get('window');

export default function UserProfile({ navigation }) {
  const { showAlert, hideAlert } = useAlert();

  const route = useRoute();
  const { vin, userId } = route.params || {};
  const [name, setName] = useState('');
  const [speedLimit, setSpeedLimit] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [aggressiveDriving, setAggressiveDriving] = useState('');
  const [drowsiness, setDrowsiness] = useState('');
  const [focus, setFocus] = useState('');
  const [drivingScore, setDrivingScore] = useState(0);
  const [image, setImage] = useState('');
  const [scoreLottie, setScoreLottie] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        showAlert('Loading...', 'loading');
        const response = await axios.get(`http://${ip}:5000/api/users/${userId}`);
        const userData = response.data.user;

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

          if (userData.driving_score === 0) {
            setScoreLottie(require('../assets/border-success-secoundry.json'));
          } else if (userData.driving_score < 3) {
            setScoreLottie(require('../assets/border-success.json'));
          } else if (userData.driving_score < 7) {
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

    if (userId) {
      fetchUserData();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../assets/Background-blured.jpg')}
      />
      <ScrollView style={styles.scrollContainer}>
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
       

        <View style={[styles.externalContainer,{height:520}]}>

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

            <View style={{...styles.infoContainer,borderBottomWidth: 0}}>
              <Text style={styles.infoText}>Focus</Text>
              <Text style={styles.infoTextValue}>{focus}</Text>
            </View>
        </View>




        <View style={styles.scoreContainer}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  backgroundImage: {
    width: width,
    height: height * 1.1,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  profileContainer:{
    justifyContent:'center',
    alignItems:'center',
    marginVertical: 20,
  },
  imageContainer: {
    width: width * 0.60 ,
    height: width * 0.60,
    marginBottom: 20,
    borderRadius: 500,
    overflow:"hidden",
    backgroundColor: colors.background_primary,
  },
  profileImage: {
    height: height * 0.45,
  },
  scrollContainer: {
    width: width,
    marginBottom: 20,
  },
  name: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    alignSelf: 'center',
  },
  infoContainer: {
    // backgroundColor: colors.background_primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    padding: 20,
    width: "90%",
    height: height * 0.1,
    marginVertical: 5,
    // marginHorizontal: 10,
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
    // paddingRight:20,
    fontWeight: 'bold',
    textAlign:'left',
    width: 70,
  },
  externalContainer:{
    backgroundColor: colors.background_secondary,
    marginHorizontal:10,
    borderRadius:20,
    overflow: 'hidden',
    alignItems:'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 150,
  },
  scoreContainer: {
    marginTop: 40,
    width: width*0.95,
    marginHorizontal: width*0.025,
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
    elevation: 20,  // Android shadow
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  scoreOuterCircle: {
    width: width,
    height: 250,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf:'center',
    overflow: 'hidden',
  },
  containerMainText:{
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 20,
    marginLeft: 20,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
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
});
