const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect, useRef, useCallback } = window.Hooks;
const { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy, Download, Edit3, Expand, Eye, EyeOff, FileUp, Gamepad2, Headphones, Keyboard, Lock, Maximize, Minus, MonitorPlay, Plus, RotateCcw, Save, Settings2, ShieldAlert, SkipForward, Sparkles, Trash2, Trophy, Volume2, VolumeX, X } = window.IconSet;
const createRoot = el => ({ render: node => ReactDOM.render(node, el) });
// Fictional sample answers and point values. Replace using a real survey before public events.
const sampleQuestions = [
    { id: 'demo-1', question: 'Sebutkan benda yang biasanya dibawa saat pergi ke sekolah atau kampus!', multiplier: 1, answers: [{ text: 'Tas', points: 34 }, { text: 'Buku / catatan', points: 24 }, { text: 'Laptop', points: 18 }, { text: 'Alat tulis', points: 14 }, { text: 'Botol minum', points: 10 }] },
    { id: 'demo-2', question: 'Sebutkan aktivitas yang sering dilakukan saat akhir pekan!', multiplier: 1, answers: [{ text: 'Istirahat', points: 30 }, { text: 'Jalan-jalan', points: 26 }, { text: 'Menonton film', points: 20 }, { text: 'Olahraga', points: 14 }, { text: 'Berkumpul dengan teman', points: 10 }] },
    { id: 'demo-3', question: 'Sebutkan hal yang membuat acara komunitas menjadi seru!', multiplier: 2, answers: [{ text: 'Permainan', points: 35 }, { text: 'Makanan', points: 25 }, { text: 'Hadiah', points: 18 }, { text: 'Musik', points: 12 }, { text: 'Teman baru', points: 10 }] },
    { id: 'demo-4', question: 'Sebutkan sesuatu yang biasanya ada di ruang kelas!', multiplier: 2, answers: [{ text: 'Meja', points: 32 }, { text: 'Kursi', points: 26 }, { text: 'Papan tulis', points: 20 }, { text: 'Proyektor', points: 14 }, { text: 'Spidol', points: 8 }] },
    { id: 'demo-5', question: 'Sebutkan hal yang perlu disiapkan sebelum presentasi!', multiplier: 3, answers: [{ text: 'Slide', points: 36 }, { text: 'Materi', points: 26 }, { text: 'Latihan', points: 18 }, { text: 'Laptop', points: 12 }, { text: 'Koneksi / kabel', points: 8 }] },
    { id: 'demo-6', question: 'Sebutkan cara seseorang biasanya mengisi waktu luang!', multiplier: 3, answers: [{ text: 'Membaca', points: 30 }, { text: 'Bermain game', points: 26 }, { text: 'Menonton', points: 20 }, { text: 'Berolahraga', points: 14 }, { text: 'Memasak', points: 10 }] }
];
const STORAGE_KEY = 'playlab-survey-showdown-v2';
const CHANNEL = 'playlab-survey-showdown-sync-v2';
function makeInitialState() {
    return {
        version: 1,
        questions: structuredClone(sampleQuestions),
        roundIndex: 0,
        teamNames: ['Tim Merah', 'Tim Biru'],
        progress: {},
        lastEvent: null
    };
}
function progressFor(state, questionId) {
    return state.progress?.[questionId] ?? { revealed: [], strikes: 0, activeTeam: 0, phase: 'play', awardedTeam: null, awardedAmount: 0 };
}
function sumBank(question, progress) {
    if (!question)
        return 0;
    return question.answers.reduce((sum, answer, i) => sum + (progress.revealed.includes(i) ? answer.points * question.multiplier : 0), 0);
}
function getScores(state) {
    return state.questions.reduce((acc, q) => {
        const p = state.progress?.[q.id];
        if (p && (p.awardedTeam === 0 || p.awardedTeam === 1))
            acc[p.awardedTeam] += p.awardedAmount || 0;
        return acc;
    }, [0, 0]);
}
function normalizeQuestions(input) {
    const data = Array.isArray(input) ? input : input?.questions;
    if (!Array.isArray(data) || !data.length || data.length > 60)
        throw new Error('Import must contain 1–60 questions.');
    const used = new Set();
    return data.map((q, i) => {
        const question = String(q.question || '').trim();
        const multiplier = Number(q.multiplier ?? 1);
        if (!question || question.length > 240)
            throw new Error(`Question ${i + 1}: enter a question (max 240 characters).`);
        if (![1, 2, 3].includes(multiplier))
            throw new Error(`Question ${i + 1}: multiplier must be 1, 2, or 3.`);
        if (!Array.isArray(q.answers) || q.answers.length < 2 || q.answers.length > 8)
            throw new Error(`Question ${i + 1}: include 2–8 answers.`);
        const answers = q.answers.map((a, j) => {
            const ans = String(a.text || '').trim();
            const points = Number(a.points);
            if (!ans || ans.length > 70 || !Number.isInteger(points) || points < 1 || points > 100)
                throw new Error(`Question ${i + 1}, answer ${j + 1}: provide text and integer points 1–100.`);
            return { text: ans, points };
        });
        let id = String(q.id || `q${i + 1}`);
        if (used.has(id))
            id = `q${i + 1}-${Date.now()}`;
        used.add(id);
        return { id, question, multiplier, answers };
    });
}
function readSavedState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            const questions = normalizeQuestions(saved.questions);
            return {
                version: 1, questions,
                roundIndex: Math.min(Math.max(0, Number(saved.roundIndex) || 0), questions.length - 1),
                teamNames: Array.isArray(saved.teamNames) && saved.teamNames.length === 2 ? saved.teamNames.map((s, i) => String(s || `Tim ${i + 1}`).slice(0, 45)) : ['Tim Merah', 'Tim Biru'],
                progress: typeof saved.progress === 'object' && saved.progress && !Array.isArray(saved.progress) ? saved.progress : {},
                lastEvent: saved.lastEvent || null
            };
        }
    }
    catch (e) {
        console.warn('Saved game could not be read; loading demo data.', e);
    }
    return makeInitialState();
}
const IS_DISPLAY = new URLSearchParams(location.search).get('view') === 'display';
function uid() { return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function dispatchEvent(kind, detail = '') { return { kind, detail, stamp: Date.now(), nonce: Math.random().toString(36).slice(2) }; }
function useGame() {
    const [game, setGame] = useState(readSavedState);
    const ref = useRef(game);
    const channelRef = useRef(null);
    useEffect(() => {
        const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL) : null;
        channelRef.current = channel;
        const receive = e => {
            if (e.data?.type !== 'state')
                return;
            if (!e.data.state || e.data.state.version !== 1)
                return;
            ref.current = e.data.state;
            setGame(e.data.state);
        };
        const onStorage = e => {
            if (e.key !== STORAGE_KEY || !e.newValue)
                return;
            try {
                const next = JSON.parse(e.newValue);
                if (next.version !== 1)
                    return;
                ref.current = next;
                setGame(next);
            }
            catch { }
        };
        channel?.addEventListener('message', receive);
        window.addEventListener('storage', onStorage);
        return () => { channel?.removeEventListener('message', receive); channel?.close(); window.removeEventListener('storage', onStorage); };
    }, []);
    const change = useCallback(fn => {
        const old = ref.current;
        const next = fn(old);
        if (next === old)
            return;
        ref.current = next;
        setGame(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        catch (e) {
            console.warn('Cannot persist game state.', e);
        }
        channelRef.current?.postMessage({ type: 'state', state: next });
    }, []);
    return [game, change];
}
function updateProgress(game, patch, eventKind) {
    const q = game.questions[game.roundIndex];
    if (!q)
        return game;
    const old = progressFor(game, q.id);
    return { ...game, progress: { ...game.progress, [q.id]: { ...old, ...patch } }, lastEvent: eventKind ? dispatchEvent(eventKind) : game.lastEvent };
}
function playCue(kind, ctx) {
    if (!ctx)
        return;
    const now = ctx.currentTime + 0.025;
    const note = (freq, start, duration, shape = 'sine', volume = .09) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = shape;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + .03);
    };
    if (kind === 'reveal') {
        note(523, now, .18);
        note(784, now + .12, .28);
    }
    if (kind === 'strike') {
        note(196, now, .21, 'sawtooth', .06);
        note(147, now + .18, .30, 'sawtooth', .06);
    }
    if (kind === 'award') {
        note(392, now, .18);
        note(523, now + .16, .18);
        note(659, now + .32, .18);
        note(784, now + .48, .42);
    }
    if (kind === 'next') {
        note(392, now, .09, 'triangle', .05);
    }
}
function useCue(lastEvent) {
    const [enabled, setEnabled] = useState(false);
    const audio = useRef(null), lastSeen = useRef(lastEvent?.nonce || null);
    useEffect(() => {
        if (!lastEvent?.nonce || lastSeen.current === lastEvent.nonce)
            return;
        lastSeen.current = lastEvent.nonce;
        if (Date.now() - lastEvent.stamp < 6000 && enabled) {
            try {
                playCue(lastEvent.kind, audio.current);
            }
            catch { }
        }
    }, [lastEvent, enabled]);
    async function toggle() {
        if (enabled) {
            setEnabled(false);
            return;
        }
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx)
                return;
            const ctx = audio.current ?? new Ctx();
            audio.current = ctx;
            await ctx.resume();
            setEnabled(true);
            playCue('next', ctx);
        }
        catch {
            setEnabled(false);
        }
    }
    return [enabled, toggle];
}
function PlayLabBrand({ onDark = false }) { return React.createElement("div", { className: 'brand ' + (onDark ? 'brand--dark' : '') },
    React.createElement("div", { className: "brand-mark" },
        "P",
        React.createElement("span", null, "\u2726")),
    React.createElement("div", null,
        React.createElement("strong", null, "PLAYLAB"),
        React.createElement("small", null, "GAMES FOR EVERY GATHERING"))); }
