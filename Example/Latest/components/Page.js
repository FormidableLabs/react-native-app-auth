// @flow

import styled from 'styled-components/native';

export default styled.ImageBackground.attrs({
  source: require('../assets/background.jpg')
})`
  flex: 1;
  background-color: white;
  padding: 40px 10px 10px 10px;
`;
