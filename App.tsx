import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, BottomNavigation, Appbar } from 'react-native-paper';
import customTheme from './src/theme';
import AudioRecorder from './src/components/AudioRecorder';
import AudioVisualizer from './src/components/AudioVisualizer';
import TranscriptDisplay from './src/components/TranscriptDisplay';
import RecordingHistory from './src/components/RecordingHistory';
import { MockTranscriptionService, TranscriptionResult } from './src/services/transcriptionService';
import { StorageService, Recording } from './src/services/storageService';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const transcriptionService = new MockTranscriptionService();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const [index, setIndex] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);

  const routes = [
    { key: 'record', title: 'Record', focusedIcon: 'microphone', unfocusedIcon: 'microphone-outline' },
    { key: 'history', title: 'History', focusedIcon: 'history', unfocusedIcon: 'history' },
  ];

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleRecordingStateChange = (recording: boolean, paused: boolean) => {
    setIsRecording(recording);
    setIsPaused(paused);
  };

  const handleRecordingComplete = async (uri: string, duration: number) => {
    setIsRecording(false);
    setIsProcessing(true);
    setCurrentAudioUri(uri);
    
    try {
      const transcription = await transcriptionService.transcribeAudio(uri);
      setCurrentTranscription(transcription);
      
      // Save to storage
      const title = StorageService.generateTitle(transcription.text);
      await StorageService.saveRecording({
        title,
        audioUri: uri,
        transcription,
      });
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhanceText = async (mode: 'summary' | 'bullets' | 'action_items') => {
    if (!currentTranscription) return;
    
    try {
      const enhancedText = await transcriptionService.enhanceText(currentTranscription.text, mode);
      setCurrentTranscription({
        ...currentTranscription,
        text: enhancedText,
      });
    } catch (error) {
      console.error('Text enhancement failed:', error);
    }
  };

  const handleSaveTranscript = async (editedText: string) => {
    if (!currentTranscription) return;
    
    setCurrentTranscription({
      ...currentTranscription,
      text: editedText,
    });
  };

  const handleClearTranscript = () => {
    setCurrentTranscription(null);
    setSelectedRecording(null);
    setCurrentAudioUri(null);
  };

  const handleSelectRecording = (recording: Recording) => {
    setCurrentTranscription(recording.transcription);
    setSelectedRecording(recording);
    setCurrentAudioUri(recording.audioUri);
    setIndex(0); // Switch to record tab
  };

  const RecordScene = () => (
    <ScrollView style={styles.scene} showsVerticalScrollIndicator={false}>
      <View style={styles.recordContainer}>
        <AudioRecorder 
          onRecordingComplete={handleRecordingComplete}
          onRecordingStateChange={handleRecordingStateChange}
        />
        <AudioVisualizer isRecording={isRecording} isPaused={isPaused} />
        <TranscriptDisplay
          transcription={currentTranscription}
          isProcessing={isProcessing}
          audioUri={currentAudioUri || undefined}
          onEnhanceText={handleEnhanceText}
          onSave={handleSaveTranscript}
          onClear={handleClearTranscript}
        />
      </View>
    </ScrollView>
  );

  const HistoryScene = () => (
    <View style={styles.scene}>
      <RecordingHistory
        onSelectRecording={handleSelectRecording}
        onDeleteRecording={(id) => {
          if (selectedRecording?.id === id) {
            handleClearTranscript();
          }
        }}
      />
    </View>
  );

  const renderScene = BottomNavigation.SceneMap({
    record: RecordScene,
    history: HistoryScene,
  });

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Voice Transcriber" />
          </Appbar.Header>
          
          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            barStyle={styles.bottomNav}
          />
          
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scene: {
    flex: 1,
  },
  recordContainer: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
  },
});