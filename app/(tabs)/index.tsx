import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, type ListRenderItem } from 'react-native';
import ReactMarkdown from 'react-markdown';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

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

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [responseIndex, setResponseIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

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

  const renderMarkdown = useCallback((content: string) => {
    return (
      <ReactMarkdown
        components={{
          text: ({ children }) => <ThemedText style={styles.markdownText}>{children}</ThemedText>,
          p: ({ children }) => <ThemedText style={styles.markdownParagraph}>{children}</ThemedText>,
          strong: ({ children }) => <ThemedText style={styles.markdownBold}>{children}</ThemedText>,
          em: ({ children }) => <ThemedText style={styles.markdownItalic}>{children}</ThemedText>,
          code: ({ children, className }) => {
            const isInline = !className || className === 'inline';
            return (
              <ThemedText style={isInline ? styles.inlineCode : styles.codeBlock}>{children}</ThemedText>
            );
          },
          pre: ({ children }) => <ThemedView style={styles.codeContainer}>{children}</ThemedView>,
          h1: ({ children }) => <ThemedText type="title">{children}</ThemedText>,
          h2: ({ children }) => <ThemedText style={styles.heading2}>{children}</ThemedText>,
          h3: ({ children }) => <ThemedText style={styles.heading3}>{children}</ThemedText>,
          h4: ({ children }) => <ThemedText style={styles.heading4}>{children}</ThemedText>,
          ul: ({ children }) => <ThemedView style={styles.list}>{children}</ThemedView>,
          ol: ({ children }) => <ThemedView style={styles.list}>{children}</ThemedView>,
          li: ({ children }) => <ThemedView style={styles.listItem}><ThemedText>{children}</ThemedText></ThemedView>,
          blockquote: ({ children }) => <ThemedView style={styles.blockquote}>{children}</ThemedView>,
          hr: () => <ThemedView style={styles.hr} />,
          table: ({ children }) => <ThemedView style={styles.table}>{children}</ThemedView>,
          thead: ({ children }) => <ThemedView style={styles.tableRow}>{children}</ThemedView>,
          tbody: ({ children }) => <ThemedView>{children}</ThemedView>,
          tr: ({ children }) => <ThemedView style={styles.tableRow}>{children}</ThemedView>,
          th: ({ children }) => <ThemedView style={styles.tableCellHeader}><ThemedText style={styles.tableCellText}>{children}</ThemedText></ThemedView>,
          td: ({ children }) => <ThemedView style={styles.tableCell}><ThemedText style={styles.tableCellText}>{children}</ThemedText></ThemedView>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, []);

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
  }, [input, responseIndex, streamResponse]);

  const renderMessage: ListRenderItem<Message> = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    const bubbleStyle = isUser ? styles.userBubble : styles.assistantBubble;
    const containerStyle = isUser ? styles.userContainer : styles.assistantContainer;

    return (
      <ThemedView style={[styles.messageContainer, containerStyle]}>
        <ThemedView style={[styles.messageBubble, bubbleStyle]}>
          {isUser ? (
            <ThemedText style={styles.userText}>{item.content}</ThemedText>
          ) : (
            <ThemedView style={styles.markdownContainer}>
              {renderMarkdown(item.content)}
              {item.isStreaming && <ThemedText style={styles.streamingIndicator}>|</ThemedText>}
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    );
  }, [renderMarkdown]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Matłumacz</ThemedText>
      </ThemedView>

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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <ThemedView style={[styles.inputContainer, { backgroundColor }]}>
          <TextInput
            style={[styles.input, { color: textColor }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={textColor + '80'}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: tintColor }]}
            onPress={handleSend}
            disabled={!input.trim() || responseIndex >= responses.length}
          >
            <ThemedText style={styles.sendButtonText}>Send</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>

      {responseIndex >= responses.length && (
        <ThemedView style={styles.endOfResponses}>
          <ThemedText style={styles.endOfResponsesText}>End of conversation demo</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
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
  },
  markdownParagraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  markdownBold: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },
  markdownItalic: {
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
  },
  inlineCode: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  heading4: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
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
  },
  streamingIndicator: {
    fontSize: 16,
    animationName: 'blink',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
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
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  endOfResponses: {
    padding: 8,
    alignItems: 'center',
  },
  endOfResponsesText: {
    fontSize: 12,
    color: '#888',
  },
});
