import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text, Card, ProgressBar } from 'react-native-paper';
import { Audio, AVPlaybackStatus } from 'expo-av';

interface AudioPlayerProps {
  audioUri: string;
  title?: string;
  isCompact?: boolean;
  onPlaybackStatusChange?: (isPlaying: boolean) => void;
}

export default function AudioPlayer({ 
  audioUri, 
  title, 
  isCompact = false,
  onPlaybackStatusChange 
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const positionUpdateInterval = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [sound]);

  useEffect(() => {
    onPlaybackStatusChange?.(isPlaying);
  }, [isPlaying, onPlaybackStatusChange]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, isLooping: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      
      // Get initial status to set duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis);
      }

    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }

      // If playback finished, reset
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    } else {
      if (status.error) {
        console.error('Playback error:', status.error);
        setError('Playback error occurred');
      }
    }
  };

  const togglePlayback = async () => {
    try {
      if (!sound) {
        await loadAudio();
        return;
      }

      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          // If at the end, restart from beginning
          if (position >= duration - 100) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
        }
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      setError('Playback failed');
    }
  };

  const seekToPosition = async (progress: number) => {
    if (!sound) return;

    try {
      const newPosition = progress * duration;
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (err) {
      console.error('Error seeking:', err);
    }
  };

  const stopPlayback = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
      setPosition(0);
    } catch (err) {
      console.error('Error stopping playback:', err);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlaybackProgress = () => {
    if (duration === 0) return 0;
    return position / duration;
  };

  if (isCompact) {
    return (
      <View style={styles.compactContainer}>
        <IconButton
          icon={isLoading ? "loading" : isPlaying ? "pause" : "play"}
          size={20}
          onPress={togglePlayback}
          disabled={isLoading || !!error}
          style={styles.compactButton}
        />
        {duration > 0 && (
          <Text variant="bodySmall" style={styles.compactTime}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Card style={styles.playerCard}>
      <Card.Content>
        {title && (
          <Text variant="titleSmall" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        )}
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text variant="bodySmall" style={styles.errorText}>
              {error}
            </Text>
            <IconButton
              icon="refresh"
              size={20}
              onPress={loadAudio}
            />
          </View>
        ) : (
          <>
            <View style={styles.controlsContainer}>
              <IconButton
                icon={isLoading ? "loading" : isPlaying ? "pause" : "play"}
                size={32}
                onPress={togglePlayback}
                disabled={isLoading}
                style={styles.playButton}
              />
              
              <IconButton
                icon="stop"
                size={24}
                onPress={stopPlayback}
                disabled={!sound || isLoading}
                style={styles.stopButton}
              />
            </View>

            {duration > 0 && (
              <>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={getPlaybackProgress()}
                    color="#6366F1"
                    style={styles.progressBar}
                  />
                </View>
                
                <View style={styles.timeContainer}>
                  <Text variant="bodySmall" style={styles.timeText}>
                    {formatTime(position)}
                  </Text>
                  <Text variant="bodySmall" style={styles.timeText}>
                    {formatTime(duration)}
                  </Text>
                </View>
              </>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    margin: 8,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  playButton: {
    backgroundColor: '#6366F1',
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  progressContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  timeText: {
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    marginRight: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactButton: {
    margin: 0,
  },
  compactTime: {
    marginLeft: 8,
    opacity: 0.7,
  },
});