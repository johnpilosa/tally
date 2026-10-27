import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Appear } from '@/animations/appear';
import { GamesMenuButton } from '@/components/games-nav';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import { matchPlatform, useProfile } from '@/lib/profile';
import {
  cleanTitle,
  fetchProfile,
  fetchRecentGames,
  titleSimilarity,
  useRA,
  type RAAccount,
  type RAProfile,
  type RARecentGame,
} from '@/lib/retro-achievements';
import { fetchGame, searchGames } from '@/lib/wiki-games';

const C = Colors.dark;

/**
 * Tu cuenta de RetroAchievements: conectarla con tu usuario y Web API Key, ver lo que jugaste
 * hace poco y traer esos juegos a Retro Log (quedan enlazados para ver sus logros).
 */
export default function RetroScreen() {
  const { t } = useI18n();
  const { account, loaded } = useRA();

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/games" right={<GamesMenuButton />} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.four}>
        <ScreenTitle rule>{t.games.raAchievements}</ScreenTitle>
        {loaded && (account ? <Connected account={account} /> : <ConnectForm />)}
      </KeyboardAwareScrollView>
    </View>
  );
}

/** Usuario y key. Se prueban con la API antes de guardarlos. */
function ConnectForm() {
  const { t } = useI18n();
  const { setAccount } = useRA();
  const [user, setUser] = useState('');
  const [key, setKey] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'bad' | 'offline'>('idle');
  const ready = user.trim() && key.trim() && state !== 'working';

  const connect = async () => {
    if (!ready) return;
    const next = { user: user.trim(), key: key.trim() };
    setState('working');
    try {
      await fetchProfile(next);
      setAccount(next);
    } catch (e) {
      setState(e instanceof Error && e.message === 'unauthorized' ? 'bad' : 'offline');
    }
  };

  return (
    <Appear options={{ index: 1 }} style={styles.form}>
      <Text style={styles.label}>{t.games.raUser}</Text>
      <TextInput
        value={user}
        onChangeText={setUser}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Text style={styles.label}>{t.games.raKey}</Text>
      <TextInput
        value={key}
        onChangeText={setKey}
        onSubmitEditing={connect}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        style={styles.input}
      />
      <Text style={styles.hint}>{t.games.raKeyHint}</Text>
      <Text style={styles.hint}>{t.games.raSavedHere}</Text>
      {(state === 'bad' || state === 'offline') && (
        <Text style={[styles.label, { color: C.accent }]}>
          {state === 'bad' ? t.games.raBadLogin : t.games.raOffline}
        </Text>
      )}
      <Pressable
        onPress={connect}
        disabled={!ready}
        style={({ pressed }) => [
          styles.button,
          !ready && { opacity: 0.3 },
          pressed && { opacity: 0.7 },
        ]}>
        <Text style={styles.buttonText}>
          {state === 'working' ? t.games.raConnecting : t.games.raConnect}
        </Text>
      </Pressable>
    </Appear>
  );
}

