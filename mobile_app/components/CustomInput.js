import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '../constants/colors';

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
    color: colors.primary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.background_secondary,
    borderRadius: 12,
    padding:15,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
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