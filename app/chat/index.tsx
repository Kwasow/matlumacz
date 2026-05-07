import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  type ListRenderItem,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { Button, IconButton, Menu, PaperProvider } from "react-native-paper";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

// Inicjalizacja instancji Google Gemini
const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

const renderSafeView = (children: React.ReactNode) => {
  return React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      String(child).trim() === "" ? null : (
        <ThemedText>{child}</ThemedText>
      )
    ) : (
      child
    ),
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite");
  const [menuVisible, setMenuVisible] = useState(false);
  const chatRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  // Auto-add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Cześć! W czym mogę Ci dzisiaj pomóc?",
        isStreaming: false,
      };
      setMessages([welcomeMsg]);

      try {
        const model = genAI.getGenerativeModel({ model: selectedModel });
        chatRef.current = model.startChat({
          history: [],
        });
      } catch (err) {
        console.error("Gemini init error:", err);
      }
    }
  }, []); // Run only on mount

  const handleModelChange = useCallback(async (newModel: string) => {
    setSelectedModel(newModel);
    setMenuVisible(false);

    if (chatRef.current) {
      try {
        const history = await chatRef.current.getHistory();
        const model = genAI.getGenerativeModel({ model: newModel });
        chatRef.current = model.startChat({ history });
      } catch (err) {
        console.error("Error updating model:", err);
      }
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

  const handleNewChat = useCallback(() => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Cześć! W czym mogę Ci dzisiaj pomóc?",
      isStreaming: false,
    };
    setMessages([welcomeMsg]);
    setInput("");
    setIsGenerating(false);

    // Reset the chat history in Gemini
    try {
      const model = genAI.getGenerativeModel({ model: selectedModel });
      chatRef.current = model.startChat({
        history: [],
      });
    } catch (err) {
      console.error("Gemini init error on new chat:", err);
    }
  }, [selectedModel]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || !chatRef.current) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };

    setInput("");
    setIsGenerating(true);
    setMessages((prev) => [...prev, userMessage]);

    // Add assistant message with empty content initially
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Use Gemini to get a streaming response
      const result = await chatRef.current.sendMessageStream(userText);
      let fullText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;

        setMessages((prev) => {
          const updated = [...prev];
          const assistantMsgIndex = updated.findIndex(
            (msg) => msg.id === assistantId,
          );
          if (assistantMsgIndex !== -1) {
            updated[assistantMsgIndex] = {
              ...updated[assistantMsgIndex],
              content: fullText,
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const assistantMsgIndex = updated.findIndex(
          (msg) => msg.id === assistantId,
        );
        if (assistantMsgIndex !== -1) {
          updated[assistantMsgIndex] = {
            ...updated[assistantMsgIndex],
            content:
              "Przepraszam, wystąpił błąd podczas generowania odpowiedzi. Upewnij się, że Twój klucz API jest prawidłowy.",
          };
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
      // Update message to mark streaming as complete
      setMessages((prev) => {
        const updated = [...prev];
        const assistantMsgIndex = updated.findIndex(
          (msg) => msg.id === assistantId,
        );
        if (assistantMsgIndex !== -1) {
          updated[assistantMsgIndex] = {
            ...updated[assistantMsgIndex],
            isStreaming: false,
          };
        }
        return updated;
      });

      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isGenerating]);

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
        handleSend();
        return false;
      }
      return true;
    },
    [handleSend],
  );

  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isUser = item.role === "user";

      return (
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userContainer : styles.assistantContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser
                ? styles.userBubble
                : [
                    styles.assistantBubble,
                    {
                      backgroundColor,
                      borderColor: textColor + "30",
                      borderWidth: 1,
                    },
                  ],
            ]}
          >
            <View style={styles.messageContent}>
              {isUser ? (
                <ThemedText style={styles.userText}>{item.content}</ThemedText>
              ) : (
                <View style={styles.markdownContainer}>
                  <EnrichedMarkdownText
                    markdown={item.content}
                    onLinkPress={({ url }) => Linking.openURL(url)}
                  />
                  {item.isStreaming && (
                    <ThemedText style={styles.streamingIndicator}>|</ThemedText>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [backgroundColor, textColor],
  );

  return (
    <>
      <Stack.Header hidden={true} />
      <PaperProvider>
        <ThemedView style={styles.container}>
          {/* Sidebar Navigation */}
          <View style={styles.sidebar}>
            {/* App title / branding */}
            <View style={styles.sidebarHeader}>
              <ThemedText style={styles.sidebarTitle}>Matłumacz</ThemedText>
              <ThemedText style={styles.sidebarSubtitle}>
                AI Assistant
              </ThemedText>
            </View>

            <View style={styles.sidebarDivider} />

            {/* Nav items */}
            <View style={styles.navSection}>
              <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={handleNewChat}
              >
                <IconButton
                  icon="chat-plus-outline"
                  size={20}
                  style={styles.navItemIcon}
                />
                <ThemedText style={styles.navItemLabel}>New Chat</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                <IconButton
                  icon="history"
                  size={20}
                  style={styles.navItemIcon}
                />
                <ThemedText style={styles.navItemLabel}>History</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                <IconButton
                  icon="cog-outline"
                  size={20}
                  style={styles.navItemIcon}
                />
                <ThemedText style={styles.navItemLabel}>Settings</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content */}
          <View style={[styles.mainContent, { backgroundColor }]}>
            <View style={styles.topBar}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                    icon="chevron-down"
                    contentStyle={{ flexDirection: "row-reverse" }}
                    textColor={textColor}
                    style={{ borderColor: textColor + "30" }}
                  >
                    {selectedModel}
                  </Button>
                }
                style={styles.dropdownMenu}
              >
                <Menu.Item
                  onPress={() => handleModelChange("gemini-2.0-flash")}
                  title="2.0 Flash"
                />
                <Menu.Item
                  onPress={() => handleModelChange("gemini-2.0-flash-lite")}
                  title="2.0 Flash Lite"
                />
                <Menu.Item
                  onPress={() => handleModelChange("gemini-2.5-flash")}
                  title="2.5 Flash"
                />
                <Menu.Item
                  onPress={() => handleModelChange("gemini-2.5-flash-lite")}
                  title="2.5 Flash Lite"
                />
                <Menu.Item
                  onPress={() => handleModelChange("gemini-3-flash-preview")}
                  title="3.0 Flash Preview"
                />
                <Menu.Item
                  onPress={() =>
                    handleModelChange("gemini-3.1-flash-lite-preview")
                  }
                  title="3.1 Flash Lite Preview"
                />
                <Menu.Item
                  onPress={() => handleModelChange("gemini-3.1-pro-preview")}
                  title="3.1 Pro Preview"
                />
              </Menu>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoiding}
              keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
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
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor, borderColor: textColor + "30" },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: textColor }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                  placeholderTextColor={textColor + "80"}
                  multiline
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                  onKeyPress={handleKeyPress}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!input.trim() || isGenerating) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim() || isGenerating}
                  activeOpacity={0.8}
                >
                  <IconButton
                    icon="send"
                    size={20}
                    iconColor="white"
                    style={styles.sendIcon}
                  />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </ThemedView>
      </PaperProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },

  // ── Sidebar ──────────────────────────────────────────────────────────
  sidebar: {
    width: 240,
    backgroundColor: "#1A1D23",
    flexDirection: "column",
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  sidebarHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: "#2D3139",
    marginVertical: 12,
    marginHorizontal: 8,
  },
  navSection: {
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingRight: 12,
    paddingVertical: 2,
    marginVertical: 1,
  },
  navItemIcon: {
    margin: 0,
    width: 36,
    height: 36,
  },
  navItemLabel: {
    fontSize: 14,
    color: "#C9CDD4",
    fontWeight: "500",
    marginLeft: 4,
  },

  // ── Main Content ─────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
    flexDirection: "column",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // needed for dropdown overlay to appear correctly
  },
  dropdownMenu: {
    marginTop: 40,
  },
  listContent: {
    padding: 20,
    paddingBottom: 12,
  },

  // ── Messages ─────────────────────────────────────────────────────────
  messageContainer: {
    marginBottom: 14,
    maxWidth: "80%",
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  assistantContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 18,
    borderWidth: 0,
  },
  userBubble: {
    backgroundColor: "#64748B",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  messageContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    color: "white",
    fontSize: 15,
    lineHeight: 22,
  },
  markdownContainer: {
    flex: 1,
  },
  markdownText: {
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: "transparent",
  },
  markdownParagraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  markdownBold: {
    fontWeight: "bold",
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: "transparent",
  },
  markdownItalic: {
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: "transparent",
  },
  inlineCode: {
    backgroundColor: "#EEF0F3",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === "web" ? "monospace" : "monospace",
    fontSize: 13,
    color: "#E3445A",
  },
  codeBlock: {
    fontFamily: Platform.OS === "web" ? "monospace" : "monospace",
    fontSize: 13,
    lineHeight: 20,
    color: "#E8EAF0",
  },
  codeContainer: {
    backgroundColor: "#1E2130",
    padding: 14,
    borderRadius: 10,
    marginVertical: 8,
  },
  heading1: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 8,
    backgroundColor: "transparent",
  },
  heading2: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
    backgroundColor: "transparent",
  },
  heading3: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 6,
    backgroundColor: "transparent",
  },
  heading4: {
    fontSize: 15,
    fontWeight: "bold",
    marginVertical: 4,
    backgroundColor: "transparent",
  },
  list: {
    marginVertical: 4,
  },
  listItem: {
    flexDirection: "row",
    marginLeft: 16,
    marginVertical: 2,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#4F6EF7",
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: "#F0F4FF",
    borderRadius: 4,
    paddingVertical: 4,
  },
  hr: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    marginVertical: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableCellHeader: {
    flex: 1,
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  tableCellText: {
    fontSize: 13,
    backgroundColor: "transparent",
  },
  streamingIndicator: {
    fontSize: 16,
    color: "#4F6EF7",
  },

  // ── Input ─────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    margin: 16,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    fontSize: 15,
    paddingTop: 8,
    paddingBottom: 8,
    outlineStyle: "none",
  } as any,
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F6EF7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    alignSelf: "flex-end",
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "#C5CEED",
  },
  sendIcon: {
    margin: 0,
  },

  // ── End of demo ───────────────────────────────────────────────────────
  endOfResponses: {
    alignItems: "center",
    paddingBottom: 8,
  },
  endOfResponsesText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
