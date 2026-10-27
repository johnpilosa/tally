import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Appear } from '@/animations/appear';
import { GamesMenuButton } from '@/components/games-nav';
import { LangSwitch } from '@/components/lang-switch';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useFocusKey } from '@/hooks/use-focus-key';
import { reviewOf, useGames } from '@/lib/games';
import { useCloud } from '@/lib/cloud';
import { useI18n } from '@/lib/i18n';
import { SuggestedPlatforms, useProfile, type Profile } from '@/lib/profile';
import { useRA } from '@/lib/retro-achievements';
import { savePhoto } from '@/lib/save-photo';

const C = Colors.dark;
const AVATAR = 96;

/**
 * Tu perfil: foto, nombre, una frase, tus números y las plataformas en las que juegas (las que
 * después eliges en cada juego). También lleva a la cuenta de RetroAchievements.
 */
export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile, loaded } = useProfile();
  const focusKey = useFocusKey();

  return (
    <View style={styles.screen}>
      <ScreenHeader
        app="games"
        right={
          <>
            <LangSwitch />
            <GamesMenuButton />
          </>
        }
      />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.four}>
        <ScreenTitle rule>{t.games.profileTitle}</ScreenTitle>
        {/* Espera a que cargue: los campos empiezan con lo guardado. */}
        {loaded && <ProfileBody key={focusKey} profile={profile} />}
      </KeyboardAwareScrollView>
    </View>
  );
}

