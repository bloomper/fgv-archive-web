// A stand-in for Spexarkivet Server and Keycloak in E2E tests: GraphQL for reading, editing, share links and
// administration, the file, preview and zip endpoints (with byte ranges), the share link endpoints, tus uploads, and a
// mini-Keycloak (discovery, authorize, token, JWKS, userinfo, logout). All data is fictitious.

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const PORT = Number(process.env.MOCK_PORT || 4105);
const ISSUER = `http://localhost:${PORT}/realms/fgv`;
const CLIENT_ID = "fgv-archive";
const KID = "e2e-key";
const TOKEN_TTL = 3600;

const PERSONAS = {
  admin: { sub: "p-admin", name: "Sara Admin", email: "sara.admin@example.org", roles: ["USER", "EDITOR", "ADMIN"] },
  editor: { sub: "p-editor", name: "Erik Redaktör", email: "erik@example.org", roles: ["USER", "EDITOR"] },
  user: { sub: "p-user", name: "Ulla Användare", email: "ulla@example.org", roles: ["USER"] },
  noaccess: { sub: "p-noaccess", name: "Nils Nekad", email: "nils@example.org", roles: [] },
};
const bySub = Object.fromEntries(Object.values(PERSONAS).map(persona => [persona.sub, persona]));
let currentPersona = "admin";

/** The UUID the server would give the entity numbered n here. */
const uuidOf = n => `00000000-0000-7000-8000-${String(n).padStart(12, "0")}`;

class GraphQLError extends Error {
  constructor(classification, message) {
    super(message);
    this.classification = classification;
  }
}

const forbidden = () => new GraphQLError("FORBIDDEN", "Du har inte behörighet att göra det.");
const notFound = () => new GraphQLError("NOT_FOUND", "Det finns inte.");
const isEditor = persona => Boolean(persona?.roles.includes("EDITOR") || persona?.roles.includes("ADMIN"));
const isAdmin = persona => Boolean(persona?.roles.includes("ADMIN"));

// --- A small PDF, made here: pages with "Sida n" and some searchable text -------------------------------------------

