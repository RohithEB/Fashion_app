import React, { useState } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, sizes, spacing } from '../../theme/tokens';
import { AppIconName, Icon } from '../../theme/icons';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { AppButton } from '../../widgets/AppButton';

/// Boutique sign-in. Login gates the whole app — a successful sign-in lets the
/// associate through to pair a display. Accounts are created by an admin in the
/// CMS; there is no self-registration.
export function LoginScreen() {
  const { colors, text } = useTheme();
  const { auth } = useDeps();
  useListenable(auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const submit = async () => {
    Keyboard.dismiss();
    const trimmedUsername = username.trim();
    const uErr = trimmedUsername.length === 0 ? 'Enter your username' : null;
    const pErr = password.length === 0 ? 'Enter your password' : null;
    setUsernameError(uErr);
    setPasswordError(pErr);
    if (uErr != null || pErr != null) return;
    // On success the router guard redirects to the connect screen automatically.
    await auth.login({ username: trimmedUsername, password });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ height: spacing.xxxl }} />
        <Text style={eyebrow(colors.accent)}>THE STUDIO</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={text.displaySmall}>Ebani</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>
          Sign in to begin a personal showroom session.
        </Text>
        <View style={{ height: spacing.xxl }} />
        <FormField
          label="Username"
          icon="person"
          value={username}
          onChangeText={setUsername}
          error={usernameError}
          autoCorrect={false}
          returnKeyType="next"
          colors={colors}
          text={text}
        />
        <View style={{ height: spacing.md }} />
        <FormField
          label="Password"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={submit}
          colors={colors}
          text={text}
        />
        {auth.error != null && (
          <>
            <View style={{ height: spacing.md }} />
            <Text style={[text.bodySmall, { color: colors.error }]}>{auth.error}</Text>
          </>
        )}
        <View style={{ height: spacing.xl }} />
        <AppButton
          label={auth.isBusy ? 'Signing in…' : 'Sign in'}
          expand
          isLoading={auth.isBusy}
          onPress={auth.isBusy ? null : submit}
        />
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/// A bordered field with a floating label above and a leading icon — the RN
/// equivalent of Flutter's `TextFormField` + `InputDecoration` with an inline
/// per-field validation message.
function FormField({
  label,
  icon,
  value,
  onChangeText,
  error,
  secureTextEntry,
  autoCapitalize = 'none',
  autoCorrect = true,
  returnKeyType,
  onSubmitEditing,
  colors,
  text,
}: {
  label: string;
  icon: AppIconName;
  value: string;
  onChangeText: (v: string) => void;
  error: string | null;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  text: ReturnType<typeof useTheme>['text'];
}) {
  return (
    <View>
      <Text style={[text.bodySmall, { color: colors.textSecondary, marginBottom: spacing.xxs }]}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: sizes.inputMd,
          borderWidth: 1,
          borderColor: error != null ? colors.error : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
        }}
      >
        <Icon name={icon} size={sizes.iconSm} color={colors.textSecondary} />
        <View style={{ width: spacing.sm }} />
        <TextInput
          style={[text.bodyLarge, { flex: 1, color: colors.textPrimary, padding: 0 }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          placeholderTextColor={colors.textTertiary}
        />
      </View>
      {error != null && (
        <Text style={[text.bodySmall, { color: colors.error, marginTop: spacing.xxs }]}>{error}</Text>
      )}
    </View>
  );
}
