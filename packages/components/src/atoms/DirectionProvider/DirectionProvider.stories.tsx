import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "../../molecules/Breadcrumb";
import { Slider } from "../../molecules/Slider";
import { Tabs } from "../../molecules/Tabs";
import { Navbar } from "../../organisms/Navbar";
import { Text } from "../Text";
import { DirectionProvider } from "./DirectionProvider";
import { directionProviderPlaygroundSnippet, directionProviderSnippets } from "./DirectionProvider.snippets";

const meta: Meta<typeof DirectionProvider> = {
  title: "Atoms/Utility/DirectionProvider",
  component: DirectionProvider,
  parameters: { layout: "padded" },
  argTypes: {
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction for everything inside. A direction-aware component given no `dir` of its own uses this one; a `dir` on the component itself still wins.",
    },
    children: { control: false, description: "What the direction applies to. The provider draws no element of its own." },
  },
  args: { dir: "ltr" },
};

export default meta;

type Story = StoryObj<typeof DirectionProvider>;

function Brand() {
  return <Navbar.Brand href="/">dbM</Navbar.Brand>;
}

/** Change `dir` and the navbar below mirrors with it: it was given no `dir` of its own. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        transform: (_code: string, context: StoryContext) => directionProviderPlaygroundSnippet(context.args as { dir?: "ltr" | "rtl" }),
      },
    },
  },
  render: ({ dir }) => (
    <DirectionProvider dir={dir}>
      <Navbar>
        <Brand />
      </Navbar>
    </DirectionProvider>
  ),
};

/** One provider near the root sets the direction for every direction-aware component inside. */
export const WholeApp: Story = {
  parameters: { docs: { source: { code: directionProviderSnippets.wholeApp } } },
  argTypes: { dir: { control: false } },
  render: () => (
    <DirectionProvider dir="rtl">
      <Navbar>
        <Brand />
      </Navbar>
    </DirectionProvider>
  ),
};

/** A `dir` on the component itself wins, for one island that reads the other way. */
export const OwnDirWins: Story = {
  name: "A component's own dir wins",
  parameters: { docs: { source: { code: directionProviderSnippets.ownWins } } },
  argTypes: { dir: { control: false } },
  render: () => (
    <DirectionProvider dir="rtl">
      <Navbar>
        <Brand />
      </Navbar>
      <section aria-label="English island">
        <Navbar dir="ltr">
          <Brand />
        </Navbar>
      </section>
    </DirectionProvider>
  ),
};

interface Language {
  /** BCP 47 tag, for the `lang` attribute: it picks the right fonts and shaping for the script. */
  lang: string;
  /** The language's name in itself. */
  name: string;
  /** A short English label under the name: the script (Persian and Urdu, which share Arabic's script, show their English names). */
  script: string;
  overview: string;
  billing: string;
  home: string;
  settings: string;
  volume: string;
}

const leftToRight: Language[] = [
  { lang: "en", name: "English", script: "Latin", overview: "Overview", billing: "Billing", home: "Home", settings: "Settings", volume: "Volume" },
  { lang: "ru", name: "Русский", script: "Cyrillic", overview: "Обзор", billing: "Оплата", home: "Главная", settings: "Настройки", volume: "Громкость" },
  { lang: "el", name: "Ελληνικά", script: "Greek", overview: "Επισκόπηση", billing: "Χρέωση", home: "Αρχική", settings: "Ρυθμίσεις", volume: "Ένταση" },
  { lang: "hi", name: "हिन्दी", script: "Devanagari", overview: "अवलोकन", billing: "बिलिंग", home: "मुखपृष्ठ", settings: "सेटिंग्स", volume: "आवाज़" },
  { lang: "ja", name: "日本語", script: "Han, Hiragana and Katakana", overview: "概要", billing: "請求", home: "ホーム", settings: "設定", volume: "音量" },
  { lang: "ko", name: "한국어", script: "Hangul", overview: "개요", billing: "결제", home: "홈", settings: "설정", volume: "볼륨" },
];

const rightToLeft: Language[] = [
  { lang: "ar", name: "العربية", script: "Arabic", overview: "نظرة عامة", billing: "الفوترة", home: "الرئيسية", settings: "الإعدادات", volume: "مستوى الصوت" },
  { lang: "he", name: "עברית", script: "Hebrew", overview: "סקירה", billing: "חיוב", home: "בית", settings: "הגדרות", volume: "עוצמת קול" },
  { lang: "fa", name: "فارسی", script: "Persian", overview: "نمای کلی", billing: "صورتحساب", home: "خانه", settings: "تنظیمات", volume: "بلندی صدا" },
  { lang: "ur", name: "اردو", script: "Urdu", overview: "جائزہ", billing: "بلنگ", home: "ہوم", settings: "ترتیبات", volume: "آواز" },
];

/**
 * One language: the provider carries the direction to the components, and the `lang` and `dir` on the box are what the browser needs to
 * shape the text and lay out the plain text around them. Tabs, the breadcrumb and the slider mirror from the provider alone.
 */
function LanguageCard({ language, dir }: { language: Language; dir: "ltr" | "rtl" }) {
  return (
    <DirectionProvider dir={dir}>
      <div
        lang={language.lang}
        dir={dir}
        style={{
          display: "grid",
          gap: "var(--dbm-space-4)",
          padding: "var(--dbm-space-5)",
          border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          borderRadius: "var(--dbm-radius-lg)",
          background: "var(--dbm-bg-surface)",
        }}
      >
        <div style={{ display: "grid", gap: "var(--dbm-space-1)" }}>
          <Text weight="semibold">{language.name}</Text>
          <Text size="sm" color="secondary" lang="en">
            {language.script}
          </Text>
        </div>
        <Tabs defaultValue="overview">
          <Tabs.List aria-label={language.name}>
            <Tabs.Trigger value="overview">{language.overview}</Tabs.Trigger>
            <Tabs.Trigger value="billing">{language.billing}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview" style={{ display: "grid", gap: "var(--dbm-space-4)", paddingBlockStart: "var(--dbm-space-4)" }}>
            <Breadcrumb aria-label={language.name}>
              <Breadcrumb.Item>
                <Breadcrumb.Link href="/">{language.home}</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Breadcrumb.Page>{language.settings}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb>
            <Slider aria-label={language.volume} defaultValue={30} showValue />
          </Tabs.Content>
          <Tabs.Content value="billing" style={{ paddingBlockStart: "var(--dbm-space-4)" }}>
            <Text>{language.billing}</Text>
          </Tabs.Content>
        </Tabs>
      </div>
    </DirectionProvider>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
  gap: "var(--dbm-space-4)",
} as const;

/** Six left-to-right languages in six different scripts, and four right-to-left ones in two. Each card has its own provider. */
export const Languages: Story = {
  name: "Languages and scripts, in each direction",
  parameters: { docs: { source: { code: directionProviderSnippets.languages } } },
  argTypes: { dir: { control: false } },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      <section aria-labelledby="ltr-languages" style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        <Text id="ltr-languages" weight="semibold">
          Left to right
        </Text>
        <div style={grid}>
          {leftToRight.map((language) => (
            <LanguageCard key={language.lang} language={language} dir="ltr" />
          ))}
        </div>
      </section>
      <section aria-labelledby="rtl-languages" style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        <Text id="rtl-languages" weight="semibold">
          Right to left
        </Text>
        <div style={grid}>
          {rightToLeft.map((language) => (
            <LanguageCard key={language.lang} language={language} dir="rtl" />
          ))}
        </div>
      </section>
    </div>
  ),
};