function Connected({ account }: { account: RAAccount }) {
  const { t } = useI18n();
  const { setAccount } = useRA();
  const [profile, setProfile] = useState<RAProfile | null>(null);
  const [recent, setRecent] = useState<RARecentGame[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchProfile(account), fetchRecentGames(account)])
      .then(([p, r]) => {
        if (!active) return;
        setProfile(p);
        setRecent(r);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [account]);

  return (
    <>
      <Appear options={{ index: 1 }} style={styles.profile}>
        {profile ? (
          <Image source={{ uri: profile.userPic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.rowText}>
          <Text style={styles.profileName} numberOfLines={1}>
            {(profile?.user ?? account.user).toUpperCase()}
          </Text>
          {profile && <Text style={styles.label}>{t.games.raPoints(profile.totalPoints)}</Text>}
        </View>
        <Pressable hitSlop={10} onPress={() => setAccount(null)}>
          <Text style={[styles.label, { color: C.accent }]}>{t.games.raDisconnect}</Text>
        </Pressable>
      </Appear>

      <Appear options={{ index: 2 }}>
        <Text style={styles.label}>{t.games.raRecent}</Text>
      </Appear>
      {failed ? (
        <Text style={styles.label}>{t.games.raOffline}</Text>
      ) : !recent ? (
        <Text style={styles.label}>{t.games.loading}</Text>
      ) : recent.length === 0 ? (
        <Text style={styles.label}>{t.games.raNoRecent}</Text>
      ) : (
        recent.map((g, i) => <RecentRow key={g.gameId} game={g} index={i} />)
      )}
    </>
  );
}

/**
 * Un juego jugado hace poco. "+ AGREGAR" lo busca en Wikipedia para traer su resumen y portada;
 * si no lo encuentra, lo agrega igual con lo que da RetroAchievements.
 */
function RecentRow({ game, index }: { game: RARecentGame; index: number }) {
  const { t } = useI18n();
  const { games, addGame, updateGame } = useGames();
  const { profile } = useProfile();
  const [adding, setAdding] = useState(false);
  const inMyGames = games.some((g) => g.raGameId === game.gameId);
  const title = cleanTitle(game.title);
  const percent = game.total ? game.earned / game.total : 0;

  const add = async () => {
    if (adding || inMyGames) return;
    setAdding(true);
    const status = game.total > 0 && game.earned === game.total ? 'played' : 'playing';
    // Si la consola es una de tus plataformas, queda marcada.
    const linked = {
      raGameId: game.gameId,
      ...(matchPlatform(game.console, profile.platforms) && {
        platforms: [matchPlatform(game.console, profile.platforms)!],
      }),
    };
    try {
      const hits = await searchGames(title);
      const best = hits
        .map((h) => ({ hit: h, score: titleSimilarity(h.title, title) }))
        .sort((a, b) => b.score - a.score)[0];
      if (best && best.score >= 0.5) {
        // Si ya lo tenías (agregado desde la búsqueda), solo se enlaza.
        const existing = games.find((g) => g.id === best.hit.key);
        if (existing) {
          // Si ya le marcaste plataformas, no se tocan.
          updateGame(best.hit.key, existing.platforms?.length ? { raGameId: game.gameId } : linked);
        } else {
          addGame(await fetchGame(best.hit.key), status, linked);
        }
        return;
      }
    } catch {
      // Sin Wikipedia, se agrega con los datos de RetroAchievements.
    } finally {
      setAdding(false);
    }
    addGame(
      {
        key: `ra-${game.gameId}`,
        title,
        description: game.console,
        summary: '',
        coverUrl: game.boxArt,
      },
      status,
      linked,
    );
  };

  return (
    <Appear options={{ index: Math.min(index + 3, 10) }} style={styles.row}>
      <Image source={{ uri: game.icon }} style={styles.icon} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title.toUpperCase()}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {game.console.toUpperCase()}
          {game.total ? `  ·  ${game.earned}/${game.total}` : ''}
        </Text>
        {game.total > 0 && (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${percent * 100}%` }]} />
          </View>
        )}
      </View>
      {inMyGames ? (
        <Text style={styles.label}>{t.games.raInMyGames}</Text>
      ) : (
        <Pressable
          hitSlop={8}
          onPress={add}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
          <Text style={styles.actionText}>{adding ? t.games.raAdding : t.games.raAdd}</Text>
        </Pressable>
      )}
    </Appear>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    paddingHorizontal: Layout.gutter,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  hint: { fontFamily: Type.mono, fontSize: 10, lineHeight: 15, color: C.textSecondary },
  form: { gap: Spacing.two },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    fontFamily: Type.mono,
    fontSize: 13,
    color: C.text,
    marginBottom: Spacing.two,
  },
  button: {
    marginTop: Spacing.two,
    borderRadius: 999,
    backgroundColor: C.text,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonText: { fontFamily: Type.monoBold, fontSize: 13, color: C.background, letterSpacing: 2 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    padding: Spacing.three,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.backgroundElement },
  profileName: { fontFamily: Type.dot, fontSize: 22, lineHeight: 26, color: C.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderRadius: Layout.radius,
    padding: Spacing.three,
  },
  icon: { width: 48, height: 48, borderRadius: 8, backgroundColor: C.backgroundSelected },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  bar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: C.border,
    marginTop: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: C.accent },
  action: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actionText: { fontFamily: Type.mono, fontSize: 10, color: C.text, letterSpacing: 1 },
});
