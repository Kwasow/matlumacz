import { getTaskById } from "@/assets/tasks";
import { ManimVideo } from "@/components/manim-vid";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const textColor = useThemeColor({}, "text");
  const task = getTaskById(id);

  if (!task) {
    return (
      <>
        <Stack.Header hidden={true} />
        <ThemedView style={[styles.container, styles.center]}>
          <ThemedText style={styles.notFound}>
            Nie znaleziono takiego zadania.
          </ThemedText>
          <TouchableOpacity onPress={() => router.replace("/tasks" as any)}>
            <ThemedText style={styles.backButton}>← Wróć do listy</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Header hidden={true} />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backRow}
          >
            <ThemedText style={styles.backButton}>← Wróć do listy</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.subjectTag}>
            {task.subject.toUpperCase()}
          </ThemedText>
          <ThemedText style={styles.title}>{task.title}</ThemedText>

          <View style={[styles.section, { borderColor: textColor + "30" }]}>
            <ThemedText style={styles.sectionLabel}>Treść zadania</ThemedText>
            <EnrichedMarkdownText
              markdown={task.problem}
              onLinkPress={({ url }) => Linking.openURL(url)}
            />
          </View>

          <View style={[styles.section, { borderColor: textColor + "30" }]}>
            <ThemedText style={styles.sectionLabel}>Rozwiązanie</ThemedText>
            <EnrichedMarkdownText
              markdown={task.solution}
              onLinkPress={({ url }) => Linking.openURL(url)}
            />
            {task.manimCodes.map((code, i) => (
              <View key={i} style={styles.videoWrap}>
                <ManimVideo code={code} />
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", gap: 16 },
  notFound: { fontSize: 16, opacity: 0.7 },
  scroll: {
    padding: 24,
    paddingBottom: 64,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  backRow: { marginBottom: 8 },
  backButton: { fontSize: 14, opacity: 0.7 },
  subjectTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.55,
    marginTop: 8,
  },
  title: { fontSize: 26, fontWeight: "700", marginTop: 4, marginBottom: 16 },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 10,
  },
  videoWrap: { marginTop: 12 },
});
