/**
 * The halftone/* rules, case by case: `npm run lint:rules`. Plain JSX through espree, no app config.
 * SOURCE: apps/mobile/eslint/halftone.test.mjs; apps/web has a copy (`npm run lint:sync` at the monorepo root).
 */
import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import halftone from './halftone.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  // Registered so `eslint-disable … halftone/<rule>` comments in the cases resolve.
  plugins: { halftone },
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
});
const ROOT = '/kit';
const at = (path) => `${ROOT}/${path}`;

tester.run('no-raw-colour', halftone.rules['no-raw-colour'], {
  valid: [
    'const a = <div className="bg-primary text-primary-foreground border-border" />;',
    'const a = <div className="bg-black/50 shadow-black/20 bg-transparent text-current" />;',
    'const a = <div className="w-[47.5%] grid-cols-[1fr_2fr] stroke-[3] text-[var(--x)] bg-[hsl(var(--primary))]" />;',
    'const a = <div className="[&_svg]:text-muted-foreground data-[state=open]:bg-accent" />;',
    'const a = <Card title="Order #4821" />;',
    "const order = { value: '#4821' };",
    'const a = <Icon color={palette.primary} />;',
    "const s = { color: 'hsl(var(--primary))', borderColor: 'var(--border)' };",
    'const a = <p>Use bg-primary for the main action.</p>;',
    "import x from 'bg-red-500';",
    'const tone = (t) => `bg-${t}-500`;',
  ],
  invalid: [
    { code: 'const a = <div className="bg-red-500" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className="p-4 text-white" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className="dark:hover:border-zinc-800/50" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className={cn("px-2", ok && "bg-emerald-600")} />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className={`flex ${x} text-blue-500 gap-2`} />;', errors: [{ messageId: 'paletteClass' }] },
    { code: "const v = cva('rounded', { variants: { tone: { danger: 'bg-rose-500' } } });", errors: [{ messageId: 'paletteClass' }] },
    { code: "const tile = 'rounded-xl bg-white';", errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className="text-[#fff]" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className="[color:#ffffff]" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: 'const a = <div className="shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" />;', errors: [{ messageId: 'paletteClass' }] },
    { code: "const a = <View style={{ backgroundColor: '#fff' }} />;", errors: [{ messageId: 'literal' }] },
    { code: 'const a = <Path fill="#000" />;', errors: [{ messageId: 'literal' }] },
    { code: 'const a = <Icon color="white" />;', errors: [{ messageId: 'literal' }] },
    { code: "const s = { border: '1px solid #ccc' };", errors: [{ messageId: 'literal' }] },
    { code: "const brandColor = 'rgb(37 99 235)';", errors: [{ messageId: 'literal' }] },
  ],
});

tester.run('no-alpha-colour', halftone.rules['no-alpha-colour'], {
  valid: [
    'const a = <div className="bg-primary-subtle border-warning-border text-muted-foreground" />;',
    'const a = <div className="bg-black/50 shadow-black/20 ring-ring/50 aria-invalid:ring-destructive/20" />;',
    'const a = <header className="bg-background/90 sticky top-0 backdrop-blur" />;',
    'const a = <div className="supports-[backdrop-filter]:bg-background/80 backdrop-blur" />;',
    'const a = <p className="text-sm/6 text-base/7" />;',
    'const a = <div className="w-1/2 basis-1/3 translate-x-1/2" />;',
    'const tone = (t) => `bg-${t}/15`;',
  ],
  invalid: [
    { code: 'const a = <div className="bg-primary/15" />;', errors: [{ messageId: 'alpha', data: { cls: 'bg-primary/15', hint: 'bg-primary-subtle (a tint), or bg-primary-pressed (pressed)' } }] },
    { code: 'const a = <div className="dark:hover:bg-input/50" />;', errors: [{ messageId: 'alpha' }] },
    { code: 'const a = <div className="border-warning/40 bg-warning/10" />;', errors: [{ messageId: 'alpha' }, { messageId: 'alpha' }] },
    { code: 'const a = <span className="text-foreground/60" />;', errors: [{ messageId: 'alpha' }] },
    { code: 'const a = <div className="bg-background/90" />;', errors: [{ messageId: 'alpha' }] },
    { code: "const v = { muted: 'bg-muted/50' };", errors: [{ messageId: 'alpha' }] },
  ],
});

