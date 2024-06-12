import React from 'react';
import { StyleSheet, View } from 'react-native';

const ButtonContainer = props => <View style={styles.view} {...props} />;

const styles = StyleSheet.create({
  view: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    margin: 5
  }
});

export default ButtonContainer;
