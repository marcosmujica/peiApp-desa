import React from 'react';
import { View, Text, TextInput, useColorScheme } from 'react-native';
import { getStyles } from '../styles/common';

const LineTextInput = (props) => {
    const mode = useColorScheme();

    return(
        <TextInput
            style={ getStyles(mode).lineTextInput }
        />
    )
}
export default LineTextInput;