function ProfileBody({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { updateProfile } = useProfile();
  const { games } = useGames();
  const { account } = useRA();
  const cloud = useCloud();

  // Una foto elegida antes de tener cuenta (solo en este teléfono) se sube al entrar.
  const { session, uploadPhoto } = cloud;
  useEffect(() => {
    const photo = profile.photo;
    if (!session || !photo || /^https?:/.test(photo)) return;
    uploadPhoto(photo)
      .then((url) => updateProfile({ photo: url }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  // Lo que escribes vive aquí (para no perder letras) y se guarda en cada cambio.
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      // En el navegador se guarda la imagen como texto; en el teléfono, como archivo.
      base64: Platform.OS === 'web',
    });
    if (result.canceled) return;
    const local = savePhoto(result.assets[0], profile.photo);
    updateProfile({ photo: local });
    // Con cuenta, la foto también se sube, para verla en tus otros dispositivos.
    if (cloud.session) {
      cloud
        .uploadPhoto(local)
        .then((url) => updateProfile({ photo: url }))
        .catch(() => {});
    }
  };

  const stats = [
    { label: t.games.statGames, value: games.length },
    { label: t.games.statPlayed, value: games.filter((g) => g.status === 'played').length },
    {
      label: t.games.statReviews,
      value: games.filter((g) => {
        const r = reviewOf(g);
        return r.title || r.subtitle || r.body;
      }).length,
    },
  ];

  return (
    <>
      <Appear options={{ index: 1 }} style={styles.head}>
        <View style={styles.avatarCol}>
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel={profile.photo ? t.games.changePhoto : t.games.addPhoto}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}>
            {profile.photo ? (
              <Image
                source={{ uri: profile.photo }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarPlus}>+</Text>
            )}
          </Pressable>
          <Pressable hitSlop={8} onPress={pickPhoto}>
            <Text style={styles.small}>
              {profile.photo ? t.games.changePhoto : t.games.addPhoto}
            </Text>
          </Pressable>
          {profile.photo && (
            <Pressable hitSlop={8} onPress={() => updateProfile({ photo: null })}>
              <Text style={[styles.small, { color: C.textSecondary }]}>{t.games.removePhoto}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.names}>
          <TextInput
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              updateProfile({ username: v });
            }}
            placeholder={t.games.usernamePlaceholder}
            placeholderTextColor={C.textSecondary}
            autoCorrect={false}
            style={styles.username}
          />
          <TextInput
            value={bio}
            onChangeText={(v) => {
              setBio(v);
              updateProfile({ bio: v });
            }}
            placeholder={t.games.bioPlaceholder}
            placeholderTextColor={C.textSecondary}
            multiline
            style={styles.bio}
          />
        </View>
      </Appear>

      <Appear options={{ index: 2 }} style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </Appear>

      <Appear options={{ index: 3 }} style={styles.box}>
        <Platforms platforms={profile.platforms} />
      </Appear>

      {cloud.available && (
        <Appear options={{ index: 4 }}>
          <Pressable
            onPress={() => router.push('/games/account')}
            style={({ pressed }) => [styles.box, styles.linkRow, pressed && { opacity: 0.6 }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.link}>{t.games.account}</Text>
              <Text style={styles.label} numberOfLines={1}>
                {cloud.session
                  ? `${(cloud.session.user.email ?? '').toUpperCase()} · ${
                      cloud.status === 'signedOut' || cloud.status === 'off'
                        ? ''
                        : t.games.syncStatus[cloud.status]
                    }`
                  : t.games.accountSignedOut}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Appear>
      )}

      <Appear options={{ index: 5 }}>
        <Pressable
          onPress={() => router.push('/games/retro')}
          style={({ pressed }) => [styles.box, styles.linkRow, pressed && { opacity: 0.6 }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.link}>{t.games.raTitle}</Text>
            <Text style={styles.label}>
              {account ? t.games.connectedAs(account.user.toUpperCase()) : t.games.notConnected}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Appear>
    </>
  );
}

/** Tus plataformas: quitar con ✕, agregar escribiendo o con un toque en las sugeridas. */
function Platforms({ platforms }: { platforms: string[] }) {
  const { t } = useI18n();
  const { addPlatform, removePlatform } = useProfile();
  const [name, setName] = useState('');
  const suggestions = SuggestedPlatforms.filter(
    (s) => !platforms.some((p) => p.toLowerCase() === s.toLowerCase()),
  );

  const add = () => {
    if (!name.trim()) return;
    addPlatform(name);
    setName('');
  };

  return (
    <>
      <Text style={styles.label}>{t.games.myPlatforms}</Text>
      {platforms.length === 0 ? (
        <Text style={styles.label}>{t.games.noPlatforms}</Text>
      ) : (
        <View style={styles.chips}>
          {platforms.map((p) => (
            <View key={p} style={[styles.chip, styles.chipOn]}>
              <Text style={[styles.chipText, { color: C.text }]}>{p.toUpperCase()}</Text>
              <Pressable hitSlop={8} onPress={() => removePlatform(p)}>
                <Text style={styles.chipX}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          placeholder={t.games.platformPlaceholder}
          placeholderTextColor={C.textSecondary}
          returnKeyType="done"
          style={styles.addInput}
        />
        <Pressable onPress={add} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.3 }}>
          <Text style={styles.link}>{t.games.addInsight}</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <>
          <Text style={styles.label}>{t.games.quickAdd}</Text>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                onPress={() => addPlatform(s)}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}>
                <Text style={styles.chipText}>+ {s.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    paddingHorizontal: Layout.gutter,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  small: { fontFamily: Type.mono, fontSize: 10, color: C.text, letterSpacing: 1 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  head: { flexDirection: 'row', gap: Spacing.four, alignItems: 'flex-start' },
  avatarCol: { alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlus: { fontFamily: Type.dot, fontSize: 36, color: C.textSecondary },
  names: { flex: 1, gap: Spacing.two, paddingTop: Spacing.two },
  username: {
    fontFamily: Type.dot,
    fontSize: 26,
    lineHeight: 30,
    color: C.text,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  bio: {
    fontFamily: Type.mono,
    fontSize: 12,
    lineHeight: 18,
    color: C.text,
    paddingVertical: 0,
    minHeight: 36,
  },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: Type.dot, fontSize: 30, lineHeight: 34, color: C.text },
  box: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipOn: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  chipX: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  addInput: { flex: 1, minHeight: 44, fontFamily: Type.mono, fontSize: 12, color: C.text },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  chevron: { fontFamily: Type.mono, fontSize: 20, color: C.textSecondary },
});
