# Flutter → React Native porting guide (mobile_app)

You are porting ONE Flutter screen (Dart) to a faithful React Native + Expo (SDK 57,
TypeScript) equivalent. Match the Dart layout, copy, spacing, colours, and behaviour
as closely as RN allows. **Do NOT run anything. Only write the file(s) assigned.**
The whole foundation already exists — import from it, do not re-create it.

## Component shape
- Screens are React function components, **named exports**, e.g. `export function LoginScreen() { ... }`.
- No props (they are React Navigation screens). Get everything from hooks.
- Use `react-native` primitives: `View`, `Text`, `ScrollView`, `Pressable`, `TextInput`,
  `FlatList`, `ActivityIndicator`, `Switch`, `Modal`, `Image`, `useWindowDimensions`.
- Wrap top-level screen content in `SafeAreaView` from `react-native-safe-area-context`
  (`import { SafeAreaView } from 'react-native-safe-area-context'`).

## Theme (import from `../../theme/...`)
- `import { useTheme } from '../../theme/ThemeProvider'` → `const { colors, text } = useTheme();`
  - `colors`: AppColors tokens — `colors.accent`, `background`, `surface`, `surfaceElevated`,
    `card`, `primary`, `onPrimary`, `textPrimary`, `textSecondary`, `textTertiary`, `border`,
    `divider`, `error`, `success`, `warning`, `overlay`, `onAccent`, `disabled`, `onDisabled`.
  - `text`: TextTheme — `text.displaySmall`, `headlineLarge/Medium/Small`, `titleLarge/Medium/Small`,
    `bodyLarge/Medium/Small`, `labelLarge/Medium/Small`. Each is a RN `TextStyle` object.
