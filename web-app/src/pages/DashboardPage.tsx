import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@myorg/shared/hooks/useAuth";
import { useTeamMembers } from "@myorg/shared";
import {
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  oneOnOnesCollection,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from "@myorg/shared/api/firebase";
import { Users, MessageSquarePlus, PlusCircle, Trash2 } from "lucide-react";
import type { OneOnOneDoc } from "@myorg/shared/types";
import SessionHistory from "../components/SessionHistory";

const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <div
    style={{
      background: "white",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      marginBottom: "2rem",
    }}
  >
    <h2
      style={{
        fontSize: "1.125rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1rem",
        color: "#374151",
      }}
    >
      {icon}
      {title}
    </h2>
    {children}
  </div>
);

type SessionTabKey = "active" | "completed";

const SESSION_TABS: Array<{ key: SessionTabKey; label: string }> = [
  { key: "active", label: "\u9032\u884c\u4e2d" },
  { key: "completed", label: "\u5b8c\u4e86" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    teamMembers,
    isLoading: isLoadingMembers,
    error: membersError,
    requiresTeamSetup,
    profileExists,
  } = useTeamMembers();
  const [managedSessions, setManagedSessions] = useState<OneOnOneDoc[]>([]);
  const [invitedOneOnOnes, setInvitedOneOnOnes] = useState<OneOnOneDoc[]>([]);
  const [isLoadingOneOnOnes, setIsLoadingOneOnOnes] = useState(true);
  const [oneOnOneError, setOneOnOneError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<SessionTabKey>("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberNameInput, setMemberNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const managerDisplayName =
    user?.displayName && user.displayName.trim().length > 0 ? user.displayName : "Unknown User";

  useEffect(() => {
    if (!user) {
      setManagedSessions([]);
      setInvitedOneOnOnes([]);
      setIsLoadingOneOnOnes(false);
      return;
    }

    setIsLoadingOneOnOnes(true);
    setOneOnOneError(null);

    const managedQuery = query(
      oneOnOnesCollection,
      where("managerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribeManaged = onSnapshot(
      managedQuery,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as OneOnOneDoc));
        setManagedSessions(fetchedData);
        setIsLoadingOneOnOnes(false);
      },
      (error) => {
        console.error("Failed to load managed 1on1 records", error);
        setOneOnOneError("We could not load the 1on1 sessions you manage. Please try again or check permissions.");
        setManagedSessions([]);
        setIsLoadingOneOnOnes(false);
      }
    );

    const invitedQuery = query(
      oneOnOnesCollection,
      where("memberId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribeInvited = onSnapshot(
      invitedQuery,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as OneOnOneDoc));
        setInvitedOneOnOnes(fetchedData);
      },
      (error) => {
        console.error("Failed to load invited 1on1 records", error);
        setOneOnOneError("We could not load the 1on1 invitations for you. Please check permissions.");
        setInvitedOneOnOnes([]);
      }
    );

    return () => {
      unsubscribeManaged();
      unsubscribeInvited();
    };
  }, [user]);

  const activeSessions = useMemo(
    () =>
      managedSessions.filter((session) => {
        const status = session.status ?? "active";
        return status !== "completed";
      }),
    [managedSessions]
  );

  const completedSessions = useMemo(
    () => managedSessions.filter((session) => session.status === "completed"),
    [managedSessions]
  );

  useEffect(() => {
    if (selectedTab === "active" && activeSessions.length === 0 && completedSessions.length > 0) {
      setSelectedTab("completed");
    }
  }, [activeSessions.length, completedSessions.length, selectedTab]);

  const handleOpenAddModal = () => {
    setMemberNameInput("");
    setShowAddModal(true);
  };

  const handleAddOneOnOne = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMember = memberNameInput.trim();

    if (!trimmedMember) {
      alert("\u30e1\u30f3\u30d0\u30fc\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044");
      return;
    }

    if (!user) {
      alert("\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u518d\u5ea6\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u304f\u3060\u3055\u3044");
      return;
    }

    setIsSubmitting(true);
    try {
      const newOneOnOneRef = doc(oneOnOnesCollection);
      const createdAt = Timestamp.now();
      await setDoc(newOneOnOneRef, {
        sessionId: newOneOnOneRef.id,
        status: "active",
        managerId: user.uid,
        managerName: managerDisplayName,
        managerPhotoURL: user.photoURL ?? "",
        memberId: "",
        memberName: trimmedMember,
        createdAt,
        agenda: [],
        transcript: "",
        transcripts: [],
        summaryPoints: "",
        summaryNextActions: "",
        reflection: "",
        positiveMemo: "",
        mindmapText: "",
        mindmap: {
          nodes: [],
          links: [],
        },
        checkin: {
          mood: 75,
          focus: 80,
        },
      });
      setShowAddModal(false);
      setMemberNameInput("");
    } catch (error) {
      console.error("Failed to register one-on-one", error);
      alert("\u767b\u9332\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOneOnOne = async (id: string) => {
    try {
      await deleteDoc(doc(oneOnOnesCollection, id));
    } catch (error) {
      console.error("Failed to delete one-on-one", error);
      alert("\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    }
  };

  if (isLoadingMembers || isLoadingOneOnOnes) {
    return <div>Loading data...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Dashboard</h1>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{'1on1\u5bfe\u8c61\u7ba1\u7406'}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-medium text-slate-600">
              {SESSION_TABS.map((tab) => {
                const isActiveTab = selectedTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedTab(tab.key)}
                    className={`rounded-md px-3 py-1 transition ${
                      isActiveTab ? "bg-white text-slate-900 shadow" : "hover:bg-white/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {selectedTab === "active" && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <PlusCircle size={18} />
                {'\u8ffd\u52a0'}
              </button>
            )}
          </div>
        </div>
        {selectedTab === "active" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-200 px-4 py-2">{'\u30de\u30cd\u30fc\u30b8\u30e3\u30fc'}</th>
                  <th className="border border-slate-200 px-4 py-2">{'\u30e1\u30f3\u30d0\u30fc'}</th>
                  <th className="border border-slate-200 px-4 py-2">{'\u4f5c\u6210\u65e5'}</th>
                  <th className="border border-slate-200 px-4 py-2 text-center">{'\u524a\u9664'}</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.length === 0 ? (
                  <tr>
                    <td className="border border-slate-200 px-4 py-4 text-center text-slate-500" colSpan={4}>
                      {'\u73fe\u5728\u9032\u884c\u4e2d\u306e1on1\u306f\u3042\u308a\u307e\u305b\u3093'}
                    </td>
                  </tr>
                ) : (
                  activeSessions.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-2">{record.managerName}</td>
                      <td className="border border-slate-200 px-4 py-2">{record.memberName}</td>
                      <td className="border border-slate-200 px-4 py-2">
                        {record.createdAt ? record.createdAt.toDate().toLocaleString() : "-"}
                      </td>
                      <td className="border border-slate-200 px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteOneOnOne(record.id)}
                          className="rounded-full p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={'1on1\u3092\u524a\u9664'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <SessionHistory sessions={completedSessions} />
        )}
      </div>

      {oneOnOneError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #F87171",
            color: "#B91C1C",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {oneOnOneError}
        </div>
      )}

      {selectedTab === "active" && (
        <Section title="Start a 1on1 with your team" icon={<Users size={20} />}>
          {membersError ? (
            <p style={{ color: "red" }}>Failed to load team members: {membersError.message}</p>
          ) : requiresTeamSetup ? (
            <p>Please join a team using your invite code to start 1on1 sessions.</p>
          ) : !profileExists ? (
            <p>Your profile is being provisioned. Please refresh shortly.</p>
          ) : (
            (() => {
              const manualCards = activeSessions.map((record) => {
                const displayName =
                  record.memberName && record.memberName.trim().length > 0 ? record.memberName : "Unknown member";
                const createdLabel = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleString() : "";
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                return {
                  key: `session-${record.id}`,
                  name: displayName,
                  subtitle: createdLabel ? `\u65e2\u5b58\u30bb\u30c3\u30b7\u30e7\u30f3 (${createdLabel})` : "\u65e2\u5b58\u30bb\u30c3\u30b7\u30e7\u30f3",
                  action: "\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u958b\u304f",
                  link: `/1on1/${record.id}`,
                  avatar: avatarUrl,
                };
              });

              const manualMemberIds = new Set(
                activeSessions
                  .map((record) => record.memberId)
                  .filter((value): value is string => Boolean(value && value.trim().length > 0))
              );

              const teamCards = teamMembers
                .filter((member) => !manualMemberIds.has(member.uid))
                .map((member) => {
                  const displayName = member.displayName ?? "Unknown member";
                  const avatarUrl =
                    member.photoURL ??
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                  return {
                    key: `member-${member.uid}`,
                    name: displayName,
                    subtitle: "\u65b0\u30571on1\u3092\u958b\u59cb",
                    action: "\u30bb\u30c3\u30b7\u30e7\u30f3\u3092\u958b\u59cb",
                    link: `/1on1/new?memberId=${member.uid}&memberName=${encodeURIComponent(displayName)}`,
                    avatar: avatarUrl,
                  };
                });

              const startCards = [...manualCards, ...teamCards];

              if (startCards.length === 0) {
                return <p>{'\u307e\u30601on1\u5bfe\u8c61\u304c\u3042\u308a\u307e\u305b\u3093'}</p>;
              }

              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                  {startCards.map((card) => (
                    <Link key={card.key} to={card.link} style={{ textDecoration: "none", color: "inherit" }}>
                      <div
                        style={{
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          border: "1px solid transparent",
                          transition: "all 0.2s",
                          cursor: "pointer",
                          minWidth: "140px",
                        }}
                        onMouseOver={(event) => {
                          event.currentTarget.style.borderColor = "#ddd";
                        }}
                        onMouseOut={(event) => {
                          event.currentTarget.style.borderColor = "transparent";
                        }}
                      >
                        <img
                          src={card.avatar}
                          alt={card.name}
                          style={{ width: "64px", height: "64px", borderRadius: "50%" }}
                        />
                        <p style={{ margin: 0, fontSize: "0.9rem", maxWidth: "140px", wordBreak: "break-word" }}>{card.name}</p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{card.subtitle}</p>
                        <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>{card.action}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()
          )}
        </Section>
      )}

      {invitedOneOnOnes.length > 0 && (
        <Section title="1on1 invitations for you" icon={<MessageSquarePlus size={20} color="#f59e0b" />}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {invitedOneOnOnes.map((oneOnOne) => (
              <Link
                key={oneOnOne.id}
                to={`/1on1/${oneOnOne.id}`}
                style={{
                  display: "block",
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <p style={{ margin: 0, fontWeight: 500 }}>{oneOnOne.managerName} invited you to a 1on1</p>
                <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                  Created: {oneOnOne.createdAt.toDate().toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{'1on1\u3092\u8ffd\u52a0'}</h2>
            <form onSubmit={handleAddOneOnOne} className="space-y-4">
              <div>
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {`\u30de\u30cd\u30fc\u30b8\u30e3\u30fc\uff1a${managerDisplayName}`}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{'\u30e1\u30f3\u30d0\u30fc\u540d'}</label>
                <input
                  type="text"
                  value={memberNameInput}
                  onChange={(event) => setMemberNameInput(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Hanako Sato"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                  disabled={isSubmitting}
                >
                  {'\u30ad\u30e3\u30f3\u30bb\u30eb'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "\u767b\u9332\u4e2d..." : "\u767b\u9332"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
