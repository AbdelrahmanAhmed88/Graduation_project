import React, { useState,useEffect, useMemo, useRef} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity,Dimensions,ScrollView } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useRoute } from '@react-navigation/native';
import colors  from '../constants/colors'; 
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import LottieView from 'lottie-react-native';
import axios from 'axios';
import ip from '../connections/ip';
import Svg, { Line } from 'react-native-svg';



//dimentions and orientation

const { height, width } = Dimensions.get('window');

export default function DrivingScore({ navigation }) {

    const route = useRoute();
    const { vin,userId } = route.params || {}; 
    const [score, setScore] = useState(0);
    const [maxScore, setMaxScore] = useState(100);
    const [scoreLottie, setScoreLottie] = useState('');
    const [scoreText, setScoreText] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
          try {
            const response = await axios.get(`http://${ip}:5000/api/users/${userId}`);
            const user = response.data.user;
            setScore(user.driving_score);
            setScoreText(user.drivingScoreText);
      
            // Lottie logic
            if (user.driving_score == 0) {
              setScoreLottie(require('../assets/border-success-secoundry.json'));
            } else if (user.driving_score < 3) {
              setScoreLottie(require('../assets/border-success.json'));
            } else if (user.driving_score < 7) {
              setScoreLottie(require('../assets/border-warning.json'));
            } else {
              setScoreLottie(require('../assets/border-danger.json'));
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        };
      
        fetchUserData(); // Call the async function
      }, [userId]);
      


    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <FontAwesome6 name="drivers-license" size={24} color={colors.primary} />
            <Text style={styles.title}>Driving Score</Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreOuterCircle}>
          {scoreLottie ? (
            <LottieView
                source={scoreLottie}
                autoPlay
                loop
                style={styles.scoreInnerCircle}
                colorFilters={[
                {
                    keypath: '**',
                    color: colors.success,
                },
                ]}
            />
            ) : null}
            <Text style={{...styles.scoreText}}>{score}</Text>
          </View>
        </View>

            {/* Bottom Navigation */}
      <View style={[styles.bottomNav,{width:width}]}>
          <TouchableOpacity onPress={() => navigation.navigate('Garage')}>
            <FontAwesome6 name="square-parking" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <FontAwesome6 name="car" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity >
          <Feather name="settings" size={30} color="white" />
        </TouchableOpacity>
      </View>

      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      height: height,
      backgroundColor: colors.background_primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.background_secondary,
    },
      buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
    marginBottom: 20,
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
 title: {
    fontSize: 25,
    marginLeft: 15,
    fontWeight: 'bold',
    color: colors.primary,
 },
 scoreContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
 scoreOuterCircle: {
    width: 250,
    height: 250,
    borderRadius: 150,
    borderStyle: 'dotted',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInnerCircle: {
    width: 300,
    height: 300,
    position: 'absolute',
  },
  scoreText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: colors.white,
  },



});
  