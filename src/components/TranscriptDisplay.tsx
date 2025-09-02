import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  Menu, 
  Divider,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { TranscriptionResult } from '../services/transcriptionService';

interface TranscriptDisplayProps {
  transcription: TranscriptionResult | null;
  isProcessing: boolean;
  onEnhanceText: (mode: 'summary' | 'bullets' | 'action_items') => void;
  onSave: (editedText: string) => void;
  onClear: () => void;
}

export default function TranscriptDisplay({ 
  transcription, 
  isProcessing, 
  onEnhanceText, 
  onSave,
  onClear 
}: TranscriptDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  React.useEffect(() => {
    if (transcription?.text) {
      setEditedText(transcription.text);
    }
  }, [transcription]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(transcription?.text || '');
    setIsEditing(false);
  };

  const handleExport = async () => {
    if (!transcription?.text) return;

    try {
      const fileName = `transcript-${Date.now()}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, editedText);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Transcript',
        });
      } else {
        Alert.alert('Success', `Transcript saved to ${fileName}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export transcript');
    }
  };

  const handleEnhance = async (mode: 'summary' | 'bullets' | 'action_items') => {
    setEnhancing(true);
    setMenuVisible(false);
    try {
      await onEnhanceText(mode);
    } finally {
      setEnhancing(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.processingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.processingText}>
            Processing audio...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (!transcription) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Record audio to see transcription here
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text variant="titleMedium">Transcription</Text>
            {transcription.duration && (
              <Chip icon="clock-outline" style={styles.durationChip}>
                {formatDuration(transcription.duration)}
              </Chip>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="auto-fix"
                  onPress={() => setMenuVisible(true)}
                  disabled={enhancing}
                />
              }
            >
              <Menu.Item onPress={() => handleEnhance('summary')} title="Summarize" />
              <Menu.Item onPress={() => handleEnhance('bullets')} title="Bullet Points" />
              <Menu.Item onPress={() => handleEnhance('action_items')} title="Action Items" />
            </Menu>
            
            <IconButton
              icon={isEditing ? "close" : "pencil"}
              onPress={isEditing ? handleCancel : handleEdit}
            />
            <IconButton
              icon="share-variant"
              onPress={handleExport}
            />
            <IconButton
              icon="delete"
              onPress={onClear}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        {enhancing && (
          <View style={styles.enhancingContainer}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall">Enhancing text...</Text>
          </View>
        )}

        <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={false}>
          {isEditing ? (
            <TextInput
              multiline
              value={editedText}
              onChangeText={setEditedText}
              style={styles.textInput}
              placeholder="Edit your transcription..."
              mode="outlined"
            />
          ) : (
            <Text variant="bodyMedium" style={styles.transcriptText}>
              {editedText}
            </Text>
          )}
        </ScrollView>

        {isEditing && (
          <View style={styles.editActions}>
            <Button mode="outlined" onPress={handleCancel} style={styles.cancelButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
              Save
            </Button>
          </View>
        )}

        {transcription.confidence && (
          <Text variant="bodySmall" style={styles.confidence}>
            Confidence: {Math.round(transcription.confidence * 100)}%
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  durationChip: {
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 8,
  },
  enhancingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  textContainer: {
    maxHeight: 250,
    minHeight: 100,
  },
  textInput: {
    maxHeight: 200,
  },
  transcriptText: {
    lineHeight: 22,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
  confidence: {
    textAlign: 'right',
    marginTop: 8,
    opacity: 0.7,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  processingText: {
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    opacity: 0.6,
  },
});