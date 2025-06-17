import React, { useState,useEffect, useMemo, useRef} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity,Dimensions,ScrollView,FlatList} from 'react-native';
import CustomButton from '../components/CustomButton';
import { useRoute } from '@react-navigation/native';
import colors  from '../constants/colors'; 
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';

import { useAlert } from '../context/AlertContext';


import * as Notifications from 'expo-notifications';
import ip from '../connections/ip'

//dimentions and orientation
import axios from 'axios';
const { height, width } = Dimensions.get('window');

export default function VehicleDrivers({ navigation }) {
    const { showAlert, hideAlert } = useAlert();

    const route = useRoute();
    const { vin } = route.params || {}; 

    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
          try {
            showAlert('Loading...', 'loading');
            const response = await axios.get(`http://${ip}:5000/api/vehicles/${vin}`);
            const data = await response.data;
            setUsers(data.vehicle.users || []);
            hideAlert();
          } catch (error) {
            if(error.response.status === 404){
                console.log('No users found');
                setUsers([]);
                return;
            }
            console.error('Failed to fetch users:', error);
          }
        };
      
        if (vin) {
          fetchUsers();
        }
      }, [vin]);

      //handle user removal
      const handleRemoveUser = async (userId) => {
        try {
          const response = await axios.delete(`http://${ip}:5000/api/vehicles/${vin}/users/${userId}`);
          if (response.data.success) {
            // Remove the user from the state
            setUsers((prevUsers) => prevUsers.filter(user => user.user_id !== userId));
            showAlert('User removed successfully', 'success');
          } else {
          }
        } catch (error) {
          console.error('Error removing user:', error);
        }
      };
  
    return (

      <View style={styles.container}>
        <View style={styles.header}>
            <Feather name="users" size={27} color={colors.primary} />
            <Text style={styles.title}>Manage Drivers</Text>
        </View>

        <FlatList
            data={users}
            keyExtractor={(item) => item._id?.$oid || item.user_id}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('userProfile',{userId: item.user_id})}>
                <View style={styles.userInfo} >
                    <Text style={styles.userName}>{item.name}</Text>
                </View>
                <View style={styles.userActions}>
                    <TouchableOpacity 
                        style={styles.updateButton}
                        onPress={() => navigation.navigate('SignIn',{vin: vin, userId: item.user_id, userName: item.name})}    
                    >
                    <FontAwesome6 name="edit" size={24} color={colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveUser(item.user_id)}
                    >
                    <FontAwesome6 name="trash" size={24} color={colors.secondary} />
                    </TouchableOpacity>
                </View>
                </TouchableOpacity>
            )}
            contentContainerStyle={styles.usersContainer}
            />


        {/* Bottom Navigation */}
        <View style={[styles.bottomNav,{width:width}]}>
        <TouchableOpacity onPress={() => navigation.navigate('Garage')}>
          <FontAwesome6 name="square-parking" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <FontAwesome6 name="car" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {navigation.goBack()}}
        >
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
    usersContainer: {
        padding: 10,
        paddingBottom: 50,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 10,
        backgroundColor: colors.background_secondary,
        borderRadius: 10,
        height: height/8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    userActions: {
        flexDirection: 'row',
        marginRight: 10,
    },
    updateButton: {
        marginRight: 30,
    }


  });
  