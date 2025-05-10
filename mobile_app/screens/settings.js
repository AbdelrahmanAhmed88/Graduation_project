import React, { useState,useEffect, useMemo, useRef} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity,Dimensions,ScrollView } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useRoute } from '@react-navigation/native';
import colors  from '../constants/colors'; 
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';



//dimentions and orientation

const { height, width } = Dimensions.get('window');

export default function Settings({ navigation }) {

    const route = useRoute();
    const { vin } = route.params || {}; 
  
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Feather name="settings" size={27} color={colors.primary} />
            <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView style={styles.settingsContainer}>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('vehicleDrivers',{vin:vin})} style={styles.settingItem}>
            <Feather name="users" size={24} color="black" />
            <Text style={styles.settingTitle}>Manage Drivers</Text>
          </TouchableOpacity>
        </View>
        {/* <View>
          <TouchableOpacity onPress={() => navigation.navigate('')} style={styles.settingItem}>
            <Feather name="users" size={24} color="black" />
            <Text style={styles.settingTitle}>Manage Users</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>

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
    settingsContainer: {
      flex: 1,
      padding: 10,
      marginTop: 20,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: 20,
      backgroundColor: colors.primary,
      height: 80,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    settingTitle: {
      fontSize: 18,
      paddingLeft: 10,
      fontWeight: 'bold',
      color: colors.background_primary,
    }

  });
  