- `import { eyebrow, displayHero, sansRegular } from '../../theme/typography'`
  - `eyebrow(color)` → uppercase wide-tracking overline style. Use for ALL-CAPS labels.
  - `sansRegular(baseStyle)` → same style but regular weight (use where Flutter did
    `titleLarge.copyWith(fontWeight: w400)` — custom fonts can't synthesize weight).
- `import { spacing, radius, sizes } from '../../theme/tokens'`
  - spacing: none,xxs(4),xs(8),sm(12),md(16),lg(20),xl(24),xxl(32),xxxl(40),huge(48),giant(64).
  - radius: sm(8),md(12),lg(16),xl(24),pill(999).
  - sizes: buttonSm/Md/Lg, iconXs/Sm/Md/Lg/Xl, opacityDisabled(0.38), ratio*, breakpoint*.
- `import { withAlpha } from '../../theme/colors'` → `withAlpha('#RRGGBB', 0.14)`.
- Icons: `import { Icon } from '../../theme/icons'` → `<Icon name="cart" size={24} color={colors.textPrimary} />`.
  Valid names (map from AppIcons.*): search, home, back, forward, close, menu, more, chevronDown,
  cart, add, remove, delete, checkout, payment, tag, showOnScreen, connected, qrScan, qrCode,
  play, pause, gallery, video, palette, disconnect, zoomIn, sparkle, success, check, warning,
  error, info, empty, person, logout, lock, visible, hidden, size, favorite, filter.
  (For Flutter `Icons.settings_outlined` use name="filter" or an appropriate close match; for
  `Icons.person_outline` use "person"; `Icons.lock_outline` → "lock"; `Icons.dns_outlined`/`Icons.tag`
  are only in the settings sheet which is already ported.)

## Flutter → RN mapping cheatsheet
- `SizedBox(height: X)` → `<View style={{ height: X }} />`; width similar.
- `Padding(EdgeInsets.all(X))` → `style={{ padding: X }}`; symmetric → paddingHorizontal/Vertical.
- `Column` → `<View>` (default flexDirection column). `Row` → `<View style={{ flexDirection:'row', alignItems:'center' }}>`.
- `Expanded` → `style={{ flex: 1 }}`. `Spacer()` → `<View style={{ flex: 1 }} />`.
- `Container(decoration: BoxDecoration(color, borderRadius, border))` →
  `<View style={{ backgroundColor, borderRadius, borderWidth: 1, borderColor }}>`.
- `Text(s, style: t.titleMedium)` → `<Text style={text.titleMedium}>{s}</Text>`.
  Colour override: `style={[text.titleMedium, { color: colors.textSecondary }]}`.
- `maxLines: 1, overflow: ellipsis` → `numberOfLines={1}`.
- `TextField/TextFormField` → `<TextInput>` with `value`/`onChangeText`. Use local `useState`.
  Form validation: do it inline in the submit handler (set a local error string state).
- `GestureDetector(onTap)` / `InkWell(onTap)` → `<Pressable onPress={...}>`.
- `context.watch<X>()` → get controller from `useDeps()`, then `useListenable(controller)` to
  re-render on change. `context.read<X>()` (no rebuild) → just `useDeps().x` and call methods.
- `context.select<X, R>((x)=>x.field)` → `useListenableSelector(controller, c => c.field)`.

## Dependency injection & controllers
`import { useDeps } from '../../app/providers'` →
`const { auth, catalog, cart, onboarding, customerDirectory, connection, presentation, checkoutRepo, journey } = useDeps();`
Subscribe with `import { useListenable, useListenableSelector } from '../../core/useListenable'`.

Controller APIs you may need:
- **auth** (AuthController): `.isAuthenticated`, `.salesperson` (Salesperson|null: `.name`,`.title`,`.username`),
  `.token`, `.isBusy`, `.error`, `.bootstrapped`, `login({username,password})`, `register({name,title?,username,password})`,
  `logout()`, `clearError()`. login/register return `Promise<boolean>`.
- **catalog** (CatalogController): `.state` (LoadState enum from '../catalog/catalogController':
  `LoadState.idle|loading|ready|error`), `.categories` (Category[]), `.products` (Product[]),
  `.selectedCategoryId`, `.query`, `.error`, `.lastViewedProduct`, `load()`, `selectCategory(id|null)`,
  `search(q)`, `refresh()`.
- **cart** (CartController): `.cart` (Cart), `addItem(product,{variantId,size})`, `setQuantity(lineId,q)`,
  `setSize(lineId,size)`, `removeItem(lineId)`, `clear()`.
- **onboarding** (OnboardingController): `.options` (OnboardingOptions: `.genders`,`.ageRanges`,`.personalities`),
  `.optionsLoading`, `.submitting`, `.error`, `.customer` (Customer|null), `isCompletedFor(sessionId)`,
  `submit({sessionId,draft})`, `updateProfile(customer)`, `persistProfileUpdate(draft,{sessionId})`, `skip(sessionId)`.
- **customerDirectory** (CustomerDirectoryController): `.profiles` (Customer[]), `.isLoaded`, `.isEmpty`,
  `save(customer)`, `remove(id)`, `byId(id)`, static `CustomerDirectoryController.labelFor(c)`, `.summaryFor(c)`.
- **connection** (ConnectionController): `.status` (ConnectionStatus from '../connection/connectionController':
  `.disconnected|connecting|connected|error`), `.session` (SessionInfo|null: `.sessionId`,`.salesperson`),
  `.error`, `.isConnected`, `.idleWarning`, `.idleSecondsLeft`, `connectFromQr(raw,{salesperson})`,
  `keepAlive()`, `disconnect()`, `endSession()`.
- **presentation** (PresentationController): `.presentation` (ProductPresentation|null), `.product` (Product|null),
  `.isPresenting`, `.cartOnScreen`, `sessionId` (settable), `showProduct(product,{variantId?,size?})`,
  `showRecommendations(ids)`, `showCatalog()`, `showCart(payload)`, `syncCart(payload)`, `hideProduct()`,
  `changeColor(variantId,{size?})`, `changeSize(size)`, `changeImage(i)`, `zoom(scale,{focalX,focalY})`,
  `pan(dx,dy)`, `setFullscreen(b)`, `resetZoom()`, `resetView()`, `showDetails(b)`, `toggleAIHighlights()`,
  `showRelatedMedia(id)`, `showGallery()`, `focusImage(i)`, `playVideo()`, `pauseVideo()`, `seekVideo(ms)`,
  `syncScroll(fraction)`.
- **checkoutRepo** (CheckoutRepository): `checkout({sessionId,token,cart,customer?})` → `Promise<Order>`.
  `import { CustomerDraft, CheckoutException } from '../../data/checkoutRepository'`.
- **journey** (JourneyLogger): `journey.log({eventType, token, sessionId?, refId?, meta?})`.

## Models (import from `../../models/...`)
- `Money`: `.formatted` (string), `.major`, `.minorUnits`.
- `Product`: `.id,.name,.brand,.categoryId,.price(Money),.variants(ProductVariant[]),.description,`
  `.aiHighlights(string[]),.materials(string[]),.details(ProductDetail[]),.isNew,.heroImage,`
  `.defaultVariant, variantById(id)`. `ProductVariant`: `.id,.colorName,.colorHex,.sizes(string[]),`
  `.images(ProductMedia[]),.video(ProductMedia?),.price(Money?)`. `ProductMedia`: `.url,.thumbnailUrl,.caption,.isVideo`.
- `Category`: `.id,.name,.tagline?`.
- `Customer` + `CustomerOptions` + `OnboardingOptions` from '../../models/customer' (see file for all fields;
  `Customer` has `copyWith(patch)`, `.styleHints`, `.isEmpty`, `.isFamilyShopping`, constructor `new Customer({ id, ... })`).
- `Order`: `.id,.status,.itemCount,.subtotal,.tax,.total(Money),.items(OrderItem[]),.customerName?`.
  `OrderItem`: `.name,.quantity,.lineTotal(Money),.color?,.size?`.
- `Cart`: `.items(CartItem[]),.count,.subtotal,.tax,.total,.discount,.isEmpty`.
  `CartItem`: `.product,.variantId,.size,.quantity,.variant,.unitPrice,.lineTotal,.lineId`.
- `Salesperson`, `SessionInfo`, `PairingInfo` from '../../models/session'.

## Widgets (import from `../../widgets/...` and feature widgets)
- `AppButton`: `<AppButton label onPress variant? size? icon? isLoading? expand? />`
  variant: 'primary'|'secondary'|'outline'|'ghost'; size: 'small'|'medium'|'large'; icon is an AppIconName.
  Disable by passing `onPress={null}` or omitting.
- `NetworkPhoto`: `<NetworkPhoto url borderRadius? resizeMode? style? />`. It fills its parent (flex:1) — give
  the parent a fixed height/aspectRatio or wrap in a sized View.
- `PriceTag`: `<PriceTag base={Money} effective={Money} style? />`.
- `EmptyStateView`,`ErrorStateView`,`LoadingView` from '../../widgets/StateViews'.
- `ProductCard`: `<ProductCard product onTap onPresent? ctaLabel? imageHeight={number} />`.
- `InitialsAvatar`: `<InitialsAvatar name radius? />`, `formatDate(isoString)` from '../../widgets/InitialsAvatar'.
- `NowShowingBar` from '../presentation/widgets/NowShowingBar' (self-contained; render at the bottom of scaffolds
  where the Flutter screen showed it).
- `CustomerForm` from '../customer/widgets/CustomerForm' (if it exists; onboarding/customer screens use it).
- `ServerSettingsSheet` from '../settings/ServerSettingsSheet': `<ServerSettingsSheet visible onClose />` — a
  controlled Modal. Host it with local `useState` and a button that sets visible=true.

## Navigation (React Navigation)
- `import { useNavigation, useRoute } from '@react-navigation/native'`.
- `const nav = useNavigation<any>();` then `nav.navigate('Home')`, `nav.navigate('Product', { product })`,
  `nav.navigate('Cart')`, `nav.navigate('Recommendations')`, `nav.navigate('Checkout')`,
  `nav.navigate('Success', { order })`, `nav.navigate('CustomerProfile')`, `nav.navigate('Profile')`,
  `nav.navigate('Register')`, `nav.goBack()`.
- Read params: `const route = useRoute<any>(); const product = route.params?.product ?? catalog.lastViewedProduct;`
- Route guards are automatic (login→connect→onboarding→home handled by RootNavigator). After
  `auth.login()` / `connection.connectFromQr()` / `onboarding.submit()` succeed you do NOT manually navigate —
  the guard swaps stacks. (You MAY `nav.navigate` between screens within the same authed group.)

## Behaviour notes
- Match all copy strings, ALL-CAPS eyebrow labels, and section order exactly.
- Show `auth.error` / `connection.error` etc. in `colors.error` where the Dart does.
- For `showModalBottomSheet` → use a `<Modal transparent animationType="slide">` with a dimmed
  `Pressable` backdrop (`backgroundColor: colors.overlay`) and a rounded top sheet, OR a simple full
  screen where appropriate. Follow the Dart content.
- Keep it TypeScript-clean (the whole project is typechecked with `tsc --noEmit`). No `any` unless needed
  for navigation (`useNavigation<any>()` is fine).
