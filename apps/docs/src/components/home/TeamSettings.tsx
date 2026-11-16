import {
  Avatar,
  Button,
  Card,
  DirectionProvider,
  FormField,
  Grid,
  Heading,
  Input,
  Navbar,
  PageHeader,
  Select,
  Stat,
  Switch,
} from "@dbm-system/components";
import { useEffect, useState } from "react";
import styles from "./TeamSettings.module.css";

type Dir = "ltr" | "rtl";

/** The composition's words, English and Persian. The right-to-left one is real Persian (with Persian digits), parts' own words included. */
const copy = {
  ltr: {
    lang: "en",
    brand: "Arman",
    links: ["Overview", "Team", "Billing"],
    user: "Sara Ahmadi",
    initials: "SA",
    title: "Team settings",
    description: "Manage who is on the team and how it works.",
    invite: "Invite member",
    stats: [
      { label: "Members", value: "12" },
      { label: "Seats left", value: "8" },
      { label: "Plan", value: "Pro" },
    ],
    details: "Details",
    teamName: "Team name",
    teamNameValue: "Design",
    role: "Default role",
    roles: [
      { value: "member", label: "Member" },
      { value: "admin", label: "Admin" },
      { value: "viewer", label: "Viewer" },
    ],
    summary: "Weekly summary",
    cancel: "Cancel",
    save: "Save changes",
    navbar: { menu: "Menu", navigation: "Main", close: "Close", skipLink: "Skip to content", externalLink: "(opens in a new tab)", search: "Search" },
  },
  rtl: {
    lang: "fa",
    brand: "آرمان",
    links: ["نمای کلی", "تیم", "صورت‌حساب"],
    user: "سارا احمدی",
    initials: "سا",
    title: "تنظیمات تیم",
    description: "اعضای تیم و شیوهٔ کار آن را مدیریت کنید.",
    invite: "دعوت از عضو",
    stats: [
      { label: "اعضا", value: "۱۲" },
      { label: "صندلی‌های باقی‌مانده", value: "۸" },
      { label: "طرح", value: "حرفه‌ای" },
    ],
    details: "جزئیات",
    teamName: "نام تیم",
    teamNameValue: "طراحی",
    role: "نقش پیش‌فرض",
    roles: [
      { value: "member", label: "عضو" },
      { value: "admin", label: "مدیر" },
      { value: "viewer", label: "بیننده" },
    ],
    summary: "خلاصهٔ هفتگی",
    cancel: "انصراف",
    save: "ذخیرهٔ تغییرات",
    navbar: { menu: "منو", navigation: "اصلی", close: "بستن", skipLink: "رفتن به محتوا", externalLink: "(در زبانهٔ جدید باز می‌شود)", search: "جست‌وجو" },
  },
} as const;

/**
 * The home page's "Accessible and responsive" composition: a team settings screen drawn from real DBM components, served on a page of its own
 * (`/composition/`) so the section can show it in a real narrow or wide viewport inside an iframe. The page that holds the iframe tells it
 * which direction to read in by message, and follows the reader's mode when it is toggled there.
 */
export function TeamSettings() {
  const [dir, setDir] = useState<Dir>("ltr");
  const text = copy[dir];

  useEffect(() => {
    const root = document.documentElement;
    root.lang = text.lang;
    root.dir = dir;
  }, [dir, text.lang]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; dir?: string } | null;
      if (data?.type === "dbm-direction" && (data.dir === "ltr" || data.dir === "rtl")) setDir(data.dir);
    };
    // The mode is stored by the page that toggles it; the storage event reaches this document, so the frame follows it.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "dbm-mode") return;
      const mode = event.newValue === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = mode === "dark" ? "purple-dark" : "purple-light";
      document.documentElement.dataset.mode = mode;
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    // Ready: the page holding this frame answers with the direction to start in.
    window.parent.postMessage({ type: "dbm-ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <DirectionProvider dir={dir}>
      <div className={styles.screen}>
        <Navbar labels={text.navbar}>
          <Navbar.Brand href="/composition/" onClick={(event) => event.preventDefault()}>
            {text.brand}
          </Navbar.Brand>
          <Navbar.Links>
            {text.links.map((label, index) => (
              <Navbar.Link key={label} href="/composition/" current={index === 1} onClick={(event) => event.preventDefault()}>
                {label}
              </Navbar.Link>
            ))}
          </Navbar.Links>
          <Navbar.Actions>
            <Avatar as="button" alt={text.user} initials={text.initials} />
          </Navbar.Actions>
        </Navbar>
        <main className={styles.main}>
          <PageHeader>
            <PageHeader.Title>{text.title}</PageHeader.Title>
            <PageHeader.Description>{text.description}</PageHeader.Description>
            <PageHeader.Actions>
              <Button>{text.invite}</Button>
            </PageHeader.Actions>
          </PageHeader>
          <Grid columns={{ base: 1, md: 3 }} gap={4}>
            {text.stats.map((stat) => (
              <Stat key={stat.label} variant="outlined">
                <Stat.Label>{stat.label}</Stat.Label>
                <Stat.Value>{stat.value}</Stat.Value>
              </Stat>
            ))}
          </Grid>
          <Card>
            <Card.Header>
              <Heading level={2} size="md">
                {text.details}
              </Heading>
            </Card.Header>
            <Card.Body>
              <div className={styles.form}>
                <FormField label={text.teamName}>{(field) => <Input {...field} defaultValue={text.teamNameValue} key={dir} />}</FormField>
                <FormField label={text.role}>
                  {(field) => (
                    <Select {...field} defaultValue="member" key={dir}>
                      {text.roles.map((role) => (
                        <Select.Option key={role.value} value={role.value}>
                          {role.label}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </FormField>
                <Switch defaultChecked>{text.summary}</Switch>
              </div>
            </Card.Body>
            <Card.Footer align="end">
              <Button variant="secondary">{text.cancel}</Button>
              <Button>{text.save}</Button>
            </Card.Footer>
          </Card>
        </main>
      </div>
    </DirectionProvider>
  );
}