function makePdf(title, pages) {
  const objects = [];
  const add = body => objects.push(body) && objects.length;
  const catalog = add("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesIndex = add("");
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const kids = [];

  for (let page = 1; page <= pages; page++) {
    const text = `BT /F1 24 Tf 72 720 Td (${title}) Tj ET BT /F1 18 Tf 72 680 Td (Sida ${page}) Tj ET` +
      (page === 2 ? " BT /F1 12 Tf 72 640 Td (Kungen tar sin kungamantel och sjunger) Tj ET" : "");
    const content = add(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);

    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${content} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`));
  }
  objects[pagesIndex - 1] = `<< /Type /Pages /Kids [${kids.map(kid => `${kid} 0 R`).join(" ")}] /Count ${pages} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xref = Buffer.byteLength(pdf, "latin1");

  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

// A 1×1 PNG, for previews
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

// --- Data -------------------------------------------------------------------------------------------------------------

const CATEGORY = { id: uuidOf(1), name: "Chalmersspexet" };
const ALI_BABA = { id: uuidOf(11), title: "Ali Baba", year: 1985, revival: false, parentId: null };
const ALI_BABA_2028 = { id: uuidOf(12), title: "Ali Baba", year: 2028, revival: true, parentId: uuidOf(11) };
const NOBEL = { id: uuidOf(13), title: "Nobel", year: 1975, revival: false, parentId: null };
const SPEX = [ALI_BABA_2028, ALI_BABA, NOBEL].map(spex => ({ ...spex, categoryId: CATEGORY.id, categoryName: CATEGORY.name }));

const T = (pitch, octave = 0) => ({ pitch, octave });
const INSTRUMENTS = [
  { id: uuidOf(201), nameSv: "Flöjt", nameEn: "Flute", group: "WOODWIND", abbreviations: ["fl"], defaultTransposition: T("C") },
  { id: uuidOf(202), nameSv: "Piccolaflöjt", nameEn: "Piccolo", group: "WOODWIND", abbreviations: ["picc"], defaultTransposition: T("C", 1) },
  { id: uuidOf(203), nameSv: "Altsaxofon", nameEn: "Alto saxophone", group: "WOODWIND", abbreviations: ["altsax"], defaultTransposition: T("E_FLAT") },
  { id: uuidOf(204), nameSv: "Tenorsaxofon", nameEn: "Tenor saxophone", group: "WOODWIND", abbreviations: ["tenorsax"], defaultTransposition: T("B_FLAT", -1) },
  { id: uuidOf(205), nameSv: "Trumpet", nameEn: "Trumpet", group: "BRASS", abbreviations: ["tpt"], defaultTransposition: T("B_FLAT") },
  { id: uuidOf(206), nameSv: "Trombon", nameEn: "Trombone", group: "BRASS", abbreviations: ["tbn"], defaultTransposition: T("C") },
  { id: uuidOf(207), nameSv: "Valthorn", nameEn: "Horn", group: "BRASS", abbreviations: ["horn"], defaultTransposition: T("F") },
  { id: uuidOf(208), nameSv: "Piano", nameEn: "Piano", group: "RHYTHM", abbreviations: ["pno"], defaultTransposition: T("C") },
  { id: uuidOf(209), nameSv: "Sång", nameEn: "Voice", group: "VOICES", abbreviations: ["sång"], defaultTransposition: T("C") },
];
const [FLUTE, PICCOLO, ALTO, TENOR, TRUMPET, TROMBONE, , PIANO] = INSTRUMENTS.map(instrument => instrument.id);
const ROLES = [
  ["Manus", "Manuscript"], ["Partitur", "Score"], ["Stämma", "Part"], ["Källfil", "Source"], ["Referensljud", "Reference audio"],
  ["Skanning", "Scan"], ["Övrigt", "Other"],
].map(([nameSv, nameEn], index) => ({ id: uuidOf(301 + index), nameSv, nameEn }));
const [MANUSCRIPT_ROLE, SCORE_ROLE, PART_ROLE, SOURCE_ROLE] = ROLES.map(role => role.id);

let state;

function file(id, versionId, title, extra = {}) {
  return {
    id: uuidOf(id), versionId, title, comment: null, name: `${title}.pdf`, extension: "pdf", contentType: "application/pdf",
    size: 1200, checksum: "0".repeat(64), pages: 3, roleId: PART_ROLE, instrumentIds: [], desk: null, transposition: null,
    processing: "DONE", hasPreview: true, hasText: true, downloadCount: 0, createdAt: "2026-10-01T10:00:00Z", ...extra,
  };
}

function version(id, kind, parentId, label, extra = {}) {
  return {
    id: uuidOf(id), kind, parentId, label, usedInSpexId: null, date: null, notes: null, arranger: null, key: null,
    modulations: [], tempo: null, duration: null, instrumentation: [], recommended: false, restricted: false, published: true,
    publishedAt: "2026-10-01T10:00:00Z", trashedAt: null, createdAt: "2026-10-01T10:00:00Z", lastModifiedAt: null, ...extra,
  };
}

function resetState() {
  const mv1 = uuidOf(501);
  const av1 = uuidOf(511);
  const av2 = uuidOf(512);
  const av3 = uuidOf(521);

  state = {
    nextId: 1000,
    instruments: INSTRUMENTS.map((instrument, index) => ({ ...instrument, position: index + 1 })),
    roles: ROLES.map((role, index) => ({ ...role, position: index + 1 })),
    numbers: [
      { id: uuidOf(101), spexId: ALI_BABA.id, position: 1, title: "Ouvertyr", originalSong: null, lyricist: null, composer: "Kalle Kompositör" },
      { id: uuidOf(102), spexId: ALI_BABA.id, position: 2, title: "Kärleksduetten", originalSong: "Yesterday (The Beatles)", lyricist: "Lotta Lyriker", composer: null },
      { id: uuidOf(103), spexId: ALI_BABA.id, position: 3, title: "Finalen", originalSong: null, lyricist: null, composer: null },
    ],
    manuscripts: [
      { id: uuidOf(401), spexId: ALI_BABA.id, title: "Ali Baba", authors: "Anna Författare, Bo Skribent", description: "Rövarna och kungen.", trashedAt: null, createdAt: "2026-10-01T10:00:00Z" },
    ],
    arrangements: [
      { id: uuidOf(411), numberId: uuidOf(101), description: null, trashedAt: null, createdAt: "2026-10-01T10:00:00Z" },
      { id: uuidOf(412), numberId: uuidOf(102), description: "Duetten med bandet.", trashedAt: null, createdAt: "2026-10-01T10:00:00Z" },
    ],
    versions: [
      version(501, "MANUSCRIPT", uuidOf(401), "Original 1985", { usedInSpexId: ALI_BABA.id, recommended: true }),
      version(502, "MANUSCRIPT", uuidOf(401), "Utkast 2028", { usedInSpexId: ALI_BABA_2028.id, published: false, publishedAt: null }),
      version(511, "ARRANGEMENT", uuidOf(411), "Original", {
        usedInSpexId: ALI_BABA.id, arranger: "Arne Arrangör", key: { tonic: "F", mode: "MAJOR" }, modulations: [{ tonic: "G", mode: "MAJOR" }],
        recommended: true, instrumentation: [{ instrumentId: TRUMPET, count: 2 }, { instrumentId: TROMBONE, count: 1 }, { instrumentId: ALTO, count: 1 }, { instrumentId: FLUTE, count: 1 }],
      }),
      version(512, "ARRANGEMENT", uuidOf(411), "Transponerad till D", { key: { tonic: "D", mode: "MAJOR" }, instrumentation: [{ instrumentId: PIANO, count: 1 }] }),
      version(521, "ARRANGEMENT", uuidOf(412), "Original", {
        usedInSpexId: ALI_BABA.id, key: { tonic: "B_FLAT", mode: "MINOR" }, restricted: true, recommended: true,
        instrumentation: [{ instrumentId: TRUMPET, count: 1 }],
      }),
    ],
    files: [
      file(601, mv1, "Ali Baba manus", { roleId: MANUSCRIPT_ROLE, pages: 3 }),
      file(611, av1, "Ouvertyr partitur", { roleId: SCORE_ROLE }),
      file(612, av1, "Trumpet 1", { instrumentIds: [TRUMPET], desk: "1", transposition: T("B_FLAT") }),
      file(613, av1, "Trumpet 1 i C", { instrumentIds: [TRUMPET], desk: "1", transposition: T("C") }),
      file(614, av1, "Trombon", { instrumentIds: [TROMBONE], transposition: T("C") }),
      file(615, av1, "Alt- eller tenorsax", { instrumentIds: [ALTO, TENOR], transposition: T("E_FLAT") }),
      file(616, av1, "Flöjt och piccola", { instrumentIds: [FLUTE, PICCOLO], transposition: T("C") }),
      file(617, av1, "Ouvertyr källfil", { roleId: SOURCE_ROLE, name: "Ouvertyr.musicxml", extension: "musicxml", contentType: "application/vnd.recordare.musicxml+xml", pages: null, hasPreview: false }),
      file(621, av2, "Piano i D", { instrumentIds: [PIANO], transposition: T("C") }),
      file(631, av3, "Kärleksduetten partitur", { roleId: SCORE_ROLE }),
      file(632, av3, "Kärleksduetten trumpet", { instrumentIds: [TRUMPET], transposition: T("B_FLAT") }),
    ],
    shareLinks: [
      {
        id: uuidOf(701), token: "exempel-giltig-delningslank-0000000000000001", name: "Ali Baba 2028, band", createdById: "p-editor",
        createdByName: "Erik Redaktör", createdAt: "2026-10-01T10:00:00Z", expiresAt: "2027-09-01T10:00:00Z", revokedAt: null,
        revokedByName: null, versionIds: [mv1, av1, av3], fileIds: [], spexId: null, instrumentIds: [], transpositions: [], downloads: 3,
      },
      {
        id: uuidOf(702), token: "exempel-utgangen-delningslank-00000000000001", name: "Gammal länk", createdById: "p-editor",
        createdByName: "Erik Redaktör", createdAt: "2025-01-01T10:00:00Z", expiresAt: "2025-06-01T10:00:00Z", revokedAt: null,
        revokedByName: null, versionIds: [mv1], fileIds: [], spexId: null, instrumentIds: [], transpositions: [], downloads: 0,
      },
      {
        id: uuidOf(703), token: "exempel-aterkallad-delningslank-000000000001", name: "Återkallad", createdById: "p-editor",
        createdByName: "Erik Redaktör", createdAt: "2026-01-01T10:00:00Z", expiresAt: "2027-01-01T10:00:00Z", revokedAt: "2026-02-01T10:00:00Z",
        revokedByName: "Erik Redaktör", versionIds: [], fileIds: [uuidOf(631)], spexId: null, instrumentIds: [], transpositions: [], downloads: 0,
      },
      {
        id: uuidOf(704), token: "exempel-instrumentlank-trumpet-000000000001", name: "Ali Baba, trumpeter", createdById: "p-editor",
        createdByName: "Erik Redaktör", createdAt: "2026-10-02T10:00:00Z", expiresAt: "2027-10-01T10:00:00Z", revokedAt: null,
        revokedByName: null, versionIds: [], fileIds: [], spexId: ALI_BABA.id, instrumentIds: [TRUMPET], transpositions: [], downloads: 0,
      },
    ],
    accessRequests: [],
    settings: {
      welcomeSv: null, welcomeEn: null, maxUploadMb: 500, manuscriptRestricted: false, arrangementRestricted: true,
      maxShareLinkMonths: 24, accessRequestRecipients: [],
    },
    maintenanceJobs: ["SPEX_REFRESH", "UPLOAD_CLEANUP", "FILE_BACKFILL", "RETENTION"].map(job => ({
      job, schedule: "0 15 3 * * *", running: false, lastStartedAt: null, lastFinishedAt: null, lastSucceeded: null,
    })),
    audit: [],
    uploads: new Map(),
    // What the web sent, for the specs to check
    fileAdds: [],
    fileUpdates: [],
    zips: [],
  };
}

resetState();

// --- Views ------------------------------------------------------------------------------------------------------------

const spexById = id => SPEX.find(spex => spex.id === id);
const instrumentById = id => state.instruments.find(instrument => instrument.id === id);
const sortedInstruments = () => [...state.instruments].sort((a, b) => a.position - b.position);
const roleById = id => state.roles.find(role => role.id === id);
const numberById = id => state.numbers.find(number => number.id === id);
const parentOf = v => v.kind === "MANUSCRIPT"
  ? state.manuscripts.find(m => m.id === v.parentId)
  : state.arrangements.find(a => a.id === v.parentId);
const familyOf = spex => spex.parentId ?? spex.id;
const versionTrashed = v => Boolean(v.trashedAt || parentOf(v)?.trashedAt);
const visibleVersion = (persona, v) => isEditor(persona) || (v.published && !versionTrashed(v));
const canOpen = (persona, v) => !v.restricted || isEditor(persona);
const pitchClass = { C: 0, C_SHARP: 1, D_FLAT: 1, D: 2, D_SHARP: 3, E_FLAT: 3, E: 4, F: 5, F_SHARP: 6, G_FLAT: 6, G: 7, G_SHARP: 8, A_FLAT: 8, A: 9, A_SHARP: 10, B_FLAT: 10, B: 11 };

function matchesParts(f, parts) {
  if (!parts) {
    return true;
  }

  const instruments = parts.instrumentIds ?? [];
  const pitches = parts.transpositions ?? [];

  return f.instrumentIds.length > 0
    && (instruments.length === 0 || f.instrumentIds.some(id => instruments.includes(id)))
    && (pitches.length === 0 || (f.transposition && pitches.includes(f.transposition.pitch)));
}

const brief = spex => spex && ({ ...spex });
const withFamily = spex => spex && ({
  ...brief(spex),
  original: spex.parentId ? brief(spexById(spex.parentId)) : null,
  revivals: SPEX.filter(other => other.parentId === spex.id).map(brief),
});

function fileView(persona, f, v = state.versions.find(candidate => candidate.id === f.versionId)) {
  return {
    ...f,
    role: roleById(f.roleId),
    instruments: f.instrumentIds.map(instrumentById).filter(Boolean),
    canOpen: canOpen(persona, v),
    downloadCount: isEditor(persona) ? f.downloadCount : null,
  };
}

function filesOf(persona, v, parts) {
  return state.files.filter(f => f.versionId === v.id && matchesParts(f, parts))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(f => fileView(persona, f, v));
}

function numberView(persona, number) {
  const arrangement = state.arrangements.find(a => a.numberId === number.id && (isEditor(persona) || !a.trashedAt));
  const versions = arrangement ? state.versions.filter(v => v.parentId === arrangement.id && visibleVersion(persona, v)) : [];

  return {
    ...number,
    spex: withFamily(spexById(number.spexId)),
    arrangement: arrangement && (isEditor(persona) || versions.length > 0) ? {
      id: arrangement.id, trashed: Boolean(arrangement.trashedAt),
      versions: versions.map(v => ({ ...v, trashed: versionTrashed(v), usedIn: brief(spexById(v.usedInSpexId)) })),
    } : null,
  };
}

function versionView(persona, v, parts = null) {
  const parent = parentOf(v);
  const number = v.kind === "ARRANGEMENT" ? numberById(parent.numberId) : null;

  return {
    ...v,
    position: undefined,
    trashed: versionTrashed(v),
    canOpen: canOpen(persona, v),
    usedIn: v.usedInSpexId ? { ...brief(spexById(v.usedInSpexId)), numbers: numbersOf(persona, spexById(v.usedInSpexId)) } : null,
    instrumentation: v.instrumentation.map(entry => ({ count: entry.count, instrument: instrumentById(entry.instrumentId) })),
    files: filesOf(persona, v, parts),
    allFiles: filesOf(persona, v, null),
    manuscript: v.kind === "MANUSCRIPT" ? { ...parent, spex: withFamily(spexById(parent.spexId)) } : null,
    arrangement: number ? { id: parent.id, number: { ...number, spex: withFamily(spexById(number.spexId)) } } : null,
  };
}

function numbersOf(persona, spex) {
  const own = state.numbers.filter(number => number.spexId === spex.id);
  const list = own.length || !spex.parentId ? own : state.numbers.filter(number => number.spexId === spex.parentId);

  return list.sort((a, b) => a.position - b.position).map(number => numberView(persona, number));
}

const versionOrder = (a, b) => Number(b.recommended) - Number(a.recommended) || b.createdAt.localeCompare(a.createdAt);

function manuscriptView(persona, m) {
  return {
    ...m,
    trashed: Boolean(m.trashedAt),
    spex: withFamily(spexById(m.spexId)),
    versions: state.versions.filter(v => v.parentId === m.id && visibleVersion(persona, v)).sort(versionOrder).map(v => versionView(persona, v)),
  };
}

function arrangementView(persona, a, parts = null) {
  const number = numberById(a.numberId);

  return {
    ...a,
    trashed: Boolean(a.trashedAt),
    number: { ...number, spex: withFamily(spexById(number.spexId)) },
    versions: state.versions.filter(v => v.parentId === a.id && visibleVersion(persona, v)).sort(versionOrder).map(v => versionView(persona, v, parts)),
  };
}

const manuscriptsOfFamily = (persona, spex) => state.manuscripts
  .filter(m => m.spexId === familyOf(spex) && (isEditor(persona) || !m.trashedAt))
  .map(m => manuscriptView(persona, m))
  .filter(m => isEditor(persona) || m.versions.length > 0);

function spexCounts(persona, spex) {
  const manuscripts = manuscriptsOfFamily(persona, spex).length;
  const arrangements = numbersOf(persona, spex).filter(number => number.arrangement).length;

  return { manuscriptCount: manuscripts, arrangementCount: arrangements };
}

function spexPage(persona, spex, parts) {
  const numbers = numbersOf(persona, spex);

  return {
    ...withFamily(spex),
    ...spexCounts(persona, spex),
    revivals: SPEX.filter(other => other.parentId === spex.id).map(brief),
    numbersInherited: spex.parentId !== null && !state.numbers.some(number => number.spexId === spex.id),
    manuscripts: manuscriptsOfFamily(persona, spex),
    numbers,
    arrangements: numbers.filter(number => number.arrangement).map(number => {
      const arrangement = arrangementView(persona, state.arrangements.find(a => a.id === number.arrangement.id), parts);

      return { ...arrangement, versions: arrangement.versions.filter(v => !parts || v.files.length > 0), partsVersion: partsVersion(persona, arrangement, spex.id) };
    }).filter(a => !parts || a.versions.length > 0),
  };
}

// As the server's zip: of the versions the user may open, the one used in the spex, else the recommended one, else the newest
function partsVersion(persona, arrangement, spexId) {
  const openable = arrangement.versions.filter(v => v.canOpen && !v.trashed)
    .sort((a, b) => Number(b.usedInSpexId === spexId) - Number(a.usedInSpexId === spexId)
      || Number(b.recommended) - Number(a.recommended) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  return openable[0] ?? null;
}

function shareStatus(link) {
  return link.revokedAt ? "REVOKED" : link.expiresAt < new Date().toISOString() ? "EXPIRED" : "VALID";
}

function sharedFilesOf(link) {
  const ids = new Set(link.fileIds);

  for (const versionId of link.versionIds) {
    state.files.filter(f => f.versionId === versionId).forEach(f => ids.add(f.id));
  }
  if (link.spexId) {
    for (const number of state.numbers.filter(n => n.spexId === link.spexId)) {
      const arrangement = state.arrangements.find(a => a.numberId === number.id);

      state.versions.filter(v => arrangement && v.parentId === arrangement.id && v.published)
        .flatMap(v => state.files.filter(f => f.versionId === v.id))
        .filter(f => matchesParts(f, { instrumentIds: link.instrumentIds, transpositions: link.transpositions }))
        .forEach(f => ids.add(f.id));
    }
  }
  return state.files.filter(f => ids.has(f.id));
}

function sharedView(link, parts) {
  const status = shareStatus(link);
  const valid = status === "VALID";
  const files = valid ? sharedFilesOf(link) : [];
  const versionIds = [...new Set(files.map(f => f.versionId))];
  // As the server: every file a link opens has canOpen true
  const view = (f, v) => ({ ...fileView(null, f, v), canOpen: true, downloadCount: null });

  return {
    name: link.name, status, createdByName: link.createdByName, expiresAt: link.expiresAt,
    spex: valid && link.spexId ? brief(spexById(link.spexId)) : null,
    instruments: valid ? link.instrumentIds.map(instrumentById) : [],
    transpositions: valid ? link.transpositions : [],
    versions: versionIds.map(id => state.versions.find(v => v.id === id)).map(v => {
      const parent = parentOf(v);
      const number = v.kind === "ARRANGEMENT" ? numberById(parent.numberId) : null;
      const spex = spexById(number?.spexId ?? parent.spexId);

      return {
        id: v.id, kind: v.kind, title: number?.title ?? parent.title, label: v.label, spex, usedIn: spexById(v.usedInSpexId) ?? null,
        numberPosition: number?.position ?? null, originalSong: number?.originalSong ?? null, lyricist: number?.lyricist ?? null,
        composer: number?.composer ?? null, authors: parent.authors ?? null, arranger: v.arranger, key: v.key, modulations: v.modulations,
        tempo: v.tempo, duration: v.duration, date: v.date, notes: v.notes,
        instrumentation: v.instrumentation.map(entry => ({ count: entry.count, instrument: instrumentById(entry.instrumentId) })),
        files: files.filter(f => f.versionId === v.id && (!parts || matchesParts(f, parts))).map(f => view(f, v)),
        allFiles: files.filter(f => f.versionId === v.id).map(f => view(f, v)),
      };
    }),
  };
}

function shareLinkView(link) {
  return {
    ...link, token: undefined, status: shareStatus(link),
    spex: link.spexId ? brief(spexById(link.spexId)) : null,
    instruments: link.instrumentIds.map(instrumentById),
    versions: link.versionIds.map(id => versionView(PERSONAS.admin, state.versions.find(v => v.id === id))),
    files: link.fileIds.map(id => state.files.find(f => f.id === id)),
    downloads: link.downloads ? [{ count: link.downloads, file: sharedFilesOf(link)[0] }] : [],
    downloadCount: link.downloads,
  };
}

function audit(persona, action, entityType, entityId, summary) {
  state.audit.unshift({ id: String(state.nextId++), at: new Date().toISOString(), actorId: persona.sub, actorName: persona.name, action, entityType, entityId, summary });
}

function requireEditor(persona) {
  if (!isEditor(persona)) {
    throw forbidden();
  }
}

function requireAdmin(persona) {
  if (!isAdmin(persona)) {
    throw forbidden();
  }
}

const newId = () => uuidOf(state.nextId++);

function guess(name) {
  const base = name.replace(/\.[^.]+$/, "");
  const lower = base.toLowerCase();
  const instruments = state.instruments.filter(instrument =>
    [instrument.nameSv, instrument.nameEn, ...instrument.abbreviations].some(word => lower.includes(word.toLowerCase())));
  const desk = /\b(\d+(?:[-–]\d+)?)\b/.exec(base)?.[1] ?? null;
  const pitch = /\b(?:in|i)\s+(Bb|B|Eb|Ess|F|C|A)\b/i.exec(base)?.[1];
  const pitches = { bb: "B_FLAT", b: "B_FLAT", eb: "E_FLAT", ess: "E_FLAT", f: "F", c: "C", a: "A" };
  const transposition = pitch ? T(pitches[pitch.toLowerCase()]) : instruments[0]?.defaultTransposition ?? null;

  return {
    title: base,
    role: roleById(instruments.length ? PART_ROLE : /partitur|score/i.test(base) ? SCORE_ROLE : MANUSCRIPT_ROLE),
    instruments,
    desk,
    transposition,
  };
}

function findVersion(id) {
  const v = state.versions.find(candidate => candidate.id === id);

  if (!v) {
    throw notFound();
  }
  return v;
}

// --- Resolvers, by operation name -----------------------------------------------------------------------------------

const resolvers = {
  Me: persona => ({ me: { username: persona.email, displayName: persona.name, roles: persona.roles }, settings: state.settings }),
  Home: persona => ({
    categories: [{ ...CATEGORY, spexCount: SPEX.filter(spex => !spex.parentId).length }],
    years: [...new Set(SPEX.map(spex => spex.year))].sort((a, b) => b - a),
    recentVersions: state.versions.filter(v => visibleVersion(persona, v) && !versionTrashed(v)).map(v => versionView(persona, v)),
  }),
  Browse: () => ({
    categories: [{ ...CATEGORY, spexCount: SPEX.filter(spex => !spex.parentId).length }],
    years: [...new Set(SPEX.map(spex => spex.year))].sort((a, b) => b - a),
  }),
  SpexList: (persona, { filter }) => ({
    spexList: SPEX.filter(spex => !spex.parentId)
      .filter(spex => !filter?.year || spex.year === filter.year || SPEX.some(r => r.parentId === spex.id && r.year === filter.year))
      .filter(spex => !filter?.q || `${spex.title} ${spex.year}`.toLowerCase().includes(filter.q.toLowerCase()))
      .filter(spex => !filter?.withMaterial || spexCounts(persona, spex).manuscriptCount + spexCounts(persona, spex).arrangementCount > 0)
      .map(spex => ({
        ...brief(spex), ...spexCounts(persona, spex),
        revivals: SPEX.filter(r => r.parentId === spex.id).map(r => ({ ...brief(r), ...spexCounts(persona, r) })),
      })),
  }),
  SpexSearch: (persona, { filter }) => resolvers.SpexList(persona, { filter }),
  SpexPage: (persona, { id }) => ({ spex: spexById(id) ? spexPage(persona, spexById(id), null) : null }),
  SpexArrangements: (persona, { id, parts }) => ({
    spex: spexById(id) ? spexPage(persona, spexById(id), parts) : null,
    instruments: sortedInstruments(),
  }),
  Manuscript: (persona, { id }) => {
    const m = state.manuscripts.find(candidate => candidate.id === id);

    return { manuscript: m && (isEditor(persona) || !m.trashedAt) ? manuscriptView(persona, m) : null };
  },
  Arrangement: (persona, { id, parts }) => {
    const a = state.arrangements.find(candidate => candidate.id === id);

    return { arrangement: a && (isEditor(persona) || !a.trashedAt) ? arrangementView(persona, a, parts) : null, instruments: sortedInstruments() };
  },
  Version: (persona, { id }) => {
    const v = state.versions.find(candidate => candidate.id === id);

    return { version: v && visibleVersion(persona, v) ? versionView(persona, v) : null };
  },
  FileVersion: (persona, variables) => resolvers.Version(persona, variables),
  File: (persona, { id }) => {
    const f = state.files.find(candidate => candidate.id === id);
    const v = f && state.versions.find(candidate => candidate.id === f.versionId);

    return { file: f && visibleVersion(persona, v) ? fileView(persona, f, v) : null };
  },
  Search: (persona, { q, parts, key }) => {
    const text = (q ?? "").toLowerCase();
    const hit = value => Boolean(text) && (value ?? "").toLowerCase().includes(text);
    const visibleVersions = state.versions.filter(v => visibleVersion(persona, v) && !versionTrashed(v));
    const keyed = key ? visibleVersions.filter(v => v.kind === "ARRANGEMENT" && v.key && pitchClass[v.key.tonic] === pitchClass[key.tonic] && v.key.mode === key.mode) : [];

    return {
      instruments: sortedInstruments(),
      search: {
        spex: SPEX.filter(spex => hit(spex.title)).map(brief),
        manuscripts: state.manuscripts.filter(m => hit(m.title) || hit(m.authors)).map(m => manuscriptView(persona, m)),
        numbers: state.numbers.filter(n => hit(n.title) || hit(n.originalSong) || hit(n.lyricist) || hit(n.composer)).map(n => numberView(persona, n)),
        arrangements: state.arrangements.filter(a => visibleVersions.some(v => v.parentId === a.id && hit(v.arranger))).map(a => arrangementView(persona, a)),
        versions: keyed.map(v => versionView(persona, v)),
        textHits: text === "kungamantel"
          ? state.files.filter(f => f.contentType === "application/pdf" && visibleVersions.some(v => v.id === f.versionId && canOpen(persona, v)))
            .filter(f => !parts || matchesParts(f, parts))
            .map(f => {
              const v = state.versions.find(candidate => candidate.id === f.versionId);

              return { page: 2, snippet: "Kungen tar sin kungamantel och sjunger", file: fileView(persona, f, v), version: versionView(persona, v) };
            })
          : [],
      },
    };
  },
  Instruments: () => ({ instruments: sortedInstruments().map(instrument => ({ ...instrument, useCount: state.files.filter(f => f.instrumentIds.includes(instrument.id)).length })) }),
  FileRoles: () => ({ fileRoles: [...state.roles].sort((a, b) => a.position - b.position).map(role => ({ ...role, fileCount: state.files.filter(f => f.roleId === role.id).length })) }),
  FileGuess: (persona, { name }) => {
    requireEditor(persona);
    return { fileGuess: guess(name) };
  },
  Missing: persona => {
    requireEditor(persona);
    return {
      categories: [{ ...CATEGORY, spexCount: 2 }],
      missingManuscripts: SPEX.filter(spex => !spex.parentId && manuscriptsOfFamily(persona, spex).length === 0).map(brief),
      missingArrangements: state.numbers.filter(n => !state.arrangements.some(a => a.numberId === n.id)).map(n => numberView(persona, n)),
    };
  },
  ManuscriptCreate: (persona, { input }) => {
    requireEditor(persona);

    const m = { id: newId(), spexId: input.spexId, title: input.title || spexById(input.spexId).title, authors: input.authors, description: input.description, trashedAt: null, createdAt: new Date().toISOString() };
    const v = version(state.nextId++, "MANUSCRIPT", m.id, "Original", { published: false, publishedAt: null, restricted: state.settings.manuscriptRestricted });

    state.manuscripts.push(m);
    state.versions.push(v);
    audit(persona, "CREATE", "MANUSCRIPT", m.id, `Skapade manuset ${m.title}`);
    return { manuscriptCreate: { id: m.id, versions: [{ id: v.id }] } };
  },
  ManuscriptUpdate: (persona, { id, input }) => {
    requireEditor(persona);
    Object.assign(state.manuscripts.find(m => m.id === id), { title: input.title, authors: input.authors, description: input.description });
    return { manuscriptUpdate: { id } };
  },
  ArrangementCreate: (persona, { input }) => {
    requireEditor(persona);

    const a = { id: newId(), numberId: input.numberId, description: null, trashedAt: null, createdAt: new Date().toISOString() };
    const v = version(state.nextId++, "ARRANGEMENT", a.id, "Original", { published: false, publishedAt: null, restricted: state.settings.arrangementRestricted });

    state.arrangements.push(a);
    state.versions.push(v);
    return { arrangementCreate: { id: a.id, versions: [{ id: v.id }] } };
  },
  VersionCreate: (persona, { parentId, input }) => {
    requireEditor(persona);

    const parent = state.manuscripts.find(m => m.id === parentId) ? "MANUSCRIPT" : "ARRANGEMENT";
    const v = version(state.nextId++, parent, parentId, input.label, { published: false, publishedAt: null });

    state.versions.push(v);
    return { versionCreate: { id: v.id } };
  },
  VersionUpdate: (persona, { id, input }) => {
    requireEditor(persona);

    const v = findVersion(id);

    Object.assign(v, {
      label: input.label, usedInSpexId: input.usedInSpexId ?? null, date: input.date ?? null, notes: input.notes ?? null,
      lastModifiedAt: new Date().toISOString(),
    });
    for (const field of ["arranger", "key", "tempo", "duration"]) {
      if (field in input) {
        v[field] = input[field] ?? null;
      }
    }
    if (input.modulations) {
      v.modulations = input.modulations;
    }
    if (input.instrumentation) {
      v.instrumentation = input.instrumentation;
    }
    if (typeof input.restricted === "boolean") {
      v.restricted = input.restricted;
    }
    audit(persona, "UPDATE", "VERSION", id, `Ändrade versionen ${v.label}`);
    return { versionUpdate: { id } };
  },
  VersionPublish: (persona, { id, published }) => {
    requireEditor(persona);

    const v = findVersion(id);

    v.published = published;
    v.publishedAt = published ? new Date().toISOString() : null;
    audit(persona, published ? "PUBLISH" : "UNPUBLISH", "VERSION", id, `${published ? "Publicerade" : "Avpublicerade"} ${v.label}`);
    return { versionPublish: { id, published } };
  },
  VersionRecommend: (persona, { id, recommended }) => {
    requireEditor(persona);

    const v = findVersion(id);

    state.versions.filter(other => other.parentId === v.parentId).forEach(other => (other.recommended = false));
    v.recommended = recommended;
    return { versionRecommend: { id, recommended } };
  },
  VersionTrash: (persona, { id }) => {
    requireEditor(persona);
    findVersion(id).trashedAt = new Date().toISOString();
    return { versionTrash: { id } };
  },
  VersionRestore: (persona, { id }) => {
    requireEditor(persona);
    findVersion(id).trashedAt = null;
    return { versionRestore: { id } };
  },
  VersionCopy: (persona, { id }) => {
    requireEditor(persona);

    const copy = { ...findVersion(id), id: newId(), label: `${findVersion(id).label} (kopia)`, published: false, recommended: false };

    state.versions.push(copy);
    return { versionCopy: { id: copy.id } };
  },
  FileAdd: (persona, { input }) => {
    requireEditor(persona);

    const upload = state.uploads.get(input.uploadId);

    if (!upload || upload.offset < upload.length) {
      throw new GraphQLError("BAD_REQUEST", "Uppladdningen är inte klar.");
    }

    const id = newId();
    const first = instrumentById(input.instrumentIds?.[0]);

    state.fileAdds.push(input);
    state.files.push(file(Number(id.slice(-12)), input.versionId, input.title || upload.name.replace(/\.[^.]+$/, ""), {
      id, name: upload.name, roleId: input.roleId ?? PART_ROLE, instrumentIds: input.instrumentIds ?? [], desk: input.desk ?? null,
      transposition: input.transposition ?? first?.defaultTransposition ?? null, position: 99, processing: "PENDING",
    }));
    state.uploads.delete(input.uploadId);
    audit(persona, "CREATE", "FILE", id, `Laddade upp ${upload.name}`);
    return { fileAdd: { id } };
  },
  FileUpdate: (persona, { id, input }) => {
    requireEditor(persona);
    state.fileUpdates.push({ id, input });
    Object.assign(state.files.find(f => f.id === id), {
      title: input.title, comment: input.comment ?? null, roleId: input.roleId, instrumentIds: input.instrumentIds ?? [],
      desk: input.desk ?? null, transposition: input.transposition ?? null,
    });
    return { fileUpdate: { id } };
  },
  FilesReorder: (persona, { ids }) => {
    requireEditor(persona);
    ids.forEach((id, index) => (state.files.find(f => f.id === id).position = index));
    return { filesReorder: [] };
  },
  FileDelete: (persona, { id }) => {
    requireEditor(persona);
    state.files = state.files.filter(f => f.id !== id);
    return { fileDelete: null };
  },
  NumbersPaste: (persona, { spexId, text }) => {
    requireEditor(persona);
    for (const line of text.split("\n").map(value => value.trim()).filter(Boolean)) {
      const [, title, song] = /^(?:\d+\.\s*)?(.*?)(?:\s*\((.*)\))?$/.exec(line);

      state.numbers.push({ id: newId(), spexId, position: state.numbers.filter(n => n.spexId === spexId).length + 1, title, originalSong: song ?? null, lyricist: null, composer: null });
    }
    return { numbersPaste: [] };
  },
  NumberCreate: (persona, { spexId, input }) => {
    requireEditor(persona);
    state.numbers.push({ id: newId(), spexId, position: state.numbers.filter(n => n.spexId === spexId).length + 1, ...input });
    return { numberCreate: { id: "x" } };
  },
  NumberUpdate: (persona, { id, input }) => {
    requireEditor(persona);
    Object.assign(numberById(id), input);
    return { numberUpdate: { id } };
  },
  NumbersReorder: (persona, { ids }) => {
    requireEditor(persona);
    ids.forEach((id, index) => (numberById(id).position = index + 1));
    return { numbersReorder: [] };
  },
  NumberDelete: (persona, { id }) => {
    requireEditor(persona);
    if (state.arrangements.some(a => a.numberId === id)) {
      throw new GraphQLError("CONFLICT", "Numret har ett arrangemang.");
    }
    state.numbers = state.numbers.filter(n => n.id !== id);
    return { numberDelete: null };
  },
  ShareLinkCreate: (persona, { input }) => {
    requireEditor(persona);

    const token = `e2e-${randomUUID().replace(/-/g, "")}`;
    const link = {
      id: newId(), token, name: input.name, createdById: persona.sub, createdByName: persona.name, createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (input.months ?? 12) * 30 * 86400_000).toISOString(), revokedAt: null, revokedByName: null,
      versionIds: input.versionIds ?? [], fileIds: input.fileIds ?? [], spexId: input.spexId ?? null,
      instrumentIds: input.instrumentIds ?? [], transpositions: input.transpositions ?? [], downloads: 0,
    };

    state.shareLinks.unshift(link);
    audit(persona, "SHARE", "SHARE_LINK", link.id, `Delade ${link.name}`);
    return { shareLinkCreate: { token, shareLink: shareLinkView(link) } };
  },
  ShareLinkRevoke: (persona, { id }) => {
    requireEditor(persona);
    Object.assign(state.shareLinks.find(link => link.id === id), { revokedAt: new Date().toISOString(), revokedByName: persona.name });
    return { shareLinkRevoke: { id } };
  },
  ShareLinkRename: (persona, { id, name }) => {
    requireEditor(persona);
    state.shareLinks.find(link => link.id === id).name = name;
    return { shareLinkRename: { id, name } };
  },
  ShareLinkExtend: (persona, { id, months }) => {
    requireEditor(persona);
    state.shareLinks.find(link => link.id === id).expiresAt = new Date(Date.now() + months * 30 * 86400_000).toISOString();
    return { shareLinkExtend: { id } };
  },
  ShareLinks: (persona, { all }) => {
    requireEditor(persona);
    return { shareLinks: state.shareLinks.filter(link => (all && isAdmin(persona)) || link.createdById === persona.sub).map(shareLinkView) };
  },
  AccessRequestCreate: (persona, { input }) => {
    state.accessRequests.unshift({
      id: newId(), userName: persona.name, userEmail: persona.email, reason: input.reason, createdAt: new Date().toISOString(),
      fileIds: input.fileIds, handledAt: null, handledByName: null,
    });
    return { accessRequestCreate: null };
  },
  AccessRequests: (persona, { handled }) => {
    requireEditor(persona);
    return {
      accessRequests: state.accessRequests
        .filter(request => handled === null || handled === undefined || handled === Boolean(request.handledAt))
        .map(request => ({ ...request, files: request.fileIds.map(id => state.files.find(f => f.id === id)) })),
    };
  },
  AccessRequestHandle: (persona, { id, handled }) => {
    requireEditor(persona);

    const request = state.accessRequests.find(candidate => candidate.id === id);

    Object.assign(request, handled === false
      ? { handledAt: null, handledByName: null }
      : { handledAt: new Date().toISOString(), handledByName: persona.name });
    audit(persona, "UPDATE", "ACCESS_REQUEST", id, `Hanterade åtkomstförfrågan från ${request.userName}`);
    return { accessRequestHandle: { id, handledAt: request.handledAt } };
  },
  Trash: persona => {
    requireEditor(persona);
    return {
      trash: {
        manuscripts: state.manuscripts.filter(m => m.trashedAt).map(m => manuscriptView(persona, m)),
        arrangements: state.arrangements.filter(a => a.trashedAt).map(a => arrangementView(persona, a)),
        versions: state.versions.filter(v => v.trashedAt).map(v => versionView(persona, v)),
      },
    };
  },
  TrashEmpty: persona => {
    requireAdmin(persona);
    state.versions = state.versions.filter(v => !v.trashedAt);
    return { trashEmpty: null };
  },
  AuditLog: (persona, { page = 0, size = 50, filter = {} }) => {
    requireEditor(persona);

    const entries = state.audit.filter(entry => (isAdmin(persona) || entry.actorId === persona.sub)
      && (!filter?.entityId || entry.entityId === filter.entityId));

    return { auditLog: { entries: entries.slice(page * size, (page + 1) * size), totalCount: entries.length, page, size } };
  },
  AuditActors: persona => ({ auditActors: [{ id: persona.sub, name: persona.name }] }),
  Settings: () => ({ settings: state.settings }),
  SettingsUpdate: (persona, { input }) => {
    requireAdmin(persona);
    Object.assign(state.settings, input);
    return { settingsUpdate: state.settings };
  },
  Storage: persona => {
    requireAdmin(persona);
    return { storage: { filesBytes: 12_500_000, previewsBytes: 800_000, freeBytes: 80_000_000_000, fileCount: state.files.length } };
  },
  MaintenanceJobs: persona => {
    requireAdmin(persona);
    return { maintenanceJobs: state.maintenanceJobs };
  },
  MaintenanceJobRun: (persona, { job }) => {
    requireAdmin(persona);
    state.maintenanceJobs.find(candidate => candidate.job === job).lastStartedAt = new Date().toISOString();
    return { maintenanceJobRun: true };
  },
  InstrumentCreate: (persona, { input }) => {
    requireAdmin(persona);
    state.instruments.push({ id: newId(), ...input, abbreviations: input.abbreviations ?? [], defaultTransposition: input.defaultTransposition ?? T("C"), position: state.instruments.length + 1 });
    return { instrumentCreate: { id: "x" } };
  },
  InstrumentUpdate: (persona, { id, input }) => {
    requireAdmin(persona);
    Object.assign(instrumentById(id), input);
    return { instrumentUpdate: { id } };
  },
  FileRoleCreate: (persona, { input }) => {
    requireAdmin(persona);
    state.roles.push({ id: newId(), ...input, position: state.roles.length + 1 });
    return { fileRoleCreate: { id: "x" } };
  },
};

// Answered without a login: what a share link opens
const anonymous = {
  SharedView: (_, { token, parts }) => {
    const link = state.shareLinks.find(candidate => candidate.token === token);

    return { sharedView: link ? sharedView(link, parts && ((parts.instrumentIds ?? []).length || (parts.transpositions ?? []).length) ? parts : null) : null };
  },
};

function operationNameOf(query) {
  const match = /\b(query|mutation)\s+([A-Za-z0-9_]+)/.exec(query);
  return match ? match[2] : null;
}

function personaOf(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return bySub[payload.sub] ?? null;
  } catch {
    return null;
  }
}

function handleGraphql(req, body, res) {
  let payload;

  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400).end("{\"errors\":[{\"message\":\"bad json\"}]}");
    return;
  }

  const op = operationNameOf(payload.query || "");

  res.writeHead(200, { "content-type": "application/json" });
  try {
    if (op && anonymous[op]) {
      res.end(JSON.stringify({ data: anonymous[op](null, payload.variables || {}) }));
      return;
    }

    const persona = personaOf(req);

    if (!persona) {
      throw new GraphQLError("UNAUTHORIZED", "Du är inte inloggad.");
    }
    if (!persona.roles.includes("USER")) {
      throw forbidden();
    }

    const resolver = op && resolvers[op];

    res.end(JSON.stringify({ data: resolver ? resolver(persona, payload.variables || {}) : {} }));
  } catch (error) {
    const known = error instanceof GraphQLError;

    if (!known) {
      console.error(error);
    }
    res.end(JSON.stringify({
      data: null,
      errors: [{ message: known ? error.message : String(error), extensions: { classification: known ? error.classification : "INTERNAL_ERROR" } }],
    }));
  }
}