tester.run('registry-imports', halftone.rules['registry-imports'], {
  valid: [
    { code: "import { Button } from '@/components/ui/button';", filename: at('app/x.jsx'), options: [{ root: ROOT, files: ['components/ui/button.tsx'] }] },
    { code: "import { Hero } from '@/components/kit/hero';", filename: at('app/x.jsx'), options: [{ root: ROOT, files: ['components/kit/hero.tsx'] }] },
    { code: "import { data } from '@/components/shop/data';", filename: at('app/x.jsx'), options: [{ root: ROOT, files: [] }] },
    { code: "import { Text } from '../ui/text';", filename: at('components/shop/card.jsx'), options: [{ root: ROOT, files: ['components/ui/text.tsx'] }] },
  ],
  invalid: [
    {
      code: "import { DataGrid } from '@/components/ui/data-grid';",
      filename: at('app/x.jsx'),
      options: [{ root: ROOT, files: ['components/ui/button.tsx'] }],
      errors: [{ messageId: 'unregistered' }],
    },
    {
      code: "import { NativeOnlyAnimatedView } from '../ui/native-only-animated-view';",
      filename: at('components/shop/card.jsx'),
      options: [{ root: ROOT, files: ['components/ui/button.tsx'] }],
      errors: [{ messageId: 'unregistered' }],
    },
    {
      code: "export { Thing } from '@/components/kit/thing';",
      filename: at('app/x.jsx'),
      options: [{ root: ROOT, files: [] }],
      errors: [{ messageId: 'unregistered' }],
    },
  ],
});

tester.run('no-foreign-ui', halftone.rules['no-foreign-ui'], {
  valid: [{ code: "import { Home } from 'lucide-react-native';", options: [{ packages: ['@mui', '@expo/vector-icons'] }] }],
  invalid: [
    { code: "import Button from '@mui/material/Button';", options: [{ packages: ['@mui'] }], errors: [{ messageId: 'foreign' }] },
    { code: "import { Ionicons } from '@expo/vector-icons';", options: [{ packages: ['@expo/vector-icons'] }], errors: [{ messageId: 'foreign' }] },
  ],
});

const RN = [{ source: 'react-native', names: ['Text', 'TextInput', 'Pressable'], message: 'use the kit.' }];
const CHARTS = [{ source: 'recharts', unlessFileImports: { source: '@/components/ui/chart', name: 'ChartContainer' }, message: 'use ChartContainer.' }];
tester.run('no-raw-primitives', halftone.rules['no-raw-primitives'], {
  valid: [
    { code: "import { View, ScrollView } from 'react-native';", options: [{ imports: RN }] },
    {
      code: "import { Bar } from 'recharts';\nimport { ChartContainer } from '@/components/ui/chart';",
      options: [{ imports: CHARTS }],
    },
  ],
  invalid: [
    { code: "import { View, Text, Pressable } from 'react-native';", options: [{ imports: RN }], errors: [{ messageId: 'primitive' }, { messageId: 'primitive' }] },
    { code: "import { BarChart } from 'recharts';", options: [{ imports: CHARTS }], errors: [{ messageId: 'primitive' }] },
  ],
});

tester.run('disable-needs-reason', halftone.rules['disable-needs-reason'], {
  valid: [
    '// eslint-disable-next-line halftone/no-raw-primitives -- the whole card is the tap target\nconst a = 1;',
    '// eslint-disable-next-line no-console\nconsole.log(1);',
  ],
  invalid: [{ code: '// eslint-disable-next-line halftone/no-raw-colour\nconst a = 1;', errors: [{ messageId: 'reason' }] }],
});
