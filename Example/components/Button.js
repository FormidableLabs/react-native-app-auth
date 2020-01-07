import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';

const Button = ({ text, color, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.buttonBox, { backgroundColor: color }]}
  >
    <Text style={styles.text}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  text: {
    color: 'white',
  },
  buttonBox: {
    height: 50,
    flex: 1,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default Button;
