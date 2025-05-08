import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useNavigation } from '@react-navigation/native';

export default function ControlScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Car Model Name */}
      <View style={styles.header}>
       
        <Text style={styles.title}>Model S Plaid</Text>
      </View>

      {/* Car Image */}
      <Image source={require('../assets/car_locked.png')} style={styles.carImage} />

      {/* Car Status */}
      <Text style={styles.statusText}>
        Car is <Text style={styles.unlockedText}>UNLOCKED</Text>
      </Text>

      {/* Battery Indicator */}
        <View style={styles.batteryContainer}>
        <Image source={require('../assets/battery-icon.png')} style={styles.batteryIcon} />
        <View style={styles.batteryBar}>
          <View style={[styles.batteryLevel, { width: '85%' }]} />  
        </View>
      </View>  
      
       {/* Control icons Row */}
       <View style={styles.buttonRow}>
        <CustomButton icon="lock" onPress={() => navigation.navigate('Home')}/>
        <CustomButton icon="unlock" />
        <CustomButton icon="lightbulb-o" />
        <CustomButton icon="volume-up" />
        <CustomButton image={require('../assets/fan-icon.png')} />
      </View>

  {/* Feature Controls */}
<View style={styles.featureBox}>
  <View style={styles.featureRow}>
    <CustomButton image={require('../assets/p.png')} />
    <Text style={styles.featureText}>Parktronic</Text>
  </View>

  <View style={styles.featureRow}>
    <CustomButton image={require('../assets/location-icon.png')} />
    <Text style={styles.featureText}>LOCATION</Text>
    <View style={styles.whiteBox} />
  </View>

  <View style={styles.featureRow}>
    <CustomButton image={require('../assets/safety-icon.png')} showBorder iconColor="#28A745" />
    <Text style={styles.featureText}>Intelligent safety</Text>
  </View>
</View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  carImage: {
    width: 300,
    height: 200,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 15,
  },
  statusText: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 40,
  },
  unlockedText: {
    color: 'green',
    fontWeight: 'bold',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  batteryIcon: {
    width: 25,
    height: 25,
    marginRight: 10,
  },
  batteryBar: {
    width: 280,
    height: 10,
    backgroundColor: '#808080',
    borderRadius: 5,
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  featureBox: {
    width: '85%',
    marginTop: 20,
  },
  
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    padding: 12,
    height:70,
    borderRadius: 20,
    marginBottom: 15,
  },
  
  featureText: {
    color: '#fff',
    fontSize: 19,
    flex: 1,
    fontWeight: '600',
  },
  
  whiteBox: {
    width: 90,
    height: 25,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});