function RoundPill({ current, total, multiplier }) { return React.createElement("div", { className: "round-pill" },
    "RONDE ",
    React.createElement("b", null, String(current + 1).padStart(2, '0')),
    " ",
    React.createElement("span", null,
        "/ ",
        String(total).padStart(2, '0')),
    React.createElement("i", null, "\u00B7"),
    " ",
    React.createElement("strong", null,
        multiplier,
        "\u00D7 POIN")); }
function Stage({ game, preview = false, fullscreenAction, soundAction, soundEnabled }) {
    const q = game.questions[game.roundIndex];
    const p = progressFor(game, q?.id);
    const scores = getScores(game);
    const bank = p.awardedTeam === null ? sumBank(q, p) : p.awardedAmount;
    const revealed = p.revealed || [];
    const [flair, setFlair] = useState(null);
    const flairTimer = useRef();
    const seen = useRef(game.lastEvent?.nonce);
    useEffect(() => {
        const ev = game.lastEvent;
        if (!ev?.nonce || seen.current === ev.nonce)
            return;
        seen.current = ev.nonce;
        if (ev.kind === 'award' && Date.now() - ev.stamp < 5000) {
            setFlair({ team: game.teamNames[p.awardedTeam], points: p.awardedAmount, nonce: ev.nonce });
            clearTimeout(flairTimer.current);
            flairTimer.current = setTimeout(() => setFlair(null), 2700);
        }
        return () => clearTimeout(flairTimer.current);
    }, [game.lastEvent]);
    if (!q)
        return React.createElement("div", { className: "stage" }, "No questions yet.");
    return React.createElement("div", { className: 'stage ' + (preview ? 'stage--preview' : 'stage--full') },
        React.createElement("div", { className: "stage-glow stage-glow-left" }),
        React.createElement("div", { className: "stage-glow stage-glow-right" }),
        React.createElement("div", { className: "stage-inner" },
            React.createElement("div", { className: "stage-top" },
                React.createElement("div", { className: "stage-event-label" },
                    React.createElement("span", { className: "stage-mini-star" }, "\u2726"),
                    React.createElement("span", null, "PLAYLAB \u00B7 LIVE GAMES")),
                React.createElement("div", { className: "stage-headline" },
                    "SURVEY ",
                    React.createElement("em", null, "SHOWDOWN"),
                    React.createElement("span", { className: "stage-accent" }, "\u2726")),
                React.createElement(RoundPill, { current: game.roundIndex, total: game.questions.length, multiplier: q.multiplier }),
                !preview && React.createElement("div", { className: "display-actions" },
                    React.createElement("button", { className: "display-tool", onClick: soundAction, title: "Enable sound on this screen" },
                        soundEnabled ? React.createElement(Volume2, { size: 18 }) : React.createElement(VolumeX, { size: 18 }),
                        React.createElement("span", null, soundEnabled ? 'Sound on' : 'Enable sound')),
                    React.createElement("button", { className: "display-tool", onClick: fullscreenAction, title: "Go fullscreen" },
                        React.createElement(Maximize, { size: 18 }),
                        React.createElement("span", null, "Fullscreen")))),
            React.createElement("div", { className: "score-ribbon" }, [0, 1].map(team => React.createElement("div", { className: 'team-score team-score--' + team + (p.activeTeam === team && p.awardedTeam === null ? ' is-active' : '') + (p.awardedTeam === team ? ' is-winner' : ''), key: team },
                React.createElement("div", { className: "team-label" },
                    React.createElement("span", { className: "team-dot" }),
                    React.createElement("span", null, game.teamNames[team]),
                    p.activeTeam === team && p.awardedTeam === null && React.createElement("span", { className: "playing-pill" }, "MAIN"),
                    p.awardedTeam === team && React.createElement(Trophy, { size: 17 })),
                React.createElement("div", { className: "team-number" }, scores[team].toLocaleString('id-ID'))))),
            React.createElement("div", { className: "stage-question" },
                React.createElement("span", null,
                    "PERTANYAAN ",
                    String(game.roundIndex + 1).padStart(2, '0')),
                React.createElement("h1", null, q.question)),
            React.createElement("div", { className: 'stage-answer-grid ' + (q.answers.length >= 7 ? 'stage-answer-grid--dense' : '') }, q.answers.map((a, i) => React.createElement("div", { key: q.id + '-' + i, className: 'stage-answer ' + (revealed.includes(i) ? 'is-revealed' : 'is-hidden') },
                React.createElement("div", { className: "answer-number" }, String(i + 1).padStart(2, '0')),
                revealed.includes(i) ? React.createElement("div", { className: "answer-content", key: 'show-' + q.id + '-' + i }, a.text) : React.createElement("div", { className: "answer-mask" },
                    React.createElement("span", null),
                    React.createElement("span", null),
                    React.createElement("span", null),
                    React.createElement("span", null),
                    React.createElement("span", null)),
                React.createElement("div", { className: "answer-value" }, revealed.includes(i) ? a.points : '?')))),
            React.createElement("div", { className: "stage-foot" },
                React.createElement("div", { className: "strikes" },
                    React.createElement("span", { className: "foot-label" }, "KESALAHAN"),
                    React.createElement("div", { className: "strikes-set" }, [0, 1, 2].map(i => React.createElement("div", { className: 'strike ' + (i < p.strikes ? 'is-strike' : ''), key: i }, "\u2715")))),
                React.createElement("div", { className: "phase-indicator" }, p.awardedTeam !== null ? 'RONDE SELESAI' : p.phase === 'steal' ? 'KESEMPATAN MEREBUT POIN' : 'TEBAK JAWABAN TERPOPULER'),
                React.createElement("div", { className: "bank" },
                    React.createElement("span", { className: "foot-label" }, p.awardedTeam === null ? 'POIN TERKUMPUL' : 'POIN DIBERIKAN'),
                    React.createElement("div", { className: "bank-number" }, bank.toLocaleString('id-ID')))),
            React.createElement("div", { className: "stage-bottom-brand" },
                "A GAME BY PLAYLAB ",
                React.createElement("span", null, "\u2726"),
                " BUILT FOR CLASSROOMS & LIVE EVENTS")),
        flair && React.createElement("div", { className: "award-overlay", key: flair.nonce },
            React.createElement("div", { className: "award-burst" }, "\u2726 \u2726 \u2726"),
            React.createElement(Trophy, { size: 60 }),
            React.createElement("span", null, "SELAMAT!"),
            React.createElement("strong", null, flair.team),
            React.createElement("b", null,
                "+",
                flair.points,
                " POIN")));
}
function ControlCard({ title, description, children, extra }) { return React.createElement("section", { className: "control-card" },
    React.createElement("div", { className: "card-head" },
        React.createElement("div", null,
            React.createElement("h2", null, title),
            description && React.createElement("p", null, description)),
        extra),
    children); }
