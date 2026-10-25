import {
  Bell, CalendarDays, ChevronRight, Clock3, Download, Home, LogIn,
  LogOut, MapPin, Menu, Newspaper, Shield, Trophy, UserRound, Users, X
} from "lucide-react";

import { useEffect, useState } from "react";

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

    useEffect(() => {
    if (!session?.user?.id) {
      setRoles([]);
      return;
    }

    void loadRoles(session.user.id);
  }, [session?.user?.id]);

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
             <MenuItem
  icon={<Shield />}
  label={session ? "Mein Mitgliederbereich" : "Mitgliederbereich"}
  onClick={() => navigate(session ? "member" : "login")}
/>

{session && roles.includes("trainer") && (
  <MenuItem
    icon={<Users />}
    label="Trainerbereich"
    onClick={() => navigate("trainer")}
  />
)}

{session && roles.includes("admin") && (
  <>
    <MenuItem
      icon={<Shield />}
      label="Administration"
      onClick={() => navigate("admin")}
    />
    <MenuItem
      icon={<Users />}
      label="Mannschaftsverwaltung"
      onClick={() => navigate("admin-teams")}
    />
  </>
)}
            </nav>
            {session && <button className="drawer-item" onClick={signOut}><LogOut /><span>Abmelden</span></button>}
          </aside>
        </div>
      )}

      <main>
        {page === "home" && <HomePage onNavigate={navigate} pushEnabled={pushEnabled} onPush={() => setPushEnabled(!pushEnabled)} />}
        {page === "matches" && <MatchesPage />}
{page === "trainer" && session && roles.includes("trainer") && (
  <TrainerPage userId={session.user.id} />
)}

        {page === "events" && <EventsPage />}
        {page === "news" && <NewsPage />}
        {page === "push" && <PushPage enabled={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />}
        {page === "login" && <LoginPage onSuccess={() => navigate("member")} />}
        {page === "member" && session && (
  <MemberPage
    profile={profile}
    email={session.user.email}
    roles={roles}
    rolesLoading={rolesLoading}
    onSignOut={signOut}
    onAdmin={() => navigate("admin")}
  />
)}
        {page === "admin" && session && roles.includes("admin") && (
  <AdminRolesPage />
)}
        {page === "admin-teams" && session && roles.includes("admin") && (
  <AdminTeamsPage />
)}
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
  type TrainerTeam = {
  id: string;
  name: string;
  sort_order: number;
};

type TrainerMatch = {
  id: string;
  team_id: string;
  opponent: string;
  venue: string | null;
  kickoff_at: string | null;
  is_home: boolean;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_score: number | null;
  away_score: number | null;
};

type TrainerEvent = {
  id: string;
  team_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  is_public: boolean;
};

type TrainerNews = {
  id: string;
  team_id: string | null;
  title: string;
  body: string;
  is_public: boolean;
  published_at: string | null;
};

type TrainerTab = "matches" | "events" | "news";


function TrainerPage({ userId }: { userId: string }) {
  const [teams, setTeams] = useState<TrainerTeam[]>([]);
  const [teamId, setTeamId] = useState("");
  const [tab, setTab] = useState<TrainerTab>("matches");
  const [matchesData, setMatchesData] = useState<TrainerMatch[]>([]);
  const [eventsData, setEventsData] = useState<TrainerEvent[]>([]);
  const [newsData, setNewsData] = useState<TrainerNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [isHome, setIsHome] = useState(true);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPublic, setEventPublic] = useState(true);

  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsPublic, setNewsPublic] = useState(true);

  if (!supabase) {
    return (
      <section className="content-card">
        <h2>Verbindung nicht verfügbar</h2>
        <p>
          Die Datenbankverbindung konnte nicht hergestellt werden.
          Bitte lade die Seite erneut.
        </p>
      </section>
    );
  }


  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [isHome, setIsHome] = useState(true);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPublic, setEventPublic] = useState(true);

  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsPublic, setNewsPublic] = useState(true);

  async function loadTeams() {
    if (!supabase) return;

    const { data: assignments, error: assignmentError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("profile_id", userId)
      .eq("is_trainer", true);

    if (assignmentError) throw assignmentError;

    const ids = [...new Set((assignments ?? []).map((row) => row.team_id))];

    if (ids.length === 0) {
      setTeams([]);
      setTeamId("");
      return;
    }

    const { data, error } = await supabase
      .from("teams")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .in("id", ids)
      .order("sort_order");

    if (error) throw error;

    const loaded = (data ?? []) as TrainerTeam[];
    setTeams(loaded);
    setTeamId((current) =>
      loaded.some((team) => team.id === current)
        ? current
        : loaded[0]?.id ?? ""
    );
  }

  async function loadContent(selectedTeamId = teamId) {
    if (!supabase || !selectedTeamId) {
      setMatchesData([]);
      setEventsData([]);
      setNewsData([]);
      return;
    }

    const [matchResult, eventResult, newsResult] = await Promise.all([
      supabase
        .from("matches")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("kickoff_at", { ascending: true }),

      supabase
        .from("events")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("starts_at", { ascending: true }),

      supabase
        .from("news")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false }),
    ]);

    if (matchResult.error) throw matchResult.error;
    if (eventResult.error) throw eventResult.error;
    if (newsResult.error) throw newsResult.error;

    setMatchesData((matchResult.data ?? []) as TrainerMatch[]);
    setEventsData((eventResult.data ?? []) as TrainerEvent[]);
    setNewsData((newsResult.data ?? []) as TrainerNews[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setMessage("");

      try {
        await loadTeams();
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Mannschaften konnten nicht geladen werden."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;

    async function refresh() {
      setLoading(true);
      setMessage("");

      try {
        await loadContent(teamId);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Die Daten konnten nicht geladen werden."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function runSave(action: () => Promise<void>) {
    setSaving(true);
    setMessage("");

    try {
      await action();
      await loadContent(teamId);
      setMessage("Änderung erfolgreich gespeichert.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Aktion ist fehlgeschlagen."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !teamId || !opponent.trim()) return;

    await runSave(async () => {
      const { error } = await supabase.from("matches").insert({
        team_id: teamId,
        opponent: opponent.trim(),
        venue: venue.trim() || null,
        kickoff_at: kickoff ? new Date(kickoff).toISOString() : null,
        is_home: isHome,
        status: "scheduled",
      });

      if (error) throw error;

      setOpponent("");
      setVenue("");
      setKickoff("");
      setIsHome(true);
    });
  }

  async function updateMatch(
    matchId: string,
    updates: Partial<TrainerMatch>
  ) {
    if (!supabase) return;

    await runSave(async () => {
      const { error } = await supabase
        .from("matches")
        .update(updates)
        .eq("id", matchId)
        .eq("team_id", teamId);

      if (error) throw error;
    });
  }

  async function addEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !teamId || !eventTitle.trim() || !eventDate) return;

    await runSave(async () => {
      const { error } = await supabase.from("events").insert({
        team_id: teamId,
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        starts_at: new Date(eventDate).toISOString(),
        location: eventLocation.trim() || null,
        is_public: eventPublic,
        created_by: userId,
      });

      if (error) throw error;

      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventLocation("");
      setEventPublic(true);
    });
  }

  async function addNews(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !teamId || !newsTitle.trim() || !newsBody.trim()) return;

    await runSave(async () => {
      const { error } = await supabase.from("news").insert({
        team_id: teamId,
        title: newsTitle.trim(),
        body: newsBody.trim(),
        is_public: newsPublic,
        published_at: newsPublic ? new Date().toISOString() : null,
        created_by: userId,
      });

      if (error) throw error;

      setNewsTitle("");
      setNewsBody("");
      setNewsPublic(true);
    });
  }

  async function deleteRow(
    table: "matches" | "events" | "news",
    id: string
  ) {
    if (!supabase) return;
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;

    await runSave(async () => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("team_id", teamId);

      if (error) throw error;
    });
  }

  const dateLabel = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Noch kein Termin";

  return (
    <div className="content">
      <PageTitle
        eyebrow="Mannschaft"
        title="Trainerbereich"
        text="Verwalte Spiele, Veranstaltungen und News deiner Mannschaft."
      />

      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}

      {loading && <p>Daten werden geladen …</p>}

      {!loading && teams.length === 0 && (
        <section className="settings-card">
          <h2>Keine Mannschaft zugewiesen</h2>
          <p>
            Ein Administrator muss dir in der Mannschaftsverwaltung eine
            aktive Mannschaft zuweisen und die Trainerfunktion aktivieren.
          </p>
        </section>
      )}

      {teams.length > 0 && (
        <>
          <section className="settings-card">
            <label htmlFor="trainer-team">Meine Mannschaft</label>
            <select
              id="trainer-team"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </section>

          <div className="team-tabs">
            <button
              className={tab === "matches" ? "active" : ""}
              onClick={() => setTab("matches")}
            >
              Spiele
            </button>
            <button
              className={tab === "events" ? "active" : ""}
              onClick={() => setTab("events")}
            >
              Veranstaltungen
            </button>
            <button
              className={tab === "news" ? "active" : ""}
              onClick={() => setTab("news")}
            >
              News
            </button>
          </div>

          {tab === "matches" && (
            <>
              <section className="settings-card">
                <h2>Spiel hinzufügen</h2>
                <form onSubmit={addMatch} className="trainer-form">
                  <label htmlFor="match-opponent">Gegner *</label>
                  <input
                    id="match-opponent"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    required
                  />

                  <label htmlFor="match-kickoff">Datum und Uhrzeit</label>
                  <input
                    id="match-kickoff"
                    type="datetime-local"
                    value={kickoff}
                    onChange={(e) => setKickoff(e.target.value)}
                  />

                  <label htmlFor="match-venue">Spielort</label>
                  <input
                    id="match-venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={isHome}
                      onChange={(e) => setIsHome(e.target.checked)}
                    />{" "}
                    Heimspiel
                  </label>

                  <button className="button" disabled={saving} type="submit">
                    Spiel speichern
                  </button>
                </form>
              </section>

              <h2>Spiele verwalten</h2>
              {matchesData.length === 0 && <p>Noch keine Spiele vorhanden.</p>}

              {matchesData.map((match) => (
                <section className="settings-card" key={match.id}>
                  <h3>{match.opponent}</h3>
                  <p>{dateLabel(match.kickoff_at)}</p>
                  <p>{match.venue || "Kein Spielort angegeben"}</p>
                  <p>{match.is_home ? "Heimspiel" : "Auswärtsspiel"}</p>

                  <label htmlFor={`status-${match.id}`}>Spielstatus</label>
                  <select
                    id={`status-${match.id}`}
                    value={match.status}
                    onChange={(e) =>
                      void updateMatch(match.id, {
                        status: e.target.value as TrainerMatch["status"],
                      })
                    }
                  >
                    <option value="scheduled">Geplant</option>
                    <option value="live">Live</option>
                    <option value="finished">Beendet</option>
                    <option value="postponed">Verschoben</option>
                    <option value="cancelled">Abgesagt</option>
                  </select>

                  <div className="trainer-score">
                    <label>
                      SGM
                      <input
                        type="number"
                        min="0"
                        value={match.home_score ?? ""}
                        onChange={(e) =>
                          setMatchesData((old) =>
                            old.map((item) =>
                              item.id === match.id
                                ? {
                                    ...item,
                                    home_score:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                    <label>
                      Gegner
                      <input
                        type="number"
                        min="0"
                        value={match.away_score ?? ""}
                        onChange={(e) =>
                          setMatchesData((old) =>
                            old.map((item) =>
                              item.id === match.id
                                ? {
                                    ...item,
                                    away_score:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                    </label>
                    <button
                      className="button"
                      disabled={saving}
                      onClick={() =>
                        void updateMatch(match.id, {
                          home_score: match.home_score,
                          away_score: match.away_score,
                        })
                      }
                    >
                      Ergebnis speichern
                    </button>
                  </div>

                  <button
                    className="text-button"
                    disabled={saving}
                    onClick={() => void deleteRow("matches", match.id)}
                  >
                    Spiel löschen
                  </button>
                </section>
              ))}
            </>
          )}

          {tab === "events" && (
            <>
              <section className="settings-card">
                <h2>Veranstaltung erstellen</h2>
                <form onSubmit={addEvent} className="trainer-form">
                  <label htmlFor="event-title">Titel *</label>
                  <input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />

                  <label htmlFor="event-date">Datum und Uhrzeit *</label>
                  <input
                    id="event-date"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />

                  <label htmlFor="event-location">Ort</label>
                  <input
                    id="event-location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                  />

                  <label htmlFor="event-description">Beschreibung</label>
                  <textarea
                    id="event-description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={4}
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={eventPublic}
                      onChange={(e) => setEventPublic(e.target.checked)}
                    />{" "}
                    Öffentlich anzeigen
                  </label>

                  <button className="button" disabled={saving} type="submit">
                    Veranstaltung speichern
                  </button>
                </form>
              </section>

              <h2>Veranstaltungen verwalten</h2>
              {eventsData.map((event) => (
                <section className="settings-card" key={event.id}>
                  <h3>{event.title}</h3>
                  <p>{dateLabel(event.starts_at)}</p>
                  <p>{event.location || "Kein Ort angegeben"}</p>
                  <p>{event.is_public ? "Öffentlich" : "Nicht öffentlich"}</p>
                  <button
                    className="text-button"
                    disabled={saving}
                    onClick={() => void deleteRow("events", event.id)}
                  >
                    Veranstaltung löschen
                  </button>
                </section>
              ))}
              {eventsData.length === 0 && <p>Noch keine Veranstaltungen vorhanden.</p>}
            </>
          )}

          {tab === "news" && (
            <>
              <section className="settings-card">
                <h2>News erstellen</h2>
                <form onSubmit={addNews} className="trainer-form">
                  <label htmlFor="news-title">Überschrift *</label>
                  <input
                    id="news-title"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    required
                  />

                  <label htmlFor="news-body">Text *</label>
                  <textarea
                    id="news-body"
                    value={newsBody}
                    onChange={(e) => setNewsBody(e.target.value)}
                    rows={6}
                    required
                  />

                  <label>
                    <input
                      type="checkbox"
                      checked={newsPublic}
                      onChange={(e) => setNewsPublic(e.target.checked)}
                    />{" "}
                    Öffentlich veröffentlichen
                  </label>

                  <button className="button" disabled={saving} type="submit">
                    News speichern
                  </button>
                </form>
              </section>

              <h2>News verwalten</h2>
              {newsData.map((news) => (
                <section className="settings-card" key={news.id}>
                  <h3>{news.title}</h3>
                  <p>{news.body}</p>
                  <p>{news.is_public ? "Öffentlich" : "Nicht öffentlich"}</p>
                  <button
                    className="text-button"
                    disabled={saving}
                    onClick={() => void deleteRow("news", news.id)}
                  >
                    News löschen
                  </button>
                </section>
              ))}
              {newsData.length === 0 && <p>Noch keine News vorhanden.</p>}
            </>
          )}
        </>
      )}
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

function AdminRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<
    Record<string, AppRole[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, first_name, last_name, member_type")
      .order("display_name");

    if (profilesError) {
      setMessage(`Benutzer konnten nicht geladen werden: ${profilesError.message}`);
      setLoading(false);
      return;
    }

    const { data: assignments, error: rolesError } = await supabase
      .from("user_roles")
      .select("profile_id, role");

    if (rolesError) {
      setMessage(`Rollen konnten nicht geladen werden: ${rolesError.message}`);
      setLoading(false);
      return;
    }

    const grouped: Record<string, AppRole[]> = {};

    for (const assignment of assignments ?? []) {
      const role = assignment.role as AppRole;
      grouped[assignment.profile_id] ??= [];
      grouped[assignment.profile_id].push(role);
    }

    setUsers(profiles ?? []);
    setUserRoles(grouped);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const changeRole = async (
    profileId: string,
    role: AppRole,
    add: boolean
  ) => {
    if (!supabase) return;

    const currentRoles = userRoles[profileId] ?? [];

    if (!add && currentRoles.length <= 1) {
      setMessage("Jedem Konto muss mindestens eine Systemrolle zugeordnet bleiben.");
      return;
    }

    setBusyUser(profileId);
    setMessage("");

    const result = add
      ? await supabase
          .from("user_roles")
          .insert({ profile_id: profileId, role })
      : await supabase
          .from("user_roles")
          .delete()
          .eq("profile_id", profileId)
          .eq("role", role);

    if (result.error) {
      setMessage(`Änderung fehlgeschlagen: ${result.error.message}`);
    } else {
      await loadUsers();
      setMessage("Rollen wurden aktualisiert.");
    }

    setBusyUser(null);
  };

  return (
    <div className="content">
      <PageTitle
        eyebrow="Nur Administratoren"
        title="Benutzer & Rollen"
        text="Vergib Systemrollen für die Vereinsverwaltung. Ein Benutzer kann mehrere Rollen besitzen."
      />

      {message && <div className="notice" role="status">{message}</div>}

      {loading ? (
        <p>Benutzer werden geladen …</p>
      ) : users.length === 0 ? (
        <p>Keine Benutzer gefunden.</p>
      ) : (
        <div className="event-list">
          {users.map((user) => {
            const assigned = userRoles[user.id] ?? [];
            const displayName =
              [user.first_name, user.last_name].filter(Boolean).join(" ") ||
              user.display_name ||
              "Unbenannter Benutzer";

            return (
              <section className="settings-card" key={user.id}>
                <strong>{displayName}</strong>
                <p className="muted small">
                  Mitgliedstyp:{" "}
                  {MEMBER_TYPE_LABELS[user.member_type] ??
                    MEMBER_TYPE_LABELS.other}
                </p>

                {(["admin", "trainer", "member"] as AppRole[]).map((role) => {
                  const checked = assigned.includes(role);

                  return (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        margin: "10px 0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busyUser === user.id}
                        onChange={(event) =>
                          void changeRole(
                            user.id,
                            role,
                            event.target.checked
                          )
                        }
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}


function AdminTeamsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [trainerIds, setTrainerIds] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    if (!supabase) {
      setLoading(false);
      setMessage("Supabase ist nicht verfügbar.");
      return;
    }

    setLoading(true);
    setMessage("");

    const [profilesResult, rolesResult, teamsResult, membersResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, first_name, last_name")
          .order("display_name"),
        supabase.from("user_roles").select("profile_id, role"),
        supabase
          .from("teams")
          .select("id, name, sort_order")
          .eq("is_active", true)
          .in("sort_order", [1, 2, 3])
          .order("sort_order"),
        supabase
          .from("team_members")
          .select("team_id, profile_id, is_trainer"),
      ]);

    const error =
      profilesResult.error ||
      rolesResult.error ||
      teamsResult.error ||
      membersResult.error;

    if (error) {
      setMessage(`Daten konnten nicht geladen werden: ${error.message}`);
      setLoading(false);
      return;
    }

    setUsers(profilesResult.data ?? []);
    setTrainerIds(
      (rolesResult.data ?? [])
        .filter((item) => item.role === "trainer")
        .map((item) => item.profile_id)
    );
    setTeams(teamsResult.data ?? []);

    const grouped: Record<string, string[]> = {};
    for (const item of membersResult.data ?? []) {
      if (!item.is_trainer) continue;
      grouped[item.profile_id] ??= [];
      grouped[item.profile_id].push(item.team_id);
    }

    setAssignments(grouped);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const toggleTeam = async (
    profileId: string,
    teamId: string,
    add: boolean
  ) => {
    if (!supabase) return;

    if (add && !trainerIds.includes(profileId)) {
      setMessage(
        "Weise dem Benutzer zuerst unter Administration die Systemrolle Trainer zu."
      );
      return;
    }

    const key = `${profileId}:${teamId}`;
    setBusyKey(key);
    setMessage("");

    const result = add
      ? await supabase.from("team_members").upsert(
          {
            profile_id: profileId,
            team_id: teamId,
            is_trainer: true,
          },
          { onConflict: "team_id,profile_id" }
        )
      : await supabase
          .from("team_members")
          .delete()
          .eq("profile_id", profileId)
          .eq("team_id", teamId)
          .eq("is_trainer", true);

    if (result.error) {
      setMessage(`Änderung fehlgeschlagen: ${result.error.message}`);
    } else {
      setAssignments((current) => {
        const next = { ...current };
        const selected = new Set(next[profileId] ?? []);

        if (add) selected.add(teamId);
        else selected.delete(teamId);

        next[profileId] = Array.from(selected);
        return next;
      });

      setMessage(
        add
          ? "Trainer-Zuordnung gespeichert."
          : "Trainer-Zuordnung entfernt."
      );
    }

    setBusyKey(null);
  };

  return (
    <div className="content">
      <PageTitle
        eyebrow="Nur Administratoren"
        title="Mannschaftsverwaltung"
        text="Ordne Trainer den drei Herrenmannschaften zu. Die Jugendmannschaften bleiben vorerst außen vor."
      />

      <div className="settings-card">
        <strong>Hinweis</strong>
        <p className="muted small">
          Ein Trainer benötigt die Systemrolle Trainer und eine Zuordnung zur
          jeweiligen Mannschaft. Mehrere Zuordnungen pro Trainer sind möglich.
        </p>
      </div>

      {message && <div className="notice" role="status">{message}</div>}

      {loading ? (
        <p>Benutzer und Mannschaften werden geladen …</p>
      ) : teams.length === 0 ? (
        <p>Keine aktiven Mannschaften mit Sortierung 1–3 gefunden.</p>
      ) : (
        <div className="event-list">
          {users.map((user) => {
            const name =
              [user.first_name, user.last_name].filter(Boolean).join(" ") ||
              user.display_name ||
              "Unbenannter Benutzer";

            const isTrainer = trainerIds.includes(user.id);

            return (
              <section className="settings-card" key={user.id}>
                <strong>{name}</strong>

                {!isTrainer && (
                  <p className="muted small">
                    Noch keine Systemrolle Trainer. Diese muss zuerst unter
                    Administration vergeben werden.
                  </p>
                )}

                {teams.map((team) => {
                  const checked = (assignments[user.id] ?? []).includes(
                    team.id
                  );
                  const key = `${user.id}:${team.id}`;

                  const label =
                    team.sort_order === 1
                      ? "SGM I"
                      : team.sort_order === 2
                        ? "SGM II"
                        : "SGM III";

                  return (
                    <label
                      key={team.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        margin: "12px 0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={
                          (!isTrainer && !checked) || busyKey === key
                        }
                        onChange={(event) =>
                          void toggleTeam(
                            user.id,
                            team.id,
                            event.target.checked
                          )
                        }
                      />
                      <span>
                        {label}{" "}
                        <span className="muted small">({team.name})</span>
                      </span>
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>;
}

export default App;
