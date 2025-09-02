import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Animated } from 'react-native';
import { Button, Text, Card, ProgressBar, IconButton, FAB } from 'react-native-paper';
import { Audio } from 'expo-av';
import { PermissionStatus } from 'expo-modules-core';
import * as FileSystem from 'expo-file-system';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onRecordingStateChange?: (isRecording: boolean, isPaused: boolean) => void;
}

export default function AudioRecorder({ onRecordingComplete, onRecordingStateChange }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const durationInterval = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      // Request permissions
      const permissionResult = await Audio.requestPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      onRecordingStateChange?.(true, false);

      // Start pulsing animation
      startPulseAnimation();

      // Update duration every second
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    
    try {
      if (isPaused) {
        await recording.startAsync();
        setIsPaused(false);
        onRecordingStateChange?.(true, false);
        durationInterval.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        await recording.pauseAsync();
        setIsPaused(true);
        onRecordingStateChange?.(true, true);
        if (durationInterval.current) {
          clearInterval(durationInterval.current);
        }
      }
    } catch (err) {
      console.error('Failed to pause/resume recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording || isProcessing) return;

    try {
      setIsProcessing(true);
      setIsRecording(false);
      setIsPaused(false);
      onRecordingStateChange?.(false, false);
      
      // Stop animations
      stopPulseAnimation();
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      if (uri) {
        onRecordingComplete(uri, recordingDuration);
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatus = () => {
    if (!isRecording) return 'Ready to record';
    if (isPaused) return 'Paused';
    return 'Recording...';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.statusContainer}>
          <Text variant="titleMedium" style={styles.statusText}>
            {getRecordingStatus()}
          </Text>
          {isRecording && (
            <Text variant="displaySmall" style={styles.timer}>
              {formatTime(recordingDuration)}
            </Text>
          )}
        </View>

        {isRecording && (
          <ProgressBar 
            indeterminate={!isPaused} 
            style={styles.progressBar}
            color={isPaused ? '#F59E0B' : '#EF4444'}
          />
        )}

        <View style={styles.controlsContainer}>
          {!isRecording ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <FAB
                icon="microphone"
                onPress={startRecording}
                style={styles.startFab}
                size="large"
                disabled={isProcessing}
              />
            </Animated.View>
          ) : (
            <View style={styles.activeControls}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <IconButton
                  icon={isPaused ? "play" : "pause"}
                  mode="contained"
                  size={28}
                  onPress={pauseRecording}
                  style={styles.controlButton}
                  disabled={isProcessing}
                />
              </Animated.View>
              
              <IconButton
                icon={isProcessing ? "loading" : "stop"}
                mode="contained"
                size={28}
                onPress={stopRecording}
                style={[styles.controlButton, styles.stopButton]}
                disabled={isProcessing}
              />
            </View>
          )}
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text variant="bodySmall" style={styles.processingText}>
              Processing recording...
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    marginBottom: 8,
  },
  timer: {
    fontWeight: 'bold',
    color: '#EF4444',
    fontSize: 32,
  },
  progressBar: {
    marginBottom: 20,
    height: 6,
    borderRadius: 3,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  startFab: {
    backgroundColor: '#6366F1',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    backgroundColor: '#6366F1',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  processingContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  processingText: {
    opacity: 0.7,
  },
});