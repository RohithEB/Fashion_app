import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, sizes, spacing } from '../../theme/tokens';
import { AppIconName, Icon } from '../../theme/icons';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { AppButton } from '../../widgets/AppButton';

/// Create a salesperson account. On success the associate is signed in
/// immediately (a token is issued) and the router advances to pairing.
/// Ported from `RegisterScreen`.
export function RegisterScreen() {
  const { colors, text } = useTheme();
  const { auth } = useDeps();
  useListenable(auth);
  const nav = useNavigation<any>();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const goBack = () => {
    auth.clearError();
    nav.goBack();
  };

  const submit = async () => {
    Keyboard.dismiss();
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    const nErr = trimmedName.length === 0 ? 'Enter your name' : null;
    let uErr: string | null = null;
    if (trimmedUsername.length === 0) uErr = 'Choose a username';
    else if (trimmedUsername.length < 3) uErr = 'At least 3 characters';
    const pErr = password.length < 4 ? 'At least 4 characters' : null;
    const cErr = confirm !== password ? 'Passwords do not match' : null;

    setNameError(nErr);
    setUsernameError(uErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (nErr != null || uErr != null || pErr != null || cErr != null) return;

    // On success the associate is signed in and the route guard swaps the auth
    // stack for the Connect screen automatically — do NOT navigate here (calling
    // goBack after the stack is replaced throws "GO_BACK was not handled").
    await auth.register({
      name: trimmedName,
      title: title.trim(),
      username: trimmedUsername,
      password,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          height: 56,
        }}
      >
        <Pressable onPress={goBack} hitSlop={12}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: spacing.md }} />
        <Text style={text.titleLarge}>Create account</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ height: spacing.lg }} />
        <Text style={eyebrow(colors.accent)}>NEW ASSOCIATE</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>
          Set up your studio profile to start showing collections.
        </Text>
        <View style={{ height: spacing.xl }} />
        <FormField
          label="Full name"
          icon="person"
          value={name}
          onChangeText={setName}
          error={nameError}
          autoCapitalize="words"
          returnKeyType="next"
          colors={colors}
          text={text}
        />
        <View style={{ height: spacing.md }} />
        <FormField
          label="Title (optional)"
          icon="sparkle"
          value={title}
          onChangeText={setTitle}
          error={null}
          autoCapitalize="words"
          returnKeyType="next"
          placeholder="e.g. Senior Style Advisor"
          colors={colors}
          text={text}
        />
        <View style={{ height: spacing.md }} />
        <FormField
          label="Username"
          icon="person"
          value={username}
          onChangeText={setUsername}
          error={usernameError}
          autoCapitalize="none"
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
          returnKeyType="next"
          colors={colors}
          text={text}
        />
        <View style={{ height: spacing.md }} />
        <FormField
          label="Confirm password"
          icon="lock"
          value={confirm}
          onChangeText={setConfirm}
          error={confirmError}
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
          label={auth.isBusy ? 'Creating account…' : 'Create account'}
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
  placeholder,
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
  placeholder?: string;
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
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
        />
      </View>
      {error != null && (
        <Text style={[text.bodySmall, { color: colors.error, marginTop: spacing.xxs }]}>{error}</Text>
      )}
    </View>
  );
}