// --- Files ------------------------------------------------------------------------------------------------------------

function sendFile(req, res, f, download) {
  const body = f.contentType === "application/pdf" ? makePdf(f.title.normalize("NFD").replace(/[^\x20-\x7e]/g, ""), f.pages ?? 1) : Buffer.from("<score/>");
  const headers = {
    "content-type": f.contentType,
    "accept-ranges": "bytes",
    "content-disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(`${f.title}.${f.extension}`)}`,
  };
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? "");

  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;

    res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${body.length}`, "content-length": String(end - start + 1) })
      .end(body.subarray(start, end + 1));
  } else {
    res.writeHead(200, { ...headers, "content-length": String(body.length) }).end(body);
  }
  if (download) {
    f.downloadCount++;
  }
}

const sendZip = (res, name) => res.writeHead(200, {
  "content-type": "application/zip",
  "content-disposition": `attachment; filename="${name}.zip"`,
}).end(Buffer.alloc(22));

const jsonError = (res, status, code, message, extra = {}) =>
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ code, message, ...extra }));

function handleFiles(req, res, url) {
  const persona = personaOf(req);
  const parts = url.pathname.split("/").filter(Boolean); // api, files|versions|spex, id, ...

  if (!persona) {
    return jsonError(res, 401, "UNAUTHORIZED", "Du är inte inloggad.");
  }
  state.zips.push(url.pathname + url.search);
  if (parts[1] === "files") {
    const f = state.files.find(candidate => candidate.id === parts[2]);
    const v = f && state.versions.find(candidate => candidate.id === f.versionId);

    if (!f || !visibleVersion(persona, v)) {
      return jsonError(res, 404, "NOT_FOUND", "Filen finns inte.");
    }
    if (!canOpen(persona, v)) {
      return jsonError(res, 403, "FORBIDDEN", "Filen är begränsad.");
    }
    if (parts[3] === "preview") {
      return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    }
    return sendFile(req, res, f, url.searchParams.get("download") === "true");
  }
  return sendZip(res, parts[1] === "spex" ? "stammor" : "version");
}

function handleShare(req, res, url) {
  // /api/share/{token}/{kind}/{id}/…
  const [, , token, kind, id, ...rest] = url.pathname.split("/").filter(Boolean);
  const link = state.shareLinks.find(candidate => candidate.token === token);

  if (!link) {
    return jsonError(res, 404, "NOT_FOUND", "Länken finns inte.");
  }
  if (req.headers.authorization) {
    return jsonError(res, 400, "BAD_REQUEST", "Share links take no token.");
  }

  const status = shareStatus(link);

  if (status !== "VALID") {
    return jsonError(res, 410, status === "EXPIRED" ? "SHARE_LINK_EXPIRED" : "SHARE_LINK_REVOKED",
      status === "EXPIRED" ? "Länken har gått ut." : "Länken är återkallad.", { createdByName: link.createdByName });
  }
  state.zips.push(url.pathname.replace(token, "<token>") + url.search);
  if (kind === "files") {
    const f = sharedFilesOf(link).find(candidate => candidate.id === id);

    if (!f) {
      return jsonError(res, 404, "NOT_FOUND", "Filen finns inte.");
    }
    if (rest[0] === "preview") {
      return res.writeHead(200, { "content-type": "image/png" }).end(PNG);
    }
    return sendFile(req, res, f, url.searchParams.get("download") === "true");
  }
  return sendZip(res, "delat");
}

// --- OIDC ----------------------------------------------------------------------------------------------------------

const oidcConfig = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
  token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
  userinfo_endpoint: `${ISSUER}/protocol/openid-connect/userinfo`,
  jwks_uri: `${ISSUER}/protocol/openid-connect/certs`,
  end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
  response_types_supported: ["code"],
  subject_types_supported: ["public"],
  id_token_signing_alg_values_supported: ["RS256"],
};

const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
const publicJwk = { ...(await exportJWK(publicKey)), kid: KID, alg: "RS256", use: "sig" };
const pendingCodes = new Map();

const userClaims = persona => ({
  sub: persona.sub,
  name: persona.name,
  email: persona.email,
  email_verified: true,
  preferred_username: persona.email,
});

const signJwt = (persona, claims, audience) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject(persona.sub)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL}s`)
    .sign(privateKey);

