import React from 'react';
import { StyleSheet, Animated, Pressable, KeyboardAvoidingView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const Modal = ({ setStatus, children, height }) => {
    const slide = React.useRef(new Animated.Value((height + 50))).current;


    const slideUp = () => {
        // Will change slide up the bottom sheet
        Animated.timing(slide, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start();
      };
    
      const slideDown = () => {
        // Will slide down the bottom sheet
        Animated.timing(slide, {
          toValue: height+50,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
            setStatus(false);
        });
      };


      React.useEffect(() => {
        slideUp()
      })


      const closeModal = () => {
        slideDown();
      }


    return(
        <Pressable onPress={ closeModal } style={styles.backdrop}>
            <KeyboardAvoidingView behavior='padding'>
                <Pressable style={{ width: '100%', height }}>
                    <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slide }] }]}>
                        { children }
                    </Animated.View>
                </Pressable>
            </KeyboardAvoidingView>
        </Pressable>
        
    )
}


export default Modal;


const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: '100%',
        height: '104%',
        justifyContent: 'flex-end'
    },
    bottomSheet: {
        width: '100%',
        height: '100%',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
    }
})