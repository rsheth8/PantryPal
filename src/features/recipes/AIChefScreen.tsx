import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { aiChefService } from '../../services/aiChefService';
import { AIRecipeSuggestion, UserPreferences, GroceryItem } from '../../types';

export default function AIChefScreen() {
  const navigation = useNavigation();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIRecipeSuggestion[]>([]);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);

  // Mock user preferences and pantry - in production, these would come from your store
  const mockUserPreferences: UserPreferences = {
    id: '1',
    userId: '1',
    dietaryRestrictions: ['vegetarian'],
    allergies: [],
    preferredCuisines: ['mediterranean', 'italian'],
    dislikedIngredients: [],
    cookingSkill: 'intermediate',
    preferredCookingTime: 'medium',
    preferredServings: 2,
    spiceTolerance: 'medium',
    preferredFlavors: ['savory', 'herbaceous'],
    healthGoals: ['balanced_nutrition'],
    preferredRecipeTypes: ['dinner', 'lunch'],
    cookingEquipment: ['stovetop', 'oven'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPantryItems: GroceryItem[] = [
    { id: '1', name: 'quinoa', quantity: 1, unit: 'cup', category: 'Grains & Bread', expirationDate: '2024-12-31', isExpired: false, isUsed: false },
    { id: '2', name: 'chickpeas', quantity: 1, unit: 'can', category: 'Canned', expirationDate: '2024-12-31', isExpired: false, isUsed: false },
    { id: '3', name: 'olive oil', quantity: 1, unit: 'bottle', category: 'Condiments', expirationDate: '2024-12-31', isExpired: false, isUsed: false },
    { id: '4', name: 'pasta', quantity: 1, unit: 'box', category: 'Grains & Bread', expirationDate: '2024-12-31', isExpired: false, isUsed: false },
  ];

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setIsLoading(true);

    // Add user message to conversation
    const newConversation = [
      ...conversation,
      { type: 'user' as const, message: userMessage, timestamp: new Date() },
    ];
    setConversation(newConversation);

    try {
      const aiSuggestions = await aiChefService.generateRecipeSuggestions({
        prompt: userMessage,
        context: {
          pantryItems: mockPantryItems,
          userPreferences: mockUserPreferences,
          availableTime: 45, // Mock available time
          mood: 'hungry', // Mock mood
          occasion: 'weeknight', // Mock occasion
        },
      });

      setSuggestions(aiSuggestions);

      // Add AI response to conversation
      const aiResponse = `I found ${aiSuggestions.length} recipe suggestions for you based on your preferences and pantry items. Here are some ideas:`;
      setConversation([
        ...newConversation,
        { type: 'ai' as const, message: aiResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate recipe suggestions. Please try again.');
      setConversation([
        ...newConversation,
        { type: 'ai' as const, message: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompts = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const renderConversation = () => {
    return conversation.map((message, index) => (
      <View key={index} style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.aiMessage
      ]}>
        <Text style={[
          styles.messageText,
          message.type === 'user' ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.message}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    ));
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Recipe Suggestions</Text>
        {suggestions.map((suggestion) => (
          <PantryCard key={suggestion.id} variant="fresh" margin="md">
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{suggestion.confidence}% match</Text>
              </View>
            </View>
            
            <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            
            <View style={styles.suggestionStats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{suggestion.estimatedTime} min</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Pantry</Text>
                <Text style={styles.statValue}>{suggestion.pantryUtilization}%</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{suggestion.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.reasoningText}>{suggestion.reasoning}</Text>

            <View style={styles.suggestionActions}>
              <PantryButton
                title="View Recipe"
                variant="primary"
                size="sm"
                onPress={() => {
                  // TODO: Navigate to recipe detail
                  Alert.alert('Recipe Detail', 'This would show the full recipe details');
                }}
              />
              <PantryButton
                title="Save"
                variant="outline"
                size="sm"
                onPress={() => {
                  Alert.alert('Saved', 'Recipe saved to your favorites');
                }}
              />
            </View>
          </PantryCard>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title="AI Chef"
        subtitle="Your personal recipe assistant"
        gradient="berry"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Prompts */}
        <PantryCard variant="elevated" margin="lg">
          <Text style={styles.sectionTitle}>Quick Prompts</Text>
          <Text style={styles.sectionSubtitle}>Try these to get started</Text>
          
          <View style={styles.quickPromptsContainer}>
            {[
              "I'm hungry and want something quick",
              "Show me healthy dinner ideas",
              "What can I make with my pantry items?",
              "I want something comforting",
              "Give me vegetarian options",
            ].map((quickPrompt, index) => (
              <PantryButton
                key={index}
                title={quickPrompt}
                variant="ghost"
                size="sm"
                onPress={() => handleQuickPrompts(quickPrompt)}
                style={styles.quickPromptButton}
              />
            ))}
          </View>
        </PantryCard>

        {/* Conversation */}
        {conversation.length > 0 && (
          <PantryCard variant="elevated" margin="lg">
            <Text style={styles.sectionTitle}>Conversation</Text>
            <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
              {renderConversation()}
            </ScrollView>
          </PantryCard>
        )}

        {/* Recipe Suggestions */}
        {renderSuggestions()}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your AI Chef for recipe ideas..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={500}
            placeholderTextColor="#9ca3af"
          />
          <PantryButton
            title={isLoading ? "..." : "Send"}
            variant="primary"
            size="sm"
            onPress={handleSendPrompt}
            disabled={isLoading || !prompt.trim()}
            loading={isLoading}
            style={styles.sendButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  quickPromptsContainer: {
    gap: 8,
  },
  quickPromptButton: {
    justifyContent: 'flex-start',
  },
  conversationContainer: {
    maxHeight: 200,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reasoningText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 16,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 60,
  },
});
