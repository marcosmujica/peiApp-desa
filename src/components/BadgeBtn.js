import React from "react";
import { View, Text, StyleSheet, Animated, Pressable, useColorScheme, TouchableOpacity } from 'react-native';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/home';
import { FlatList } from "react-native-gesture-handler";
const BadgeBtn = ({items, idActive=""}) => {
    const colorScheme = useColorScheme();
    const [btns, setButtons] = React.useState([]);

    // Update btns when items or idActive changes
    React.useEffect(() => {
        // Create a new array to avoid mutating props
        const updatedItems = items.map(item => ({
            ...item,
            active: idActive === "" ? false : item.id === idActive
        }));
        setButtons(updatedItems);
    }, [items, idActive]);

    function setOnClick (item)
    {
        // Update active state for the clicked item
        setButtons(prevBtns =>
            prevBtns.map(btn =>
                btn.id === item.id
                    ? { ...btn, active: true }
                    : { ...btn, active: false }
            )
        );
        if (item.onClick) item.onClick();
    }

    const flatListRef = React.useRef(null);

    // State to control visibility of left/right buttons
    const [showLeft, setShowLeft] = React.useState(false);
    const [showRight, setShowRight] = React.useState(false);

    // Check if left/right buttons should be shown
    const onScroll = (event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const canScrollLeft = contentOffset.x > 5;
        const canScrollRight = contentOffset.x + layoutMeasurement.width < contentSize.width - 5;
        setShowLeft(canScrollLeft);
        setShowRight(canScrollRight);
    };

    // Scroll FlatList left/right
    const scrollBy = (offset) => {
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({
                offset: Math.max(0, (flatListRef.current._listRef._scrollMetrics?.offset || 0) + offset),
                animated: true,
            });
        }
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showLeft && (
                <TouchableOpacity onPress={() => scrollBy(-120)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 22 }}>{'‹'}</Text>
                </TouchableOpacity>
            )}
            <FlatList
                ref={flatListRef}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={btns}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={[tStyles.row, { marginVertical: 10 }]}>
                        <TouchableOpacity
                            style={[
                                getStyles(colorScheme).chatFilter,
                                item.active ? getStyles(colorScheme).activeChatFilter : null
                            ]}
                            key={item.id}
                            onPress={() => setOnClick(item)}
                        >
                            <Text
                                style={[
                                    getStyles(colorScheme).chatFilterText,
                                    item.active ? getStyles(colorScheme).activeChatFilterText : null
                                ]}
                            >
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ flexGrow: 1 }}
            />
            {showRight && (
                <TouchableOpacity onPress={() => scrollBy(120)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 22 }}>{'›'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default BadgeBtn;
