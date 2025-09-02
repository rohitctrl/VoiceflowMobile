import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
}

export default function AudioVisualizer({ isRecording, isPaused }: AudioVisualizerProps) {
  const animationValues = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isRecording && !isPaused) {
      const animations = animationValues.map((value, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 150 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(value, {
              toValue: 0.3,
              duration: 150 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        )
      );

      // Start animations with slight delays for more natural effect
      animations.forEach((animation, index) => {
        setTimeout(() => animation.start(), index * 50);
      });

      return () => {
        animations.forEach(animation => animation.stop());
      };
    } else {
      // Reset to default state when not recording
      animationValues.forEach(value => {
        Animated.timing(value, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isRecording, isPaused, animationValues]);

  if (!isRecording) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        {animationValues.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 40],
                  extrapolate: 'clamp',
                }),
                opacity: isPaused ? 0.3 : 1,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
    minHeight: 4,
  },
});