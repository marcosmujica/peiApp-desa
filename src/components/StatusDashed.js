import React from "react";
import { Text } from "react-native";
import { Svg, Circle } from "react-native-svg";

function StatusDashed({ width, height, number, color }) {

    const numberOfDots = 2 * 3.14 * 48 / (number) //10 number of statues //48 is the radius of the circle
    return (
        <Svg width={ width } height={ height } viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="48" fill="none" 
            stroke={ color } strokeWidth="4" strokeDasharray={`${numberOfDots} 5 `} 
            strokeDashoffset={numberOfDots} />
        </Svg>   
    )
}

export default StatusDashed;