function IconButton({ icon: Icon, children, onClick, disabled = false, title = '', variant = '' }) { return React.createElement("button", { type: "button", title: title, disabled: disabled, onClick: onClick, className: 'btn ' + variant },
    React.createElement(Icon, { size: 17 }),
    children && React.createElement("span", null, children)); }
function HostApp({ game, change }) {
    const q = game.questions[game.roundIndex];
    const p = progressFor(game, q?.id), scores = getScores(game), bank = sumBank(q, p);
    const locked = p.awardedTeam !== null;
    const [editing, setEditing] = useState(false), [showHelp, setShowHelp] = useState(false), [notice, setNotice] = useState('');
    const fileRef = useRef(null);
    const notify = msg => { setNotice(msg); setTimeout(() => setNotice(''), 3600); };
    const goRound = i => change(old => ({ ...old, roundIndex: Math.max(0, Math.min(old.questions.length - 1, i)), lastEvent: dispatchEvent('next') }));
    const reveal = i => change(old => {
        const qq = old.questions[old.roundIndex], pp = progressFor(old, qq.id);
        if (pp.awardedTeam !== null)
            return old;
        const revealed = pp.revealed.includes(i) ? pp.revealed.filter(k => k !== i) : [...pp.revealed, i];
        return updateProgress(old, { revealed }, 'reveal');
    });
    const strike = (delta = 1) => change(old => {
        const qq = old.questions[old.roundIndex], pp = progressFor(old, qq.id);
        if (pp.awardedTeam !== null)
            return old;
        const strikes = Math.max(0, Math.min(3, pp.strikes + delta));
        const phase = strikes >= 3 ? 'steal' : 'play';
        return updateProgress(old, { strikes, phase }, delta > 0 ? 'strike' : null);
    });
    const chooseTeam = team => change(old => updateProgress(old, { activeTeam: team }));
    const award = team => change(old => {
        const qq = old.questions[old.roundIndex], pp = progressFor(old, qq.id);
        if (pp.awardedTeam !== null)
            return old;
        return updateProgress(old, { awardedTeam: team, awardedAmount: sumBank(qq, pp) }, 'award');
    });
    const undoAward = () => {
        if (!window.confirm('Undo this round’s award? The assigned points will be removed.'))
            return;
        change(old => updateProgress(old, { awardedTeam: null, awardedAmount: 0 }, 'next'));
    };
    const resetRound = () => {
        if (!window.confirm('Reset current round? Revealed answers, strikes and its awarded score will be lost.'))
            return;
        change(old => { const id = old.questions[old.roundIndex].id; const progress = { ...old.progress }; delete progress[id]; return { ...old, progress, lastEvent: dispatchEvent('next') }; });
    };
    const resetMatch = () => {
        if (!window.confirm('Reset the ENTIRE match? All team scores and round progress will be cleared. Questions and team names are kept.'))
            return;
        change(old => ({ ...old, roundIndex: 0, progress: {}, lastEvent: dispatchEvent('next') }));
        notify('Match scores and rounds reset.');
    };
    const revealAll = () => change(old => { const qq = old.questions[old.roundIndex], pp = progressFor(old, qq.id); return updateProgress(old, { revealed: qq.answers.map((_, i) => i) }, 'reveal'); });
    const exportData = () => {
        const blob = new Blob([JSON.stringify({ questions: game.questions }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url;
        a.download = 'playlab-survey-questions.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify('Question bank exported.');
    };
    const importData = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file)
            return;
        try {
            const raw = JSON.parse(await file.text());
            const questions = normalizeQuestions(raw);
            if (!window.confirm(`Import ${questions.length} questions? This replaces the existing question bank and clears all scores.`))
                return;
            change(old => ({ ...old, questions, roundIndex: 0, progress: {}, lastEvent: dispatchEvent('next') }));
            notify(`${questions.length} questions imported.`);
        }
        catch (e) {
            window.alert('Could not import questions: ' + e.message);
        }
    };
    useEffect(() => {
        const handle = e => {
            if (editing || showHelp || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || e.altKey || e.ctrlKey || e.metaKey)
                return;
            if (/^[1-8]$/.test(e.key)) {
                const i = Number(e.key) - 1;
                if (i < q.answers.length) {
                    e.preventDefault();
                    reveal(i);
                }
            }
            if (e.key.toLowerCase() === 'x') {
                e.preventDefault();
                strike();
            }
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                strike(-1);
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [q, editing, showHelp]);
    const [copyOkay, setCopyOkay] = useState(false);
    const displayUrl = new URL(location.href);
    displayUrl.searchParams.set('view', 'display');
    const openDisplay = () => window.open(displayUrl.toString(), 'playlab-survey-display');
    const copyDisplay = async () => { try {
        await navigator.clipboard.writeText(displayUrl.toString());
        setCopyOkay(true);
        setTimeout(() => setCopyOkay(false), 1500);
    }
    catch {
        window.prompt('Copy the display link:', displayUrl.toString());
    } };
    return React.createElement("div", { className: "host-shell" },
        React.createElement("header", { className: "host-header" },
            React.createElement(PlayLabBrand, null),
            React.createElement("div", { className: "host-header-right" },
                React.createElement("a", { className: "home-link", href: "./" }, "\u2190 Game library"),
                React.createElement("span", { className: "local-badge" },
                    React.createElement("span", null),
                    "LOCAL GAME MODE"),
                React.createElement(IconButton, { icon: CircleHelp, onClick: () => setShowHelp(true), variant: "btn-soft" }, "How to play"),
                React.createElement("button", { className: "btn btn-primary", onClick: openDisplay },
                    React.createElement(MonitorPlay, { size: 18 }),
                    " Open projector view ",
                    React.createElement(ArrowUpRight, { size: 15 })))),
        React.createElement("main", { className: "host-main" },
            React.createElement("div", { className: "intro" },
                React.createElement("div", null,
                    React.createElement("div", { className: "eyebrow" },
                        "EVENT TOOLKIT ",
                        React.createElement("span", null, " / "),
                        " MC CONTROL ROOM"),
                    React.createElement("h1", null,
                        "Let\u2019s play ",
                        React.createElement("em", null, "Survey Showdown.")),
                    React.createElement("p", null, "Your game, your questions, your stage. Control every reveal from here while the audience sees the big board.")),
                React.createElement("div", { className: "intro-status" },
                    React.createElement("span", { className: "live-dot" }),
                    " READY FOR THE STAGE")),
            React.createElement("div", { className: "host-grid" },
                React.createElement("div", { className: "host-primary" },
                    React.createElement("section", { className: "preview-section" },
                        React.createElement("div", { className: "section-head" },
                            React.createElement("div", null,
                                React.createElement("h2", null, "Live game preview"),
                                React.createElement("p", null, "What your audience sees on the projector")),
                            React.createElement("div", { className: "head-buttons" },
                                React.createElement(IconButton, { icon: Copy, onClick: copyDisplay, variant: "btn-soft" }, copyOkay ? 'Copied' : 'Copy display URL'),
                                React.createElement(IconButton, { icon: Expand, onClick: openDisplay, variant: "btn-soft" }, "Pop out"))),
                        React.createElement("div", { className: "preview-frame" },
                            React.createElement(Stage, { game: game, preview: true }))),
                    React.createElement(ControlCard, { title: "Reveal answers", description: "Click an answer to show it on the big board. Shortcuts: 1\u20138.", extra: React.createElement("span", { className: "small-count" },
                            p.revealed.length,
                            " / ",
                            q.answers.length,
                            " SHOWN") },
                        React.createElement("div", { className: "reveal-grid" }, q.answers.map((a, i) => React.createElement("button", { key: i, disabled: locked, className: 'reveal-button ' + (p.revealed.includes(i) ? 'reveal-button--on' : ''), onClick: () => reveal(i), title: `Keyboard: ${i + 1}` },
                            React.createElement("span", { className: "reveal-index" }, i + 1),
                            React.createElement("span", { className: "reveal-name" }, a.text),
                            React.createElement("strong", null,
                                a.points * q.multiplier,
                                " ",
                                React.createElement("small", null, "pts")),
                            p.revealed.includes(i) ? React.createElement(Eye, { size: 16 }) : React.createElement(EyeOff, { size: 16 })))),
                        React.createElement("div", { className: "minor-note" }, "Point values are sample survey-style data. Replace them with real survey results before your event.")),
                    React.createElement(ControlCard, { title: "Team scoreboard", description: "Rename teams to match your players. Score is assigned at the end of each round." },
                        React.createElement("div", { className: "team-editor-row" }, [0, 1].map(team => React.createElement("div", { key: team, className: 'team-editor team-editor--' + team },
                            React.createElement("label", { htmlFor: 'team-name-' + team },
                                "TEAM ",
                                team + 1),
                            React.createElement("input", { id: 'team-name-' + team, value: game.teamNames[team], maxLength: 45, onChange: e => change(old => ({ ...old, teamNames: old.teamNames.map((n, i) => i === team ? e.target.value : n) })) }),
                            React.createElement("strong", null, scores[team])))))),
                React.createElement("aside", { className: "host-sidebar" },
                    React.createElement(ControlCard, { title: "Round controls", description: "Choose the question and manage the live round." },
                        React.createElement("div", { className: "round-select-row" },
                            React.createElement("button", { className: "square-btn", disabled: game.roundIndex === 0, onClick: () => goRound(game.roundIndex - 1), "aria-label": "Previous round" },
                                React.createElement(ChevronLeft, null)),
                            React.createElement("select", { "aria-label": "Select round", value: game.roundIndex, onChange: e => goRound(Number(e.target.value)) }, game.questions.map((v, i) => React.createElement("option", { key: v.id, value: i },
                                "Round ",
                                i + 1,
                                " \u00B7 ",
                                v.multiplier,
                                "\u00D7 points"))),
                            React.createElement("button", { className: "square-btn", disabled: game.roundIndex === game.questions.length - 1, onClick: () => goRound(game.roundIndex + 1), "aria-label": "Next round" },
                                React.createElement(ChevronRight, null))),
                        React.createElement("div", { className: "current-phase" },
                            React.createElement("div", null,
                                React.createElement("span", null, "ROUND STATUS"),
                                React.createElement("strong", null, locked ? 'Finished' : p.phase === 'steal' ? 'Steal opportunity' : 'Playing')),
                            React.createElement("div", null,
                                React.createElement("span", null, "POINTS IN BANK"),
                                React.createElement("strong", null, locked ? p.awardedAmount : bank))),
                        React.createElement("div", { className: "active-team-label" }, "WHICH TEAM IS PLAYING?"),
                        React.createElement("div", { className: "active-team-selector" }, [0, 1].map(team => React.createElement("button", { disabled: locked, key: team, className: 'select-team select-team--' + team + (p.activeTeam === team ? ' selected' : ''), onClick: () => chooseTeam(team) },
                            p.activeTeam === team && React.createElement(Check, { size: 16 }),
                            " ",
                            game.teamNames[team]))),
                        React.createElement("div", { className: "divider-line" }),
                        React.createElement("div", { className: "active-team-label" }, "WRONG ANSWERS"),
                        React.createElement("div", { className: "strike-control" },
                            React.createElement("div", { className: "strike-preview" }, [0, 1, 2].map(i => React.createElement("b", { key: i, className: i < p.strikes ? 'live-strike' : '' }, "\u00D7"))),
                            React.createElement("div", { className: "strike-buttons" },
                                React.createElement("button", { disabled: locked || p.strikes === 0, className: "square-btn", onClick: () => strike(-1), title: "Undo strike (Z)" },
                                    React.createElement(Minus, { size: 18 })),
                                React.createElement("button", { disabled: locked || p.strikes === 3, className: "btn btn-danger", onClick: () => strike() },
                                    React.createElement(X, { size: 17 }),
                                    " Strike ",
                                    React.createElement("span", null, " (X)")))),
                        p.phase === 'steal' && !locked && React.createElement("div", { className: "steal-message" },
                            React.createElement(ShieldAlert, { size: 17 }),
                            " Three strikes! The opposing team has one chance to steal. The MC decides who gets the bank."),
                        React.createElement("div", { className: "divider-line" }),
                        React.createElement("div", { className: "active-team-label" }, "AWARD ROUND POINTS"),
                        React.createElement("div", { className: "award-buttons" }, [0, 1].map(team => React.createElement("button", { key: team, className: 'award-btn award-btn--' + team, disabled: locked, onClick: () => award(team) },
                            React.createElement(Trophy, { size: 18 }),
                            React.createElement("span", null,
                                "Award to",
                                React.createElement("br", null),
                                React.createElement("strong", null, game.teamNames[team])),
                            React.createElement(ArrowRight, { size: 17 })))),
                        locked && React.createElement("div", { className: "awarded-note" },
                            React.createElement(CheckCheck, { size: 18 }),
                            " ",
                            game.teamNames[p.awardedTeam],
                            " received ",
                            p.awardedAmount,
                            " points. ",
                            React.createElement("button", { onClick: undoAward }, "Undo award")),
                        React.createElement("div", { className: "divider-line" }),
                        React.createElement("button", { className: "btn btn-plain-wide", onClick: revealAll },
                            React.createElement(Eye, { size: 17 }),
                            " Reveal all remaining answers"),
                        React.createElement("button", { className: "btn btn-plain-wide", onClick: resetRound },
                            React.createElement(RotateCcw, { size: 17 }),
                            " Reset this round"),
                        React.createElement("button", { className: "btn btn-next", disabled: game.roundIndex === game.questions.length - 1, onClick: () => goRound(game.roundIndex + 1) },
                            "Next round ",
                            React.createElement(ArrowRight, { size: 18 }))),
                    React.createElement(ControlCard, { title: "Question bank", description: `${game.questions.length} editable rounds · JSON import/export` },
                        React.createElement("div", { className: "tool-grid" },
                            React.createElement("button", { className: "btn btn-tool", onClick: () => setEditing(true) },
                                React.createElement(Edit3, { size: 17 }),
                                " Edit questions"),
                            React.createElement("button", { className: "btn btn-tool", onClick: exportData },
                                React.createElement(Download, { size: 17 }),
                                " Export"),
                            React.createElement("button", { className: "btn btn-tool", onClick: () => fileRef.current?.click() },
                                React.createElement(FileUp, { size: 17 }),
                                " Import JSON"),
                            React.createElement("button", { className: "btn btn-tool", onClick: resetMatch },
                                React.createElement(RotateCcw, { size: 17 }),
                                " Reset match")),
                        React.createElement("input", { type: "file", hidden: true, ref: fileRef, accept: "application/json,.json", onChange: importData })),
                    React.createElement("div", { className: "setup-tip" },
                        React.createElement(Sparkles, { size: 18 }),
                        React.createElement("p", null,
                            React.createElement("strong", null, "Pro tip"),
                            React.createElement("br", null),
                            "Use two browser windows on the same laptop. Put the display window on the projector and keep this control room on your laptop screen.")))),
            React.createElement("footer", { className: "host-footer" },
                React.createElement("span", null, "PlayLab \u00B7 Independent interactive games collection \u00B7 v0.2"),
                React.createElement("span", null, "Runs entirely in your browser \u00B7 No participant accounts"))),
        notice && React.createElement("div", { role: "status", className: "toast" }, notice),
        editing && React.createElement(QuestionEditor, { questions: game.questions, onClose: () => setEditing(false), onSave: questions => { change(old => ({ ...old, questions, roundIndex: 0, progress: {}, lastEvent: dispatchEvent('next') })); setEditing(false); notify('Question bank updated; match scores reset.'); } }),
        showHelp && React.createElement("div", { className: "modal-backdrop", onClick: () => setShowHelp(false) },
            React.createElement("div", { className: "modal modal--help", role: "dialog", "aria-modal": "true", "aria-label": "How to play", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "modal-head" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "eyebrow" }, "HOST QUICK START"),
                        React.createElement("h2", null, "How to play")),
                    React.createElement("button", { className: "square-btn", onClick: () => setShowHelp(false), "aria-label": "Close" },
                        React.createElement(X, null))),
                React.createElement("ol", { className: "howto" },
                    React.createElement("li", null,
                        React.createElement("b", null, "Open projector view"),
                        " and move it to the external screen. Fullscreen it, and enable its sound if desired."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Pick the question"),
                        " and designate which team is playing."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Reveal matching answers"),
                        " by clicking answers or pressing keys 1\u20138. Their weighted points enter the bank."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Use X for wrong answers"),
                        " and Z to undo. At three strikes, give the other team a chance to steal."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Award the bank"),
                        " to whichever team wins. Then advance to the next round."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Replace sample questions"),
                        " with responses from a real survey before the public event.")),
                React.createElement("div", { className: "help-foot" },
                    React.createElement(Keyboard, { size: 18 }),
                    " Keyboard controls: ",
                    React.createElement("kbd", null, "1"),
                    "\u2013",
                    React.createElement("kbd", null, "8"),
                    " answers \u00B7 ",
                    React.createElement("kbd", null, "X"),
                    " strike \u00B7 ",
                    React.createElement("kbd", null, "Z"),
                    " undo"),
                React.createElement("button", { className: "btn btn-primary", onClick: () => setShowHelp(false) }, "Got it"))));
}
function QuestionEditor({ questions, onSave, onClose }) {
    const [items, setItems] = useState(() => structuredClone(questions));
    const [selected, setSelected] = useState(0), [error, setError] = useState('');
    const q = items[selected];
    const mutate = fn => setItems(old => fn(structuredClone(old)));
    const updateQ = (field, value) => mutate(old => { old[selected][field] = value; return old; });
    const updateA = (i, field, value) => mutate(old => { old[selected].answers[i][field] = value; return old; });
    const addRound = () => { mutate(old => [...old, { id: uid(), question: '', multiplier: 1, answers: [{ text: '', points: 50 }, { text: '', points: 50 }] }]); setSelected(items.length); setError(''); };
    const deleteRound = () => { if (items.length === 1) {
        setError('Keep at least one round.');
        return;
    } if (!window.confirm('Delete this question?'))
        return; mutate(old => old.filter((_, i) => i !== selected)); setSelected(Math.max(0, selected - 1)); setError(''); };
    const save = () => { try {
        const normalized = normalizeQuestions(items);
        onSave(normalized);
    }
    catch (e) {
        setError(e.message);
    } };
    return React.createElement("div", { className: "modal-backdrop", onClick: onClose },
        React.createElement("div", { className: "modal editor-modal", role: "dialog", "aria-modal": "true", "aria-label": "Edit question bank", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "modal-head" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "CONTENT STUDIO"),
                    React.createElement("h2", null, "Edit question bank"),
                    React.createElement("p", null, "Update questions and points without touching the code.")),
                React.createElement("button", { className: "square-btn", onClick: onClose, "aria-label": "Close" },
                    React.createElement(X, null))),
            React.createElement("div", { className: "editor-layout" },
                React.createElement("div", { className: "editor-list" },
                    items.map((item, i) => React.createElement("button", { key: item.id, onClick: () => { setSelected(i); setError(''); }, className: 'editor-list-item ' + (i === selected ? 'current' : '') },
                        React.createElement("small", null,
                            "ROUND ",
                            String(i + 1).padStart(2, '0')),
                        React.createElement("span", null, item.question || 'Untitled question'),
                        React.createElement("i", null,
                            item.multiplier,
                            "\u00D7"))),
                    React.createElement("button", { className: "add-round", onClick: addRound },
                        React.createElement(Plus, { size: 18 }),
                        " Add question")),
                React.createElement("div", { className: "editor-form" },
                    React.createElement("label", { htmlFor: "editor-question" }, "QUESTION"),
                    React.createElement("textarea", { id: "editor-question", value: q.question, rows: 3, maxLength: 240, placeholder: "Sebutkan...", onChange: e => updateQ('question', e.target.value) }),
                    React.createElement("div", { className: "editor-multi" },
                        React.createElement("label", { htmlFor: "editor-multiplier" }, "POINT MULTIPLIER"),
                        React.createElement("select", { id: "editor-multiplier", value: q.multiplier, onChange: e => updateQ('multiplier', Number(e.target.value)) },
                            React.createElement("option", { value: 1 }, "1\u00D7 \u2014 normal round"),
                            React.createElement("option", { value: 2 }, "2\u00D7 \u2014 double points"),
                            React.createElement("option", { value: 3 }, "3\u00D7 \u2014 triple points"))),
                    React.createElement("div", { className: "answer-editor-label" },
                        React.createElement("label", null, "ANSWERS & SURVEY POINTS"),
                        React.createElement("span", null,
                            q.answers.reduce((s, a) => s + (Number(a.points) || 0), 0),
                            " base points total (100 recommended)")),
                    React.createElement("div", { className: "editor-answer-rows" }, q.answers.map((a, i) => React.createElement("div", { className: "editor-answer-row", key: i },
                        React.createElement("span", null, String(i + 1).padStart(2, '0')),
                        React.createElement("input", { "aria-label": 'Answer ' + (i + 1), placeholder: "Answer text", maxLength: 70, value: a.text, onChange: e => updateA(i, 'text', e.target.value) }),
                        React.createElement("input", { "aria-label": 'Points for answer ' + (i + 1), type: "number", min: "1", max: "100", step: "1", value: a.points, onChange: e => updateA(i, 'points', e.target.value) }),
                        React.createElement("button", { disabled: q.answers.length <= 2, "aria-label": 'Remove answer ' + (i + 1), title: "Remove answer", className: "remove-answer", onClick: () => mutate(old => { old[selected].answers.splice(i, 1); return old; }) },
                            React.createElement(Trash2, { size: 16 }))))),
                    React.createElement("div", { className: "editor-form-bottom" },
                        React.createElement("button", { className: "btn btn-tool", disabled: q.answers.length >= 8, onClick: () => mutate(old => { old[selected].answers.push({ text: '', points: 1 }); return old; }) },
                            React.createElement(Plus, { size: 17 }),
                            " Add answer"),
                        React.createElement("button", { className: "btn btn-delete", onClick: deleteRound },
                            React.createElement(Trash2, { size: 16 }),
                            " Delete round")))),
            error && React.createElement("div", { role: "alert", className: "form-error" },
                React.createElement(ShieldAlert, { size: 17 }),
                error),
            React.createElement("div", { className: "modal-footer" },
                React.createElement("div", null,
                    React.createElement(ShieldAlert, { size: 16 }),
                    " Saving changes clears the current match scores."),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn btn-soft", onClick: onClose }, "Cancel"),
                    React.createElement("button", { className: "btn btn-primary", onClick: save },
                        React.createElement(Save, { size: 17 }),
                        " Save questions")))));
}
function DisplayApp({ game }) {
    const ref = useRef(null);
    const [soundEnabled, toggleSound] = useCue(game.lastEvent);
    const full = () => { const el = ref.current; if (!document.fullscreenElement) {
        el?.requestFullscreen?.().catch(() => { });
    }
    else {
        document.exitFullscreen?.();
    } };
    return React.createElement("main", { className: "display-view", ref: ref },
        React.createElement(Stage, { game: game, fullscreenAction: full, soundAction: toggleSound, soundEnabled: soundEnabled }));
}
// Game 2: a separate classroom-friendly trivia game. All state stays local to this browser.
const QUICKFIRE_KEY = 'playlab-quickfire-state-v1';
const QUICKFIRE_CHANNEL = 'playlab-quickfire-sync-v1';
const QUICKFIRE_QUESTIONS = [
    { id: 't1', question: 'Planet manakah yang paling dekat dengan Matahari?', options: ['Venus', 'Bumi', 'Merkurius', 'Mars'], answer: 2, explanation: 'Merkurius adalah planet terdekat dari Matahari.' },
    { id: 't2', question: 'Manakah di antara berikut ini yang merupakan bilangan prima?', options: ['15', '17', '21', '27'], answer: 1, explanation: '17 hanya dapat dibagi habis oleh 1 dan 17.' },
    { id: 't3', question: 'Apa kepanjangan dari CPU dalam komputer?', options: ['Central Processing Unit', 'Computer Power Utility', 'Central Program User', 'Control Processing Upload'], answer: 0, explanation: 'CPU adalah Central Processing Unit.' },
    { id: 't4', question: 'Pada tekanan sekitar 1 atmosfer, air murni mendidih pada suhu berapa?', options: ['80°C', '90°C', '100°C', '110°C'], answer: 2, explanation: 'Pada tekanan 1 atm, air murni mendidih sekitar 100°C.' },
    { id: 't5', question: 'Format file mana yang biasa digunakan untuk tabel data berbasis teks?', options: ['PNG', 'MP3', 'CSV', 'MP4'], answer: 2, explanation: 'CSV menyimpan data tabular dalam format teks.' },
    { id: 't6', question: 'Dalam grafik batang, tinggi batang biasanya mewakili apa?', options: ['Warna kategori', 'Nilai kategori', 'Urutan huruf', 'Ukuran font'], answer: 1, explanation: 'Panjang atau tinggi batang menyatakan nilai data.' }
];
function quickfireInitial() {
    return { version: 1, questions: structuredClone(QUICKFIRE_QUESTIONS), questionIndex: 0, teamNames: ['Team A', 'Team B'], scores: [0, 0], revealed: {}, lastAward: null };
}
function useQuickfire() {
    const read = () => { try {
        const val = JSON.parse(localStorage.getItem(QUICKFIRE_KEY));
        return val?.version === 1 && Array.isArray(val.questions) && val.questions.length && val.scores?.length === 2 ? val : quickfireInitial();
    }
    catch {
        return quickfireInitial();
    } };
    const [state, setState] = useState(read), ref = useRef(state), ch = useRef(null);
    useEffect(() => {
        const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(QUICKFIRE_CHANNEL) : null;
        ch.current = channel;
        const apply = next => { if (next?.version === 1) {
            ref.current = next;
            setState(next);
        } };
        const onMessage = e => { if (e.data?.type === 'quickfire')
            apply(e.data.state); };
        const onStorage = e => { if (e.key === QUICKFIRE_KEY && e.newValue) {
            try {
                apply(JSON.parse(e.newValue));
            }
            catch { }
        } };
        channel?.addEventListener('message', onMessage);
        window.addEventListener('storage', onStorage);
        return () => { channel?.removeEventListener('message', onMessage); channel?.close(); window.removeEventListener('storage', onStorage); };
    }, []);
    const change = useCallback(fn => {
        const next = fn(ref.current);
        if (next === ref.current)
            return;
        ref.current = next;
        setState(next);
        try {
            localStorage.setItem(QUICKFIRE_KEY, JSON.stringify(next));
        }
        catch { }
        ch.current?.postMessage({ type: 'quickfire', state: next });
    }, []);
    return [state, change];
}
function QuickfireBoard({ game, preview = false }) {
    const q = game.questions[game.questionIndex], visible = game.revealed[q.id] || false;
    return React.createElement("div", { className: 'quick-board ' + (preview ? 'quick-board--preview' : '') },
        React.createElement("div", { className: "quick-stars" },
            "\u2726 ",
            React.createElement("span", null, "PLAYLAB \u00B7 QUICKFIRE QUIZ"),
            " \u2726"),
        React.createElement("div", { className: "quick-head" },
            React.createElement("h1", null,
                "QUICKFIRE ",
                React.createElement("em", null, "QUIZ")),
            React.createElement("div", { className: "quick-counter" },
                "QUESTION ",
                String(game.questionIndex + 1).padStart(2, '0'),
                " / ",
                game.questions.length)),
        React.createElement("div", { className: "quick-scores" }, [0, 1].map(i => React.createElement("div", { key: i },
            React.createElement("span", null, game.teamNames[i]),
            React.createElement("strong", null, game.scores[i])))),
        React.createElement("div", { className: "quick-question" }, q.question),
        React.createElement("div", { className: "quick-options" }, q.options.map((choice, i) => React.createElement("div", { key: i, className: 'quick-option ' + (visible ? (i === q.answer ? 'correct' : 'muted') : '') },
            React.createElement("span", null, 'ABCD'[i]),
            React.createElement("strong", null, choice),
            visible && i === q.answer && React.createElement(Check, { size: 27 })))),
        React.createElement("div", { className: "quick-footer" }, visible ? React.createElement("span", { className: "quick-explanation" }, q.explanation || 'Correct answer highlighted.') : React.createElement("span", null, "Discuss with your team. The host will reveal the answer.")));
}
function QuickfireHost({ game, change }) {
    const q = game.questions[game.questionIndex], visible = game.revealed[q.id] || false;
    const [editor, setEditor] = useState(false), [draft, setDraft] = useState(''), [error, setError] = useState('');
    const setQuestion = n => change(old => ({ ...old, questionIndex: Math.max(0, Math.min(old.questions.length - 1, n)) }));
    const reveal = () => change(old => ({ ...old, revealed: { ...old.revealed, [q.id]: !visible } }));
    const award = (team, points) => change(old => ({ ...old, scores: old.scores.map((v, i) => i === team ? Math.max(0, v + points) : v) }));
    const openEditor = () => { setDraft(JSON.stringify({ questions: game.questions }, null, 2)); setError(''); setEditor(true); };
    const saveEditor = () => {
        try {
            const raw = JSON.parse(draft), questions = raw.questions;
            if (!Array.isArray(questions) || questions.length < 1 || questions.length > 60)
                throw Error('Provide 1–60 questions.');
            const clean = questions.map((item, i) => {
                if (!item || typeof item.question !== 'string' || !item.question.trim() || item.question.length > 250)
                    throw Error(`Question ${i + 1}: invalid question text.`);
                if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some(x => typeof x !== 'string' || !x.trim() || x.length > 110))
                    throw Error(`Question ${i + 1}: provide exactly four options.`);
                if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3)
                    throw Error(`Question ${i + 1}: answer must be 0, 1, 2, or 3.`);
                return { id: `t-${i + 1}`, question: item.question.trim(), options: item.options.map(x => x.trim()), answer: item.answer, explanation: String(item.explanation || '').slice(0, 250) };
            });
            if (!window.confirm('Replace all trivia questions and reset the match?'))
                return;
            change(old => ({ ...old, questions: clean, questionIndex: 0, revealed: {}, scores: [0, 0] }));
            setEditor(false);
        }
        catch (err) {
            setError(err.message);
        }
    };
    const exportQuestions = () => {
        const blob = new Blob([JSON.stringify({ questions: game.questions }, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url;
        a.download = 'playlab-quickfire-questions.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const displayUrl = new URL(location.href);
    displayUrl.searchParams.set('view', 'display');
    return React.createElement("div", { className: "host-shell" },
        React.createElement("header", { className: "host-header" },
            React.createElement(PlayLabBrand, null),
            React.createElement("div", { className: "host-header-right" },
                React.createElement("a", { className: "home-link", href: "./" }, "\u2190 Game library"),
                React.createElement("button", { className: "btn btn-primary", onClick: () => window.open(displayUrl.toString(), 'playlab-quickfire-display') },
                    React.createElement(MonitorPlay, { size: 17 }),
                    " Open projector ",
                    React.createElement(ArrowUpRight, { size: 14 })))),
        React.createElement("main", { className: "host-main" },
            React.createElement("div", { className: "intro" },
                React.createElement("div", null,
                    React.createElement("div", { className: "eyebrow" }, "CLASSROOM & EVENT TOOLKIT / HOST CONTROL ROOM"),
                    React.createElement("h1", null,
                        "Let\u2019s play ",
                        React.createElement("em", null, "Quickfire Quiz.")),
                    React.createElement("p", null, "Reveal multiple-choice answers, award team points, and take the whole game to a projector."))),
            React.createElement("div", { className: "quick-layout" },
                React.createElement("section", { className: "preview-section" },
                    React.createElement("div", { className: "section-head" },
                        React.createElement("div", null,
                            React.createElement("h2", null, "Audience preview"),
                            React.createElement("p", null, "The question and options shown on the projector"))),
                    React.createElement("div", { className: "preview-frame" },
                        React.createElement(QuickfireBoard, { game: game, preview: true }))),
                React.createElement("aside", { className: "quick-controls" },
                    React.createElement(ControlCard, { title: "Question control", description: "Run the round from this screen." },
                        React.createElement("div", { className: "quick-nav" },
                            React.createElement("button", { className: "btn btn-soft", disabled: game.questionIndex === 0, onClick: () => setQuestion(game.questionIndex - 1) },
                                React.createElement(ChevronLeft, { size: 17 }),
                                " Previous"),
                            React.createElement("span", null,
                                game.questionIndex + 1,
                                " / ",
                                game.questions.length),
                            React.createElement("button", { className: "btn btn-soft", disabled: game.questionIndex === game.questions.length - 1, onClick: () => setQuestion(game.questionIndex + 1) },
                                "Next ",
                                React.createElement(ChevronRight, { size: 17 }))),
                        React.createElement("h3", { className: "quick-control-question" }, q.question),
                        React.createElement("p", { className: "quick-correct-hint" },
                            "Answer: ",
                            'ABCD'[q.answer],
                            " \u00B7 ",
                            q.options[q.answer]),
                        React.createElement("button", { className: "btn btn-primary quick-main-action", onClick: reveal },
                            visible ? React.createElement(EyeOff, { size: 17 }) : React.createElement(Eye, { size: 17 }),
                            " ",
                            visible ? 'Hide answer' : 'Reveal correct answer')),
                    React.createElement(ControlCard, { title: "Team points", description: "Manually award or remove 10 points per correct response." }, [0, 1].map(i => React.createElement("div", { className: "quick-team-editor", key: i },
                        React.createElement("input", { "aria-label": `Team ${i + 1} name`, maxLength: 45, value: game.teamNames[i], onChange: e => change(old => ({ ...old, teamNames: old.teamNames.map((n, j) => i === j ? e.target.value : n) })) }),
                        React.createElement("strong", null, game.scores[i]),
                        React.createElement("button", { className: "square-btn", onClick: () => award(i, -10), "aria-label": `Subtract ten points from team ${i + 1}` },
                            React.createElement(Minus, { size: 16 })),
                        React.createElement("button", { className: "square-btn", onClick: () => award(i, 10), "aria-label": `Add ten points to team ${i + 1}` },
                            React.createElement(Plus, { size: 16 }))))),
                    React.createElement(ControlCard, { title: "Question bank", description: "Editable JSON for reusable lesson and event sets." },
                        React.createElement("div", { className: "tool-grid" },
                            React.createElement("button", { className: "btn btn-tool", onClick: openEditor },
                                React.createElement(Edit3, { size: 17 }),
                                " Edit / import"),
                            React.createElement("button", { className: "btn btn-tool", onClick: exportQuestions },
                                React.createElement(Download, { size: 17 }),
                                " Export"),
                            React.createElement("button", { className: "btn btn-tool", onClick: () => { if (window.confirm('Reset team points and answer reveals?'))
                                    change(old => ({ ...old, scores: [0, 0], questionIndex: 0, revealed: {} })); } },
                                React.createElement(RotateCcw, { size: 17 }),
                                " Reset match"))))),
            React.createElement("footer", { className: "host-footer" },
                React.createElement("span", null, "PlayLab \u00B7 Quickfire Quiz v0.2"),
                React.createElement("span", null, "Local-only state \u00B7 Use the same browser profile for host and projector"))),
        editor && React.createElement("div", { className: "modal-backdrop", onClick: () => setEditor(false) },
            React.createElement("div", { className: "modal quick-editor", role: "dialog", "aria-modal": "true", "aria-label": "Edit trivia questions", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "modal-head" },
                    React.createElement("div", null,
                        React.createElement("h2", null, "Quickfire question editor"),
                        React.createElement("p", null, "Each question has four options. The correct answer is a zero-based index (0\u20133).")),
                    React.createElement("button", { className: "square-btn", onClick: () => setEditor(false), "aria-label": "Close" },
                        React.createElement(X, null))),
                React.createElement("div", { className: "quick-editor-body" },
                    React.createElement("label", { htmlFor: "json-editor" }, "Paste or edit a JSON question bank"),
                    React.createElement("textarea", { id: "json-editor", spellCheck: false, value: draft, onChange: e => setDraft(e.target.value) }),
                    error && React.createElement("p", { role: "alert", className: "form-error" }, error)),
                React.createElement("div", { className: "modal-footer" },
                    React.createElement("span", null, "Saving replaces the bank and resets scores."),
                    React.createElement("div", null,
                        React.createElement("button", { className: "btn btn-soft", onClick: () => setEditor(false) }, "Cancel"),
                        React.createElement("button", { className: "btn btn-primary", onClick: saveEditor }, "Save questions"))))));
}
function QuickfireApp() {
    const [game, change] = useQuickfire();
    const ref = useRef(null);
    const display = new URLSearchParams(location.search).get('view') === 'display';
    if (display)
        return React.createElement("main", { className: "display-view", ref: ref },
            React.createElement("div", { className: "quick-full-actions" },
                React.createElement("button", { onClick: () => document.fullscreenElement ? document.exitFullscreen() : ref.current?.requestFullscreen?.() },
                    React.createElement(Maximize, { size: 16 }),
                    " Fullscreen")),
            React.createElement(QuickfireBoard, { game: game }));
    return React.createElement(QuickfireHost, { game: game, change: change });
}
const CATALOG = [
    { slug: 'survey', number: '01', title: 'Survey Showdown', category: 'Survey & team play', description: 'Guess the top answers, reveal survey points and steal the round.', badge: 'Playable', icon: '✦' },
    { slug: 'quickfire', number: '02', title: 'Quickfire Quiz', category: 'Trivia & learning', description: 'Multiple-choice trivia with answer reveals and team scoring.', badge: 'Playable', icon: '⚡' },
    { slug: null, number: '03', title: 'Word Relay', category: 'Team vocabulary', description: 'A fast-paced word-building challenge for groups.', badge: 'Planned', icon: '◈' },
    { slug: null, number: '04', title: 'Buzzer Battle', category: 'Speed & knowledge', description: 'Race to buzz in, claim a question and earn points.', badge: 'Planned', icon: '◎' }
];
function GameHub() {
    return React.createElement("div", { className: "hub-shell" },
        React.createElement("header", { className: "hub-header" },
            React.createElement(PlayLabBrand, null),
            React.createElement("div", { className: "hub-header-tag" },
                React.createElement("span", { className: "hub-status-dot" }),
                " A collection of games for real people, in real rooms.")),
        React.createElement("main", { className: "hub-main" },
            React.createElement("section", { className: "hub-hero" },
                React.createElement("div", { className: "hub-eyebrow" },
                    "INTERACTIVE GAME COLLECTION ",
                    React.createElement("span", null, " / "),
                    " VERSION 0.2"),
                React.createElement("h1", null,
                    "Make every room",
                    React.createElement("br", null),
                    React.createElement("em", null, "come alive.")),
                React.createElement("p", null, "Host-led games built for classrooms, workshops, gatherings and community events. No accounts, no complexity \u2014 just a laptop, a screen, and people ready to play."),
                React.createElement("div", { className: "hub-hero-actions" },
                    React.createElement("a", { href: "?game=survey", className: "hub-button hub-button--primary" },
                        "Play Survey Showdown ",
                        React.createElement(ArrowUpRight, { size: 18 })),
                    React.createElement("a", { href: "#games", className: "hub-button hub-button--secondary" },
                        "Explore all games ",
                        React.createElement(ArrowRight, { size: 18 }))),
                React.createElement("div", { className: "hub-hero-facts" },
                    React.createElement("span", null,
                        React.createElement(MonitorPlay, { size: 16 }),
                        " Projector-ready"),
                    React.createElement("span", null,
                        React.createElement(Gamepad2, { size: 16 }),
                        " Host-controlled"),
                    React.createElement("span", null,
                        React.createElement(Lock, { size: 16 }),
                        " No sign-in"))),
            React.createElement("section", { className: "hub-games", id: "games" },
                React.createElement("div", { className: "hub-section-head" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "hub-eyebrow" }, "THE COLLECTION"),
                        React.createElement("h2", null, "Choose your game")),
                    React.createElement("p", null, "Two working games. More formats in development.")),
                React.createElement("div", { className: "hub-card-grid" }, CATALOG.map(item => React.createElement("article", { className: 'hub-game-card ' + (!item.slug ? 'hub-game-card--planned' : ''), key: item.number },
                    React.createElement("div", { className: "hub-card-top" },
                        React.createElement("span", null,
                            "GAME ",
                            item.number),
                        React.createElement("span", { className: 'hub-game-status ' + (item.slug ? 'is-ready' : '') }, item.badge)),
                    React.createElement("div", { className: "hub-game-glyph", "aria-hidden": "true" }, item.icon),
                    React.createElement("div", { className: "hub-game-category" }, item.category),
                    React.createElement("h3", null, item.title),
                    React.createElement("p", null, item.description),
                    item.slug ? React.createElement("a", { href: '?game=' + item.slug, className: "hub-card-link" },
                        "Open game ",
                        React.createElement(ArrowUpRight, { size: 18 })) : React.createElement("span", { className: "hub-card-later" }, "Coming in a later release"))))),
            React.createElement("section", { className: "hub-how" },
                React.createElement("div", null,
                    React.createElement("div", { className: "hub-eyebrow" }, "DESIGNED FOR IN-PERSON MOMENTS"),
                    React.createElement("h2", null,
                        "One laptop.",
                        React.createElement("br", null),
                        "A room full of energy.")),
                React.createElement("div", { className: "hub-steps" },
                    React.createElement("div", null,
                        React.createElement("b", null, "01"),
                        React.createElement("span", null, "Pick a game and customize its questions.")),
                    React.createElement("div", null,
                        React.createElement("b", null, "02"),
                        React.createElement("span", null, "Open a separate audience window on a projector.")),
                    React.createElement("div", null,
                        React.createElement("b", null, "03"),
                        React.createElement("span", null, "Control reveals, scores and rounds from the host screen.")))),
            React.createElement("footer", { className: "hub-footer" },
                React.createElement("div", null,
                    React.createElement("strong", null, "PLAYLAB"),
                    React.createElement("span", null, "Interactive games, independently built.")),
                React.createElement("span", null, "Portfolio project \u00B7 Prototype v0.2 \u00B7 Example scores are fictional"))));
}
function SurveyGame() { const [game, change] = useGame(); return IS_DISPLAY ? React.createElement(DisplayApp, { game: game }) : React.createElement(HostApp, { game: game, change: change }); }
function App() {
    useEffect(() => { if ('serviceWorker' in navigator && true) {
        navigator.serviceWorker.register(new URL('sw.js', location.href)).catch(err => console.warn('Offline registration unsuccessful', err));
    } }, []);
    const params = new URLSearchParams(location.search), selected = params.get('game');
    if (selected === 'quickfire')
        return React.createElement(QuickfireApp, null);
    if (selected === 'survey')
        return React.createElement(SurveyGame, null);
    return React.createElement(GameHub, null);
}
createRoot(document.getElementById('root')).render(React.createElement(App, null));
