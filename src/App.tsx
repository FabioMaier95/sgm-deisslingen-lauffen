import { useEffect, useState } from "react";

import {
  Bell, CalendarDays, ChevronRight, Clock3, Download, Home, LogIn,
  LogOut, MapPin, Menu, Newspaper, Shield, Trophy, UserRound, X
} from "lucide-react"; 

import { supabase } from "./main";

type AppRole = "admin" | "trainer" | "member";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  trainer: "Trainer",
  member: "Mitglied",
};

const MEMBER_TYPE_LABELS: Record<string, string> = {
  player: "Spieler",
  parent: "Elternteil",
  guardian: "Erziehungsberechtigter",
  other: "Sonstiges",
};
type Match = {
  id: number;
  team: string;
  opponent: string;
  date: string;
  time: string;
  venue: string;
  home: boolean;
  competition: string;
};

const matches: Match[] = [
  { id: 1, team: "SGM I", opponent: "Gegner folgt", date: "Sa., 19.09.", time: "15:30", venue: "Fürstensportplatz Deißlingen", home: true, competition: "Landesliga" },
  { id: 2, team: "SGM II", opponent: "Gegner folgt", date: "So., 20.09.", time: "13:00", venue: "Sportplatz Lauffen", home: true, competition: "Kreisliga" },
  { id: 3, team: "SGM III", opponent: "Gegner folgt", date: "So., 20.09.", time: "15:00", venue: "Auswärts", home: false, competition: "Kreisliga" }
];

const events = [
  { title: "SGM Vereinsfest", date: "Samstag, 04.07.2027", place: "Fürstensportplatz Deißlingen" },
  { title: "Jugendturnier", date: "Sonntag, 05.07.2027", place: "Sportgelände Deißlingen" }
];

