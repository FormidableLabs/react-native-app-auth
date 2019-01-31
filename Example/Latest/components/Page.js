// @flow

import React from 'react';
import styled from 'styled-components/native';

const SafeArea = styled.SafeAreaView`
  flex: 1;
`;

const Background = styled.ImageBackground.attrs({
  source: require('../assets/background.jpg')
})`
  flex: 1;
  background-color: white;
  padding: 40px 10px 10px 10px;
`;

export default ({ children }) => (
  <Background>
    <SafeArea>{children}</SafeArea>
  </Background>
);
