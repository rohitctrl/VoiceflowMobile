import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  IconButton, 
  Searchbar, 
  FAB,
  Menu,
  Divider,
  Chip
} from 'react-native-paper';
import { Recording, StorageService } from '../services/storageService';
import AudioPlayer from './AudioPlayer';

interface RecordingHistoryProps {
  onSelectRecording?: (recording: Recording) => void;
  onDeleteRecording?: (id: string) => void;
}

export default function RecordingHistory({ onSelectRecording, onDeleteRecording }: RecordingHistoryProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    filterAndSortRecordings();
  }, [recordings, searchQuery, sortBy]);

  const loadRecordings = async () => {
    try {
      const loadedRecordings = await StorageService.getAllRecordings();
      setRecordings(loadedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const filterAndSortRecordings = () => {
    let filtered = recordings;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = recordings.filter(recording =>
        recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.transcription.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort recordings
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredRecordings(filtered);
  };

  const handleDeleteRecording = async (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteRecording(id);
              await loadRecordings();
              onDeleteRecording?.(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (id: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePlaybackStatusChange = (recordingId: string, isPlaying: boolean) => {
    setPlayingRecordingId(isPlaying ? recordingId : null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <Card style={styles.recordingCard} onPress={() => onSelectRecording?.(item)}>
      <Card.Content>
        <View style={styles.recordingHeader}>
          <View style={styles.recordingInfo}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.recordingMeta}>
              <Text variant="bodySmall" style={styles.dateText}>
                {formatDate(item.createdAt)}
              </Text>
              {item.transcription.duration && (
                <Chip icon="clock-outline" style={styles.durationChip} compact>
                  {formatDuration(item.transcription.duration)}
                </Chip>
              )}
            </View>
          </View>
          
          <Menu
            visible={menuVisible[item.id] || false}
            onDismiss={() => toggleMenu(item.id)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => toggleMenu(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                toggleMenu(item.id);
                onSelectRecording?.(item);
              }}
              title="View"
              leadingIcon="eye"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item.id);
                handleDeleteRecording(item.id);
              }}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Text variant="bodySmall" numberOfLines={2} style={styles.transcriptPreview}>
          {item.transcription.text}
        </Text>

        <View style={styles.playerContainer}>
          <AudioPlayer
            audioUri={item.audioUri}
            isCompact={true}
            onPlaybackStatusChange={(isPlaying) => handlePlaybackStatusChange(item.id, isPlaying)}
          />
          {playingRecordingId === item.id && (
            <Chip icon="volume-high" style={styles.playingChip} compact>
              Playing
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search recordings..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.sortContainer}>
        <Text variant="bodySmall">Sort by: </Text>
        <Chip
          selected={sortBy === 'date'}
          onPress={() => setSortBy('date')}
          style={styles.sortChip}
        >
          Date
        </Chip>
        <Chip
          selected={sortBy === 'title'}
          onPress={() => setSortBy('title')}
          style={styles.sortChip}
        >
          Title
        </Chip>
      </View>

      {filteredRecordings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {searchQuery ? 'No recordings match your search' : 'No recordings yet'}
          </Text>
          {!searchQuery && (
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Start recording to see your transcriptions here
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 2,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sortChip: {
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  recordingCard: {
    marginBottom: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordingInfo: {
    flex: 1,
    marginRight: 8,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    opacity: 0.6,
    marginRight: 8,
  },
  durationChip: {
    height: 20,
  },
  transcriptPreview: {
    opacity: 0.8,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.6,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  playingChip: {
    backgroundColor: '#10B981',
  },
});