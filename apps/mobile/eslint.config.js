// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
// The design system's guardrails (eslint/halftone.mjs): errors an agent hits while it writes.
const halftone = require('./eslint/halftone.mjs').default;
const REGISTERED = require('./registry/generated/index.json').components.flatMap((c) => c.files);

const CODE = ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'];
// The registry's own sources: components/ui and components/kit define the kit, so they may use what screens can't.
const SOURCES = ['components/ui/**', 'components/kit/**'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'tokens/generated/*'],
  },
  {
    // Hex colours reach components through usePalette(), which follows a runtime theme override
    // (the docs site's Studio); the generated THEME and NAV_THEME don't.
    files: ['app/**', 'components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/theme',
              importNames: ['THEME', 'NAV_THEME'],
              message: 'Use usePalette() / useNavTheme() from @/lib/palette-context.',
            },
          ],
        },
      ],
    },
  },
  // Registered everywhere, so `npx eslint --rule '{"halftone/no-raw-colour":"error"}' <file>` works on any file.
  { plugins: { halftone }, linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: CODE,
    rules: {
      'halftone/no-foreign-ui': [
        'error',
        {
          packages: [
            '@expo/vector-icons',
            'react-native-vector-icons',
            'react-native-paper',
            '@gluestack-ui',
            'gluestack-ui',
            'native-base',
            '@rneui',
            'react-native-elements',
            'tamagui',
            '@tamagui',
          ],
        },
      ],
      'halftone/disable-needs-reason': 'error',
      // The registry sources too: a see-through colour is wrong in a component as much as in a screen.
      'halftone/no-alpha-colour': 'error',
    },
  },
  {
    files: CODE,
    ignores: SOURCES,
    rules: {
      'halftone/no-raw-colour': 'error',
      'halftone/registry-imports': ['error', { root: __dirname, files: REGISTERED }],
    },
  },
  {
    // Screens. The kit shell and the Components page demos render the kit itself, so they're left out.
    files: CODE,
    ignores: [...SOURCES, 'components/devkit/**', 'app/(kit)/**'],
    rules: {
      'halftone/no-raw-primitives': [
        'error',
        {
          imports: [
            {
              source: 'react-native',
              names: ['Text', 'TextInput', 'Pressable'],
              message: 'use Text from @/components/ui/text, Input or Textarea, or a Button / ListRow with onPress.',
            },
          ],
        },
      ],
    },
  },
]);
