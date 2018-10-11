// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

type Props = {
  text: string,
  color: string,
  onPress: () => any
};

const ButtonBox = styled.TouchableOpacity.attrs({ activeOpacity: 0.8 })`
  height: 50px;
  flex: 1;
  margin: 5px;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color};
`;

const ButtonText = styled.Text`
  color: white;
`;

const Button = ({ text, color, onPress }: Props) => (
  <ButtonBox onPress={onPress} color={color}>
    <ButtonText>{text}</ButtonText>
  </ButtonBox>
);

export default Button;
