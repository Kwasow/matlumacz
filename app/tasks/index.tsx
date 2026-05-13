import { TASKS } from "@/assets/tasks";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Stack, useRouter } from "expo-router";
import {
  FlatList,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

export default function TasksScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, "text");

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/chat" as any);
  };

  return (
    <>
      <Stack.Header hidden={true} />
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backRow}>
            <ThemedText style={styles.backButton}>← Wróć</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Baza zadań</ThemedText>
          <ThemedText style={styles.subtitle}>
            Wybierz zadanie, aby zobaczyć rozwiązanie krok po kroku
          </ThemedText>
        </View>

        <FlatList
          data={TASKS}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderColor: textColor + "30" }]}
              activeOpacity={0.7}
              onPress={() => router.push(`/tasks/${item.id}` as any)}
            >
              <ThemedText style={styles.subjectTag}>
                {item.subject.toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>

              <View style={styles.cardPreview} pointerEvents="none">
                <EnrichedMarkdownText
                  markdown={item.problem}
                  onLinkPress={({ url }) => Linking.openURL(url)}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 8, gap: 4 },
  backRow: { marginBottom: 8 },
  backButton: { fontSize: 14, opacity: 0.7 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 2 },
  list: { padding: 20, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  subjectTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.55,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardPreview: { fontSize: 13, opacity: 0.7, lineHeight: 18 },
});