function handleAuthorize(url, res) {
  const redirectUri = url.searchParams.get("redirect_uri");

  if (!redirectUri) {
    res.writeHead(400).end("missing redirect_uri");
    return;
  }

  const code = randomUUID();

  pendingCodes.set(code, { nonce: url.searchParams.get("nonce"), persona: PERSONAS[currentPersona] });

  const target = new URL(redirectUri);

  target.searchParams.set("code", code);
  if (url.searchParams.get("state")) {
    target.searchParams.set("state", url.searchParams.get("state"));
  }
  res.writeHead(302, { location: target.toString() }).end();
}

async function handleToken(body, res) {
  const params = new URLSearchParams(body);
  let pending = { nonce: null, persona: PERSONAS[currentPersona] };

  if (params.get("grant_type") === "authorization_code") {
    const code = params.get("code");

    if (!pendingCodes.has(code)) {
      res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "invalid_grant" }));
      return;
    }
    pending = pendingCodes.get(code);
    pendingCodes.delete(code);
  }

  const { persona, nonce } = pending;

  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({
    access_token: await signJwt(persona, {
      ...userClaims(persona),
      typ: "Bearer",
      azp: CLIENT_ID,
      resource_access: { [CLIENT_ID]: { roles: persona.roles } },
    }, "account"),
    id_token: await signJwt(persona, { ...userClaims(persona), ...(nonce ? { nonce } : {}) }, CLIENT_ID),
    refresh_token: `refresh-${randomUUID()}`,
    token_type: "Bearer",
    expires_in: TOKEN_TTL,
    scope: "openid profile email",
  }));
}