function App() {
  const [page, setPage] = useState("home");
  const [menu, setMenu] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
const [roles, setRoles] = useState<AppRole[]>([]);
const [rolesLoading, setRolesLoading] = useState(false);
const loadRoles = async (userId: string) => {
  if (!supabase) return;

  setRolesLoading(true);

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("profile_id", userId);

  if (error) {
    console.error("Rollen konnten nicht geladen werden:", error);
    setRoles([]);
  } else {
    setRoles((data ?? []).map((item) => item.role as AppRole));
  }

  setRolesLoading(false);
};

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const navigate = (next: string) => {
    setPage(next);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate("home");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button" onClick={() => setMenu(true)} aria-label="Menü">
          <Menu size={24} />
        </button>
        <button className="brand" onClick={() => navigate("home")}>
          <img src="/logo.jpg" alt="SGM Deißlingen-Lauffen" />
          <span>SGM Deißlingen-Lauffen</span>
        </button>
        {session ? (
          <button className="login-button" onClick={() => navigate("member")}>
            <UserRound size={19} />
            <span>{profile?.first_name || "Konto"}</span>
          </button>
        ) : (
          <button className="login-button" onClick={() => navigate("login")}>
            <UserRound size={19} />
            <span>Login</span>
          </button>
        )}
      </header>

      {menu && (
        <div className="drawer-backdrop" onClick={() => setMenu(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <strong>SGM App</strong>
              <button className="icon-button" onClick={() => setMenu(false)}><X /></button>
            </div>
            <nav>
              <MenuItem icon={<Home />} label="Startseite" onClick={() => navigate("home")} />
              <MenuItem icon={<Trophy />} label="Spiele & Ergebnisse" onClick={() => navigate("matches")} />
              <MenuItem icon={<CalendarDays />} label="Veranstaltungen" onClick={() => navigate("events")} />
              <MenuItem icon={<Newspaper />} label="News" onClick={() => navigate("news")} />
              <MenuItem icon={<Bell />} label="Push-Mitteilungen" onClick={() => navigate("push")} />
              <MenuItem icon={<Shield />} label={session ? "Mein Mitgliederbereich" : "Mitgliederbereich"} onClick={() => navigate(session ? "member" : "login")} />
              {roles.includes("admin") && ( <MenuItem  icon={<Shield />}label="Administration" onClick={() => navigate("admin")}
                />
              )}
            </nav>
            {session && <button className="drawer-item" onClick={signOut}><LogOut /><span>Abmelden</span></button>}
          </aside>
        </div>
      )}

      <main>
        {page === "home" && <HomePage onNavigate={navigate} pushEnabled={pushEnabled} onPush={() => setPushEnabled(!pushEnabled)} />}
        {page === "matches" && <MatchesPage />}
        {page === "events" && <EventsPage />}
        {page === "news" && <NewsPage />}
        {page === "push" && <PushPage enabled={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />}
        {page === "login" && <LoginPage onSuccess={() => navigate("member")} />}
        {page === "member" && session && <MemberPage profile={profile} email={session.user.email} onSignOut={signOut} />}
        {page === "member" && !session && <LoginPage onSuccess={() => navigate("member")} />}
        {page === "admin" && session && roles.includes("admin") && (<AdminRolesPage /> )}
      </main>

      <footer>
        <span>SGM Deißlingen-Lauffen</span>
        <span>·</span>
        <span>PWA 0.2</span>
      </footer>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="drawer-item" onClick={onClick}>
      {icon}
      <span>{label}</span>
      <ChevronRight size={18} />
    </button>
  );
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function InstallAppBanner() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIos(ios);
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled || isStandalone) return;

    if (isIos) {
      setShowIosHelp((current) => !current);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }

    setShowIosHelp((current) => !current);
  };

  if (isInstalled || isStandalone) return null;

  return (
    <section className="push-banner install-banner">
      <div className="push-icon">
        <Download />
      </div>

      <div>
        <strong>SGM-App zum Home-Bildschirm hinzufügen</strong>
        <p>
          Installiere die App für einen schnellen Zugriff direkt vom Smartphone.
        </p>
      </div>

      <button className="button" onClick={installApp}>
        <Download size={17} />
        App hinzufügen
      </button>

      {showIosHelp && (
        <div className="install-help">
          <strong>So fügst du die SGM-App hinzu:</strong>
          {isIos ? (
            <ol>
              <li>Öffne diese Seite in Safari.</li>
              <li>Tippe auf das Teilen-Symbol.</li>
              <li>Wähle „Zum Home-Bildschirm“.</li>
              <li>Tippe auf „Hinzufügen“.</li>
            </ol>
          ) : (
            <p>
              Öffne das Browser-Menü und wähle „App installieren“ oder
              „Zum Startbildschirm hinzufügen“. Falls diese Option fehlt,
              unterstützt der aktuelle Browser den Installationsdialog
              möglicherweise nicht.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function HomePage({ onNavigate, pushEnabled, onPush }: { onNavigate: (p: string) => void; pushEnabled: boolean; onPush: () => void }) {
  const next = matches[0];
  return (
    <div className="content">
      <section className="hero">
        <div>
          <p className="eyebrow">Willkommen bei der</p>
          <h1>SGM Deißlingen-Lauffen</h1>
          <p>Spiele, Ergebnisse, Veranstaltungen und Vereinsinfos – alles an einem Ort.</p>
        </div>
        <img src="/logo.jpg" alt="" className="hero-logo" />
      </section>

      <section className="section-head">
        <div><p className="eyebrow">Nächstes Spiel</p><h2>{next.team}</h2></div>
        <button className="text-button" onClick={() => onNavigate("matches")}>Alle Spiele <ChevronRight size={17}/></button>
      </section>
      <div className="match-card featured">
        <div className="match-meta"><span>{next.competition}</span><span>{next.date}</span></div>
        <div className="teams"><strong>{next.home ? "SGM Deißlingen-Lauffen" : next.opponent}</strong><span>vs.</span><strong>{next.home ? next.opponent : "SGM Deißlingen-Lauffen"}</strong></div>
        <div className="match-info"><span><Clock3 size={17}/>{next.time} Uhr</span><span><MapPin size={17}/>{next.venue}</span></div>
      </div>

      <section className="section-head"><div><p className="eyebrow">Demnächst</p><h2>Veranstaltungen</h2></div><button className="text-button" onClick={() => onNavigate("events")}>Alle Termine <ChevronRight size={17}/></button></section>
      <div className="cards">
        {events.map((event) => <div className="event-card" key={event.title}><div className="date-badge"><CalendarDays size={19}/></div><div><strong>{event.title}</strong><span>{event.date}</span><span>{event.place}</span></div></div>)}
      </div>

      <InstallAppBanner />

<section className="push-banner">
  <div className="push-icon"><Bell /></div>
  <div>
    <strong>Keine wichtige Info verpassen</strong>
    <p>
      Abonniere Push-Mitteilungen für die aktiven Mannschaften und Vereinsnews.
    </p>
  </div>
  <button
    className={pushEnabled ? "button enabled" : "button"}
    onClick={onPush}
  >
    {pushEnabled ? "Aktiv ✓" : "Push aktivieren"}
  </button>
</section>

      <section className="section-head"><div><p className="eyebrow">Aktuell</p><h2>Neuigkeiten</h2></div><button className="text-button" onClick={() => onNavigate("news")}>Alle News <ChevronRight size={17}/></button></section>
      <article className="news-card"><span className="news-tag">Verein</span><h3>Die neue SGM-App kommt!</h3><p>Mit der neuen PWA sollen Spiele, Termine, News und Push-Mitteilungen künftig direkt auf dem Smartphone verfügbar sein.</p></article>
    </div>
  );
}

function MatchesPage() {
  return <div className="content"><PageTitle eyebrow="FUSSBALL.DE / DFBnet" title="Spiele & Ergebnisse" text="Diese Ansicht ist für die automatische Synchronisation mit den offiziellen Spieldaten vorbereitet."/><div className="team-tabs"><button className="active">Aktive</button><button>Jugend</button></div>{matches.map(m => <div className="match-card compact" key={m.id}><div className="match-meta"><span>{m.team} · {m.competition}</span><span>{m.date}</span></div><div className="compact-main"><div><strong>{m.home ? "SGM Deißlingen-Lauffen" : m.opponent}</strong><span className="muted"> {m.home ? "–" : "vs."} </span><strong>{m.home ? m.opponent : "SGM Deißlingen-Lauffen"}</strong></div><div className="time">{m.time}</div></div><div className="match-info"><span><MapPin size={16}/>{m.venue}</span></div></div>)}</div>;
}

function EventsPage() {
  return <div className="content"><PageTitle eyebrow="Verein" title="Veranstaltungen" text="Vereinsfeste, Jugendturniere, Versammlungen und weitere Termine."/><div className="event-list">{events.map(e => <div className="event-large" key={e.title}><div className="date-badge"><CalendarDays size={22}/></div><div><h3>{e.title}</h3><p>{e.date}</p><p className="muted">{e.place}</p></div></div>)}</div></div>;
}

function NewsPage() {
  return <div className="content"><PageTitle eyebrow="SGM News" title="Neuigkeiten" text="Öffentliche Informationen des Vereins."/><article className="news-card"><span className="news-tag">Verein</span><h3>Die neue SGM-App kommt!</h3><p>Diese erste Version ist ein Prototyp. Später kommen automatische Spieldaten, Mitgliederkonten, Mannschaftsbereiche und zielgerichtete Push-Mitteilungen hinzu.</p></article></div>;
}

function PushPage({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return <div className="content"><PageTitle eyebrow="Benachrichtigungen" title="Push-Mitteilungen" text="Wähle aus, welche Informationen du direkt auf dein Smartphone bekommen möchtest."/><div className="settings-card"><Toggle label="Vereinsnews" checked={enabled} onClick={onToggle}/><Toggle label="SGM I" checked={enabled} onClick={onToggle}/><Toggle label="SGM II" checked={enabled} onClick={onToggle}/><Toggle label="SGM III" checked={enabled} onClick={onToggle}/><div className="divider"/><p className="muted small">Die technische Web-Push-Anbindung wird in der nächsten Ausbaustufe aktiviert. Auf iPhone/iPad wird die PWA dafür zum Startbildschirm hinzugefügt.</p></div></div>;
}

function Toggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button className="toggle-row" onClick={onClick}><span>{label}</span><span className={checked ? "switch on" : "switch"}><span/></span></button>;
}


function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "new-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const queryType = url.searchParams.get("type");
    const hashType = hash.get("type");

    if (queryType === "recovery" || hashType === "recovery") {
      setMode("new-password");
      setMessage("Bitte lege dein neues Passwort fest.");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("new-password");
        setMessage("Bitte lege dein neues Passwort fest.");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setMessage("");

    if (!supabase) {
      setMessage("Supabase ist nicht konfiguriert.");
      return;
    }

    if (!email.trim() && (mode === "login" || mode === "signup" || mode === "reset")) {
      setMessage("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    if (mode !== "reset" && password.length < 8) {
      setMessage("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setMessage("Bitte gib deinen Namen ein.");
      return;
    }

    if (mode === "new-password" && password !== confirmPassword) {
      setMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        onSuccess();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;

        if (data.session) {
          onSuccess();
        } else {
          setMessage("Registrierung gestartet. Bitte prüfe deine E-Mails und bestätige dein Konto, falls erforderlich.");
        }
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin }
        );
        if (error) throw error;

        setMessage("Falls ein Konto mit dieser Adresse besteht, erhältst du eine E-Mail zum Zurücksetzen. Prüfe auch den Spam-Ordner.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        setPassword("");
        setConfirmPassword("");
        setMessage("Dein Passwort wurde erfolgreich gespeichert. Du kannst dich jetzt anmelden.");

        await supabase.auth.signOut();
        setMode("login");

        // Nach dem Speichern zurück zur normalen Loginseite.
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e: any) {
      setMessage(e?.message || "Die Aktion ist fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login" ? "Mitglieder-Login" :
    mode === "signup" ? "Konto erstellen" :
    mode === "reset" ? "Passwort vergessen?" :
    "Neues Passwort festlegen";

  return (
    <div className="content narrow">
      <PageTitle
        eyebrow="Geschützter Bereich"
        title={title}
        text="Deine persönlichen Zugangsdaten für die SGM-App."
      />

      <div className="login-card">
        {mode === "signup" && (
          <label>
            Name
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vor- und Nachname"
              autoComplete="name"
            />
          </label>
        )}

        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <label>
            E-Mail-Adresse
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
            />
          </label>
        )}

        {mode !== "reset" && (
          <label>
            {mode === "new-password" ? "Neues Passwort" : "Passwort"}
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
          </label>
        )}

        {mode === "new-password" && (
          <label>
            Neues Passwort wiederholen
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Passwort erneut eingeben"
            />
          </label>
        )}

        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}

        <button className="button full" onClick={submit} disabled={busy}>
          {busy
            ? "Bitte warten…"
            : mode === "login"
            ? "Anmelden"
            : mode === "signup"
            ? "Konto erstellen"
            : mode === "reset"
            ? "Wiederherstellungs-E-Mail senden"
            : "Neues Passwort speichern"}
        </button>

        {mode === "login" && (
          <button
            className="text-button centered"
            onClick={() => { setMode("reset"); setMessage(""); }}
          >
            Passwort vergessen?
          </button>
        )}

        {mode !== "login" && (
          <button
            className="text-button centered"
            onClick={() => {
              setMode("login");
              setPassword("");
              setConfirmPassword("");
              setMessage("");
            }}
          >
            Zurück zur Anmeldung
          </button>
        )}

        {mode === "login" && (
          <button
            className="text-button centered"
            onClick={() => { setMode("signup"); setMessage(""); }}
          >
            Noch kein Konto? Registrieren
          </button>
        )}

        <p className="muted small">
          Deine Passwörter werden sicher über Supabase Auth verwaltet.
        </p>
      </div>
    </div>
  );
}



function MemberPage({ profile, email, onSignOut }: { profile: any; email?: string; onSignOut: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    setMessage("");

    if (!supabase) {
      setMessage("Verbindung zu Supabase nicht verfügbar.");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setMessage("Passwort erfolgreich geändert.");
    } catch (e: any) {
      setMessage(e?.message || "Passwortänderung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content narrow">
      <PageTitle
        eyebrow="Mitgliederbereich"
        title={`Hallo ${profile?.first_name || profile?.display_name || "Mitglied"}!`}
        text="Dein persönlicher Bereich der SGM-App."
      />

      <div className="role-preview">
        <strong>Dein Konto</strong>
        <span>✉️ {email}</span>
        <span>
          👤 Rolle: {profile?.role === "admin"

function MemberPage({
  profile,
  email,
  roles,
  rolesLoading,
  onSignOut,
  onAdmin,
}: {
  profile: any;
  email?: string;
  roles: AppRole[];
  rolesLoading: boolean;
  onSignOut: () => void;
  onAdmin: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    setMessage("");

    if (!supabase) {
      setMessage("Verbindung zu Supabase nicht verfügbar.");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Die Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setMessage("Passwort erfolgreich geändert.");
    } catch (e: any) {
      setMessage(e?.message || "Passwortänderung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const memberType = profile?.member_type || "other";

  return (
    <div className="content narrow">
      <PageTitle
        eyebrow="Mitgliederbereich"
        title={`Hallo ${profile?.first_name || profile?.display_name || "Mitglied"}!`}
        text="Dein persönlicher Bereich der SGM-App."
      />

      <div className="role-preview">
        <strong>Dein Konto</strong>
        <span>✉️ {email || "Keine E-Mail-Adresse verfügbar"}</span>

        <strong>Systemrollen</strong>
        {rolesLoading ? (
          <span>Rollen werden geladen …</span>
        ) : roles.length ? (
          roles.map((role) => (
            <span key={role}>
              🛡️ {ROLE_LABELS[role] ?? role}
            </span>
          ))
        ) : (
          <span>Keine Systemrollen gefunden.</span>
        )}

        <strong>Mitgliedstyp</strong>
        <span>
          🏷️ {MEMBER_TYPE_LABELS[memberType] ?? "Sonstiges"}
        </span>
      </div>

      {roles.includes("admin") && (
        <div className="settings-card">
          <strong>Vereinsverwaltung</strong>
          <p className="muted small">
            Benutzerrollen vereinsweit verwalten.
          </p>
          <button className="button" onClick={onAdmin}>
            <Shield size={18} /> Administration öffnen
          </button>
        </div>
      )}

      <div className="settings-card password-card">
        <strong>Passwort ändern</strong>
        <p className="muted small">
          Dein Passwort wird über Supabase Auth geändert.
        </p>

        <label>
          Neues Passwort
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
          />
        </label>

        <label>
          Neues Passwort wiederholen
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort erneut eingeben"
          />
        </label>

        {message && <div className="notice" role="status">{message}</div>}

        <button
          className="button full"
          onClick={changePassword}
          disabled={busy}
        >
          {busy ? "Wird gespeichert …" : "Passwort speichern"}
        </button>
      </div>

      <div className="settings-card">
        <button className="button" onClick={onSignOut}>
          <LogOut size={18} /> Abmelden
        </button>
      </div>
    </div>
  );
}



function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>;
}

export default App;
