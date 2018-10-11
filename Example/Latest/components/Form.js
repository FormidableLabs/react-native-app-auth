// @flow

import styled from 'styled-components/native';

const Form = styled.View`
  flex: 1;
`;

Form.Label = styled.Text`
  font-size: 14px;
  font-weight: bold;
  background-color: transparent;
  margin-bottom: 10px;
`;

Form.Value = styled.Text.attrs({ numberOfLines: 10, ellipsizeMode: 'tail' })`
  font-size: 14px;
  background-color: transparent;
  margin-bottom: 20px;
`;

export default Form;