// --- tus ------------------------------------------------------------------------------------------------------------

function handleTus(req, path, body, res) {
  const headers = { "tus-resumable": "1.0.0" };
  const id = path.split("/")[3];
  const persona = personaOf(req);

  if (req.method === "OPTIONS") {
    res.writeHead(204, { ...headers, "tus-version": "1.0.0", "tus-extension": "creation,termination", "tus-max-size": "524288000" }).end();
  } else if (!persona || !isEditor(persona)) {
    jsonError(res, 403, "FORBIDDEN", "Du har inte behörighet att göra det.");
  } else if (req.method === "POST") {
    const upload = randomUUID();
    const metadata = Object.fromEntries((req.headers["upload-metadata"] ?? "").split(",").filter(Boolean)
      .map(pair => pair.trim().split(" ")).map(([key, value]) => [key, Buffer.from(value ?? "", "base64").toString("utf8")]));

    state.uploads.set(upload, { name: metadata.filename ?? "upload", length: Number(req.headers["upload-length"]), offset: 0 });
    res.writeHead(201, { ...headers, location: `/api/uploads/${upload}` }).end();
  } else if (!state.uploads.has(id)) {
    res.writeHead(404, headers).end();
  } else if (req.method === "HEAD") {
    const upload = state.uploads.get(id);

    res.writeHead(200, { ...headers, "upload-offset": String(upload.offset), "upload-length": String(upload.length), "cache-control": "no-store" }).end();
  } else if (req.method === "PATCH") {
    const upload = state.uploads.get(id);

    if (Number(req.headers["upload-offset"]) !== upload.offset) {
      res.writeHead(409, headers).end();
      return;
    }
    upload.offset += body.length;
    res.writeHead(204, { ...headers, "upload-offset": String(upload.offset) }).end();
  } else if (req.method === "DELETE") {
    state.uploads.delete(id);
    res.writeHead(204, headers).end();
  } else {
    res.writeHead(405).end();
  }
}

