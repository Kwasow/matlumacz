import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, type ListRenderItem, View } from 'react-native';
import ReactMarkdown from 'react-markdown';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Button, Card, IconButton, PaperProvider, useTheme } from 'react-native-paper';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

type Response = {
  id: number;
  content: string;
};

const responses: Response[] = require('@/assets/responses.json');

// Custom markdown components that work with Paper
const MarkdownComponents = {
  text: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.markdownText}>{children}</ThemedText>,
  p: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.markdownParagraph}>{children}</ThemedText>,
  strong: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.markdownBold}>{children}</ThemedText>,
  em: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.markdownItalic}>{children}</ThemedText>,
  code: ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const isInline = !className || className === 'inline';
    return (
      <ThemedText style={isInline ? styles.inlineCode : styles.codeBlock}>{children}</ThemedText>
    );
  },
  pre: ({ children }: { children: React.ReactNode }) => <ThemedView style={styles.codeContainer}>{children}</ThemedView>,
  h1: ({ children }: { children: React.ReactNode }) => <ThemedText type="title" style={styles.heading1}>{children}</ThemedText>,
  h2: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.heading2}>{children}</ThemedText>,
  h3: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.heading3}>{children}</ThemedText>,
  h4: ({ children }: { children: React.ReactNode }) => <ThemedText style={styles.heading4}>{children}</ThemedText>,
  ul: ({ children }: { children: React.ReactNode }) => <View style={styles.list}>{children}</View>,
  ol: ({ children }: { children: React.ReactNode }) => <View style={styles.list}>{children}</View>,
  li: ({ children }: { children: React.ReactNode }) => <View style={styles.listItem}><ThemedText>{children}</ThemedText></View>,
  blockquote: ({ children }: { children: React.ReactNode }) => <View style={styles.blockquote}>{children}</View>,
  hr: () => <View style={styles.hr} />,
  table: ({ children }: { children: React.ReactNode }) => <View style={styles.table}>{children}</View>,
  thead: ({ children }: { children: React.ReactNode }) => <View style={styles.tableRow}>{children}</View>,
  tbody: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  tr: ({ children }: { children: React.ReactNode }) => <View style={styles.tableRow}>{children}</View>,
  th: ({ children }: { children: React.ReactNode }) => <View style={styles.tableCellHeader}><ThemedText style={styles.tableCellText}>{children}</ThemedText></View>,
  td: ({ children }: { children: React.ReactNode }) => <View style={styles.tableCell}><ThemedText style={styles.tableCellText}>{children}</ThemedText></View>,
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [responseIndex, setResponseIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const theme = useTheme();

  // Auto-add welcome message on mount
  useEffect(() => {
    if (messages.length === 0 && responses.length > 0) {
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responses[0].content,
        isStreaming: false,
      };
      setMessages([welcomeMsg]);
      setResponseIndex(1);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const streamResponse = useCallback(async (responseContent: string) => {
    const words = responseContent.split(' ');
    let streamedContent = '';

    return new Promise<string>((resolve) => {
      const interval = setInterval(() => {
        if (words.length === 0) {
          clearInterval(interval);
          resolve(streamedContent);
          return;
        }

        const nextWord = words.shift()!;
        streamedContent += (streamedContent ? ' ' : '') + nextWord;

        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].isStreaming) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: streamedContent + (words.length > 0 ? ' ' : ''),
            };
          }
          return updated;
        });

        if (words.length === 0) {
          clearInterval(interval);
          resolve(streamedContent);
        }
      }, 30);
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || responseIndex >= responses.length) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);

    // Add assistant message with empty content initially
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Stream the response
    const currentResponseIndex = responseIndex;
    setResponseIndex((prev) => prev + 1);

    await streamResponse(responses[currentResponseIndex].content);

    // Update message to mark streaming as complete
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].isStreaming) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
      }
      return updated;
    });

    // Focus input after sending
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, responseIndex, streamResponse]);

  const handleKeyPress = useCallback((e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      handleSend();
      return false;
    }
    return true;
  }, [handleSend]);

  const renderMessage: ListRenderItem<Message> = useCallback(({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
        <Card
          mode="outlined"
          style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}
          contentStyle={styles.messageContent}
        >
          {isUser ? (
            <ThemedText style={styles.userText}>{item.content}</ThemedText>
          ) : (
            <View style={styles.markdownContainer}>
              <ReactMarkdown components={MarkdownComponents}>
                {item.content}
              </ReactMarkdown>
              {item.isStreaming && <ThemedText style={styles.streamingIndicator}>|</ThemedText>}
            </View>
          )}
        </Card>
      </View>
    );
  }, []);

  return (
    <PaperProvider>
      <ThemedView style={styles.container}>
        {/* Sidebar Navigation */}
        <Card style={styles.sidebar} mode="elevated">
          <Card.Content>
            <IconButton
              icon="menu"
              size={24}
              style={styles.menuIcon}
              onPress={() => {}}
            />
            <Button
              mode="text"
              onPress={() => {}}
              style={styles.navButton}
              icon="chat"
            >
              New Chat
            </Button>
            <Button
              mode="text"
              onPress={() => {}}
              style={styles.navButton}
              icon="history"
            >
              History
            </Button>
            <Button
              mode="text"
              onPress={() => {}}
              style={styles.navButton}
              icon="cog"
            >
              Settings
            </Button>
          </Card.Content>
        </Card>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <Card style={styles.header} mode="elevated">
            <Card.Content style={styles.headerContent}>
              <ThemedText type="title" style={styles.headerTitle}>Matłumacz</ThemedText>
            </Card.Content>
          </Card>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <Card style={[styles.inputContainer, { backgroundColor }]} mode="elevated">
              <Card.Content style={styles.inputContent}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: textColor }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                  placeholderTextColor={textColor + '80'}
                  multiline
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                  onKeyPress={handleKeyPress}
                  returnKeyType="send"
                />
                <Button
                  mode="contained"
                  onPress={handleSend}
                  disabled={!input.trim() || responseIndex >= responses.length}
                  style={styles.sendButton}
                  contentStyle={styles.sendButtonContent}
                  icon="send"
                >
                  Send
                </Button>
              </Card.Content>
            </Card>
          </KeyboardAvoidingView>

          {responseIndex >= responses.length && (
            <Card style={styles.endOfResponses} mode="outlined">
              <Card.Content>
                <ThemedText style={styles.endOfResponsesText}>End of conversation demo</ThemedText>
              </Card.Content>
            </Card>
          )}
        </View>
      </ThemedView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar
  sidebar: {
    width: 240,
    flexDirection: 'column',
    margin: 8,
    marginTop: 8,
  },
  menuIcon: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  navButton: {
    marginVertical: 4,
    justifyContent: 'flex-start',
  },
  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    margin: 8,
    marginBottom: 0,
    padding: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  // Messages
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    padding: 12,
  },
  userText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  markdownContainer: {
    flex: 1,
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  markdownParagraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  markdownBold: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  markdownItalic: {
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  inlineCode: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    fontSize: 14,
    color: '#11181C',
  },
  codeBlock: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
    color: '#11181C',
  },
  codeContainer: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  heading1: {
    textAlign: 'center',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  heading4: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  list: {
    marginVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginLeft: 16,
    marginVertical: 2,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 4,
  },
  hr: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCellHeader: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  tableCellText: {
    fontSize: 14,
    color: '#11181C',
    backgroundColor: 'transparent',
  },
  streamingIndicator: {
    fontSize: 16,
    color: '#007AFF',
  },
  // Input
  inputContainer: {
    margin: 8,
    marginTop: 0,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: 'white',
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonContent: {
    height: 40,
  },
  endOfResponses: {
    margin: 8,
    alignItems: 'center',
  },
  endOfResponsesText: {
    fontSize: 12,
    color: '#888',
  },
});
