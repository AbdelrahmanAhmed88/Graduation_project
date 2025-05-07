import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';

const { height, width } = Dimensions.get('window');

export default function App() {

  

  return (
    <LinearGradient colors={["#006BFF","#1E1E1E"]} style={styles.container}>
    <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>

        <View style={styles.imageContainer}>
          <Image
            source={require("../assets/profile.png")} 
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.name}>Abdelrahman</Text>

        <View style={styles.rowContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Driving Duration</Text>
            <Text style={styles.infoTextValue}>1 Hour</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Speed Limit</Text>
            <Text style={styles.infoTextValue}>Enabled</Text>
          </View>
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Max Speed</Text>
            <Text style={styles.infoTextValue}>120 KM/H</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Aggressive Driving</Text>
            <Text style={styles.infoTextValue}>Disabled</Text>
          </View>
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Drowsiness</Text>
            <Text style={styles.infoTextValue}>Disabled</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Focus</Text>
            <Text style={styles.infoTextValue}>Enabled</Text>
          </View>
        </View>
        </ScrollView>
    </View>
     
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor:'blue',
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '48%',
    height: 130,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
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
