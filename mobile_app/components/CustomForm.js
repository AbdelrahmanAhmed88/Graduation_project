import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import CustomInput from './CustomInput';

const CustomForm = ({ fields, onSubmit, buttonText }) => {
  const [form, setForm] = useState(fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    fields.forEach(field => {
      if (!form[field.name]) newErrors[field.name] = `${field.label} is required`;
      if (field.name === 'password' && form[field.name].length < 6) {
        newErrors[field.name] = 'Password must be at least 6 characters';
      }
      if (field.name === 'email' && !form[field.name].includes('@')) {
        newErrors[field.name] = 'Valid email is required';
      }
    });
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
    } else {
      setErrors({});
      onSubmit(form);
    }
  };

  return (
    <View style={styles.form}>
      {fields.map(field => (
        <CustomInput
          key={field.name}
          label={field.label}
          value={form[field.name]}
          onChangeText={text => setForm({ ...form, [field.name]: text })}
          error={errors[field.name]}
          secureTextEntry={field.name === 'password'}
        />
      ))}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '90%',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 40,
    alignItems: 'center',
    elevation: 15, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CustomForm;