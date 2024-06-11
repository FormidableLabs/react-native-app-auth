import React from 'react';
import { Text, StyleSheet } from 'react-native';

const FormLabel = props => <Text style={styles.formText} {...props} />;

const styles = StyleSheet.create({
  formText: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
});

export default FormLabel;