// A browser that stops reading (pdf.js cancelling a range, a closed tab) must not take the mock down
process.on("uncaughtException", error => console.error("[mock-backend] uncaught", error));

const server = createServer((req, res) => {
  const chunks = [];

  req.on("error", () => undefined);
  res.on("error", () => undefined);

  req.on("data", chunk => chunks.push(chunk));
  req.on("end", () => handle(req, res, chunks).catch(error => {
    // A broken handler answers 500 instead of taking the mock down for every later test
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500).end();
    }
  }));
});

async function handle(req, res, chunks) {
  const url = new URL(req.url || "", `http://localhost:${PORT}`);
  const path = url.pathname;
  const rawBody = Buffer.concat(chunks);
  const body = rawBody.toString("utf8");

  if (path.endsWith("/.well-known/openid-configuration")) {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(oidcConfig));
  } else if (path.endsWith("/protocol/openid-connect/certs")) {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ keys: [publicJwk] }));
  } else if (path.endsWith("/protocol/openid-connect/auth")) {
    handleAuthorize(url, res);
  } else if (path.endsWith("/protocol/openid-connect/token")) {
    await handleToken(body, res);
  } else if (path.endsWith("/protocol/openid-connect/userinfo")) {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(userClaims(personaOf(req) ?? PERSONAS[currentPersona])));
  } else if (path.endsWith("/protocol/openid-connect/logout")) {
    res.writeHead(302, { location: url.searchParams.get("post_logout_redirect_uri") || `http://localhost:${PORT}/` }).end();
  } else if (req.method === "POST" && path === "/__reset") {
    resetState();
    currentPersona = "admin";
    res.writeHead(204).end();
  } else if (req.method === "POST" && path === "/__persona") {
    const { persona } = JSON.parse(body);
    // Another web's tests reaching this mock would otherwise log in as nobody
    if (!Object.hasOwn(PERSONAS, persona)) {
      res.writeHead(400).end(`unknown persona ${persona}`);
      return;
    }
    currentPersona = persona;
    res.writeHead(204).end();
  } else if (req.method === "GET" && path === "/__state") {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
      uploads: state.uploads.size,
      fileAdds: state.fileAdds,
      fileUpdates: state.fileUpdates,
      accessRequests: state.accessRequests,
      shareLinks: state.shareLinks.map(({ token, ...link }) => ({ ...link, tokenLength: token.length })),
      zips: state.zips,
      numbers: state.numbers,
    }));
  } else if (path === "/api/uploads" || path.startsWith("/api/uploads/")) {
    handleTus(req, path, rawBody, res);
  } else if (req.method === "GET" && path.startsWith("/api/share/")) {
    handleShare(req, res, url);
  } else if (req.method === "GET" && /^\/api\/(files|versions|spex)\//.test(path)) {
    handleFiles(req, res, url);
  } else if (req.method === "POST" && path.includes("/api/graphql")) {
    handleGraphql(req, body, res);
  } else {
    res.writeHead(404).end();
  }
}

server.listen(PORT, () => {
  console.log(`[mock-backend] listening on http://localhost:${PORT}`);
});
