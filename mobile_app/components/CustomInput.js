import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const CustomInput = ({ label, value, onChangeText, error, secureTextEntry }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.errorBorder]}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      placeholder={label}
      placeholderTextColor="#ccc"
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  errorBorder: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default CustomInput;