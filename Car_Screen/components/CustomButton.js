import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function CustomButton({ icon, image, label, onPress, color }) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      {image ? (
        <Image source={image} style={styles.image} />
      ) : (
        <Icon name={icon} size={20} color="#fff" style={styles.icon} />
      )}
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
  },
  icon: {
    marginRight: 10,
  },
  image: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});