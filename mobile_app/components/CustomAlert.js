import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';
import colors  from '../constants/colors'; 
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';


const CustomAlert = ({ visible, message, onClose, type , navigationTarget}) => {
  
  const navigation = useNavigation();

  const handleClose = () => {
    onClose?.();
    if (navigationTarget) {
      if (typeof navigationTarget === 'string') {
        navigation.navigate(navigationTarget);
      } else if (typeof navigationTarget === 'object') {
        const { screen, params } = navigationTarget;
        navigation.navigate(screen, params || undefined);
      }
    }
  };
  
  


  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.alertContainer}>
          {type === 'loading' ? (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../assets/loading.json')} 
                    autoPlay
                    loop
                    style={styles.Gif}
                />
                <Text style={styles.alertText}>{message}</Text>
            </View>
          ) : type === 'success' ? (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../assets/success.json')} 
                    autoPlay
                    speed={2}
                    loop={false}
                    style={styles.Gif}
                />
                <Text style={styles.alertText}>{message}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
          ) :  type === 'error' ? (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../assets/error.json')}
                    autoPlay
                    speed={2}
                    loop={false}
                    style={styles.Gif}
                />
                <Text style={styles.alertText}>{message}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
          ) :  (
            <View>
              <Text style={styles.alertText}>{message}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    width: '90%',
    minHeight: '25%',
    padding: 20,
    backgroundColor: colors.background_secondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent:'center',
    // Shadow for iOS
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 4 }, // Shadow offset
    shadowOpacity: 0.1, // Shadow opacity
    shadowRadius: 10, // Shadow spread
    // Shadow for Android
    elevation: 5, // Adds shadow in Android
  },
  alertText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.white,
  },
  closeButton: {
    backgroundColor: '#006BFF',
    justifyContent: 'center',
    alignItems:'center',
    height: 50,
    width: 200,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  Gif: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#006BFF',
  },
});

export default CustomAlert;
