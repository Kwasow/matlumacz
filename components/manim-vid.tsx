import { useThemeColor } from '@/hooks/use-theme-color';
import { useManimRender } from '@/hooks/use-manim-render';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

export function ManimVideo({ code }: { code: string }) {
  const { state, render } = useManimRender();
  const textColor = useThemeColor({}, 'text');

  useEffect(() => { render(code); }, [code, render]);

  if (state.status === 'idle' || state.status === 'compiling') {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={textColor} />
        <ThemedText style={styles.label}>Tworzenie animacji specjalnie dla Ciebie...</ThemedText>
      </View>
    );
  }
  if (state.status === 'failed') {
    return (
      <View style={styles.box}>
        <ThemedText style={styles.error}>Nie udało się stworzyć animacji :*(</ThemedText>
        <ThemedText style={styles.errorDetail} numberOfLines={6}>{state.reason}</ThemedText>
      </View>
    );
  }
  return <Player url={state.videoUrl} />;
}

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url, p => { p.loop = true; p.play(); });
  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />;
}

const styles = StyleSheet.create({
  box: { marginTop: 10, padding: 12, borderRadius: 10, gap: 6, alignItems: 'center' },
  label: { fontSize: 13, opacity: 0.7 },
  error: { color: '#E3445A', fontWeight: '600' },
  errorDetail: { fontSize: 12, opacity: 0.7, fontFamily: 'monospace' },
  video: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 10, backgroundColor: '#000' },
});
