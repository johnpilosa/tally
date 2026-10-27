import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Appear } from '@/animations/appear';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useCloud } from '@/lib/cloud';
import { useI18n } from '@/lib/i18n';
import { formatAgo } from '@/lib/time';

const C = Colors.dark;

/** Vuelve al perfil (atrás si se puede; si se abrió directo, va al perfil). */
function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/games/profile');
}

/**
 * Tu cuenta: entrar o crear una (con email y contraseña) para respaldar tus datos en la nube
 * y usarlos en otros dispositivos. Ya dentro: cómo va la sincronización, y salir.
 */
export default function AccountScreen() {
  const { t } = useI18n();
  const { session } = useCloud();

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/games/profile" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.four}>
        <ScreenTitle rule>{t.games.account}</ScreenTitle>
        {session ? <SignedIn email={session.user.email ?? ''} /> : <SignInForm />}
      </KeyboardAwareScrollView>
    </View>
  );
}

function SignInForm() {
  const { t } = useI18n();
  const { signIn, signUp } = useCloud();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'error' | 'confirm'>('idle');
  const tooShort = mode === 'signUp' && password.length > 0 && password.length < 6;
  const ready = email.trim() && password.length >= 6 && state !== 'working';

  const submit = async () => {
    if (!ready) return;
    setState('working');
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
        leave();
      } else if (await signUp(email.trim(), password)) {
        // Supabase pide confirmar el email antes de poder entrar.
        setState('confirm');
        setMode('signIn');
      } else {
        leave();
      }
    } catch {
      setState('error');
    }
  };

  return (
    <Appear options={{ index: 1 }} style={styles.form}>
      <Text style={styles.hint}>{t.games.accountHint}</Text>
      <Text style={styles.label}>{t.games.email}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        style={styles.input}
      />
      <Text style={styles.label}>{t.games.password}</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
        secureTextEntry
        textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
        autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
        style={styles.input}
      />
      {tooShort && <Text style={styles.label}>{t.games.passwordShort}</Text>}
      {state === 'confirm' && (
        <Text style={[styles.label, { color: C.text }]}>{t.games.checkEmail}</Text>
      )}
      {state === 'error' && (
        <Text style={[styles.label, { color: C.accent }]}>
          {mode === 'signIn' ? t.games.authError : t.games.signUpError}
        </Text>
      )}
      <Pressable
        onPress={submit}
        disabled={!ready}
        style={({ pressed }) => [
          styles.button,
          !ready && { opacity: 0.3 },
          pressed && { opacity: 0.7 },
        ]}>
        <Text style={styles.buttonText}>
          {state === 'working'
            ? t.games.working
            : mode === 'signIn'
              ? t.games.signIn
              : t.games.signUp}
        </Text>
      </Pressable>
      <Pressable
        hitSlop={8}
        onPress={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setState('idle');
        }}
        style={styles.switch}>
        <Text style={styles.link}>
          {mode === 'signIn' ? t.games.noAccount : t.games.haveAccount}
        </Text>
      </Pressable>
    </Appear>
  );
}

function SignedIn({ email }: { email: string }) {
  const { t, lang } = useI18n();
  const { status, lastSync, signOut } = useCloud();
  const now = useNow();
  const [confirm, setConfirm] = useState(false);

  const out = async () => {
    if (!confirm) return setConfirm(true);
    await signOut();
    leave();
  };

  return (
    <>
      <Appear options={{ index: 1 }} style={styles.box}>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[styles.dot, status === 'offline' && { backgroundColor: C.textSecondary }]}
          />
          <Text style={styles.label}>
            {status === 'signedOut' || status === 'off' ? '' : t.games.syncStatus[status]}
          </Text>
        </View>
        {lastSync && (
          <Text style={styles.label}>
            {t.games.syncedAt(formatAgo(lastSync, now, lang).toUpperCase())}
          </Text>
        )}
      </Appear>
      <Appear options={{ index: 2 }} style={styles.form}>
        <Pressable
          onPress={out}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.signOutText]}>{confirm ? t.confirmAgain : t.games.signOut}</Text>
        </Pressable>
        <Text style={styles.hint}>{t.games.signOutHint}</Text>
      </Appear>
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
  hint: { fontFamily: Type.mono, fontSize: 10, lineHeight: 15, color: C.textSecondary },
  link: { fontFamily: Type.mono, fontSize: 11, color: C.text, letterSpacing: 1 },
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
  switch: { alignSelf: 'center', padding: Spacing.three },
  box: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  email: { fontFamily: Type.mono, fontSize: 14, color: C.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  signOut: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  signOutText: { fontFamily: Type.mono, fontSize: 13, color: C.accent, letterSpacing: 2 },
});
