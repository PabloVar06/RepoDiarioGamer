import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { videojuegosApi } from "./api/videojuegosApi";
import { partidasApi } from "./api/partidasApi";
import type { Videojuego, Partida, Resumen } from "./tipos";
import "./index.css";
import gsap from "gsap";

const plataformas = ["PC", "PlayStation", "Xbox", "Switch", "Movil"];
const generos = ["Accion", "Rol", "Estrategia", "Puzzle", "Deportes", "Terror", "Otro"];
const estados = ["Jugando", "Pausado", "Completado", "Abandonado"];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? "bg-white/10 text-white shadow-blueglow" : "text-white/55 hover:bg-white/5 hover:text-white"
  }`;

function pillClass(estado: string) {
  const tones: Record<string, string> = {
    Jugando: "bg-gamer-green/15 text-gamer-green border-gamer-green/35",
    Completado: "bg-gamer-blue/15 text-[#9dc4ff] border-gamer-blue/35",
    Pausado: "bg-gamer-yellow/15 text-gamer-yellow border-gamer-yellow/35",
    Abandonado: "bg-gamer-orange/15 text-[#ffad81] border-gamer-orange/35",
  };
  return `inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[estado] ?? "border-white/15 bg-white/10"}`;
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gamer-surface p-3 text-white md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1580px] gap-4 md:min-h-[calc(100vh-2.5rem)]">
        <aside className="hidden w-56 shrink-0 flex-col md:flex">
          <Link to="/" className="mb-8 font-display text-2xl font-black tracking-tight">
            SAVE<span className="text-gamer-orange">POINT</span>
          </Link>
          <nav className="flex flex-col gap-1">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gamer-yellow">Launcher</p>
            <NavLink to="/" end className={navClass}>Videojuegos</NavLink>
            <NavLink to="/partidas" className={navClass}>Partidas</NavLink>
            <NavLink to="/videojuegos/nuevo" className="mt-3 flex items-center rounded-xl bg-gamer-orange px-3 py-2.5 text-sm font-semibold text-white shadow-orangeglow transition hover:brightness-110">
              + Añadir juego
            </NavLink>
          </nav>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-display text-xs font-extrabold uppercase tracking-wider text-white/90">Diario de progreso gamer</p>
            <p className="mt-1 text-xs text-white/50">Tu aventura, tus estadísticas.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-launcher border border-white/10 bg-[#262425] shadow-float">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:hidden">
            <Link to="/" className="font-display text-lg font-black">SAVE<span className="text-gamer-orange">POINT</span></Link>
            <nav className="flex items-center gap-2 text-xs font-semibold">
              <Link to="/" className="text-white/70">Videojuegos</Link>
              <Link to="/partidas" className="text-white/70">Partidas</Link>
              <Link to="/videojuegos/nuevo" className="rounded-lg bg-gamer-orange px-2.5 py-1.5 text-white">+ Añadir</Link>
            </nav>
          </header>
          <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Estados({ loading, error, empty }: { loading: boolean; error: string; empty: boolean }) {
  if (loading) return <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">Cargando datos…</p>;
  if (error) return <p className="rounded-2xl border border-gamer-orange/50 bg-gamer-orange/10 px-4 py-3 text-sm text-[#ffac80]">{error}</p>;
  if (empty) return <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">Todavía no hay datos. ¡Añade el primero!</p>;
  return null;
}

function ListaJuegos() {
  const [items, setItems] = useState<Videojuego[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cargar = () => {
    setLoading(true);
    setError("");
    videojuegosApi.listar(filtro).then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(cargar, 200);
    return () => clearTimeout(t);
  }, [filtro]);
  async function borrar(id: string) {
    if (!confirm("¿Eliminar este videojuego y sus partidas?")) return;
    try {
      await videojuegosApi.eliminar(id);
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="mb-6">
        <input
          aria-label="Filtrar videojuegos"
          placeholder="Buscar por nombre…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full rounded-full border border-white/10 bg-black/25 px-5 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-gamer-blue focus:shadow-blueglow"
        />
      </div>
      <section className="hero relative mb-10 overflow-hidden rounded-launcher border border-white/10 bg-gradient-to-br from-[#4a3a32] via-gamer-surface to-[#1e2a44] p-8 shadow-float md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(58,134,255,.35),transparent_36%),radial-gradient(circle_at_12%_88%,rgba(251,86,7,.22),transparent_42%)]" />
        <div className="relative max-w-xl">
          <p className="eyebrow mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">TU COLECCIÓN · TU HISTORIA</p>
          <h1 className="font-display text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Tu próxima partida<br />
            <em className="not-italic text-gamer-orange">empieza aquí.</em>
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70 md:text-base">Registra tus sesiones, sigue tu progreso y celebra cada logro.</p>
          <Link to="/videojuegos/nuevo" className="button mt-6 inline-flex rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow transition hover:brightness-110">
            + Añadir juego
          </Link>
        </div>
      </section>
      <div className="sectionhead mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">BIBLIOTECA</p>
          <h2 className="font-display text-2xl font-extrabold">Mis videojuegos</h2>
        </div>
      </div>
      <Estados loading={loading} error={error} empty={!loading && !error && !items.length} />
      <div className="cards grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((j) => (
          <article className="gamecard overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-float" key={j._id}>
            <div className="gamecover relative flex aspect-[16/10] items-end bg-gradient-to-br from-gamer-blue/70 via-[#3a3839] to-gamer-surface p-4">
              <span className="absolute left-4 top-4 font-display text-5xl font-black text-white/90">{j.nombre.slice(0, 1).toUpperCase()}</span>
              <small className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">{j.plataforma}</small>
            </div>
            <div className="gameinfo space-y-2 p-4">
              <span className={pillClass(j.estado)}>{j.estado}</span>
              <h3 className="font-display text-lg font-extrabold leading-tight">{j.nombre}</h3>
              <p className="text-sm text-white/55">{j.genero} · {j.logros.filter((l) => l.obtenido).length}/{j.logros.length} logros</p>
              <div className="actions flex flex-wrap items-center gap-3 pt-1">
                <Link className="button rounded-full bg-gamer-orange px-3 py-1.5 text-xs font-bold shadow-orangeglow" to={`/videojuegos/${j._id}`}>Ver progreso ↗</Link>
                <Link className="text-sm font-semibold text-gamer-blue" to={`/videojuegos/${j._id}/editar`}>Editar</Link>
                <button className="text-sm font-semibold text-gamer-yellow hover:text-gamer-orange" onClick={() => borrar(j._id)}>Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function FormJuego() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [plataforma, setPlataforma] = useState("PC");
  const [genero, setGenero] = useState("Accion");
  const [estado, setEstado] = useState("Jugando");
  const [logros, setLogros] = useState("");
  const [juegoOriginal, setJuegoOriginal] = useState<Videojuego | null>(null);
  useEffect(() => {
    if (id)
      videojuegosApi
        .obtener(id)
        .then((j) => {
          setJuegoOriginal(j);
          setNombre(j.nombre);
          setPlataforma(j.plataforma);
          setGenero(j.genero);
          setEstado(j.estado);
          setLogros(j.logros.map((l) => `${l.nombre}${l.descripcion ? "|" + l.descripcion : ""}`).join("\n"));
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [id]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const data = {
      nombre,
      plataforma,
      genero,
      estado,
      logros: logros
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const [nombre, descripcion = ""] = s.split("|");
          const anterior = id ? juegoOriginal?.logros.find((l) => l.nombre === nombre) : undefined;
          return { nombre, descripcion, obtenido: anterior?.obtenido ?? false };
        }),
    };
    try {
      const j = id ? await videojuegosApi.actualizar(id, data) : await videojuegosApi.crear(data);
      nav(`/videojuegos/${j._id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const field = "mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-gamer-blue";
  return (
    <section className="formpage mx-auto max-w-2xl">
      <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">BIBLIOTECA / {id ? "EDITAR" : "NUEVO"}</p>
      <h1 className="mb-6 font-display text-3xl font-black">{id ? "Editar videojuego" : "Añadir videojuego"}</h1>
      <Estados loading={loading} error={error} empty={false} />
      <form onSubmit={submit} className="form space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-float md:p-8">
        <label className="block text-sm font-semibold">Nombre<input className={field} required maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. The Legend of Zelda" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Plataforma<select className={field} value={plataforma} onChange={(e) => setPlataforma(e.target.value)}>{plataformas.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block text-sm font-semibold">Género<select className={field} value={genero} onChange={(e) => setGenero(e.target.value)}>{generos.map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <label className="block text-sm font-semibold">Estado<select className={field} value={estado} onChange={(e) => setEstado(e.target.value)}>{estados.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="block text-sm font-semibold">Logros iniciales <small className="font-normal text-white/50">(uno por línea; formato: nombre|descripción)</small>
          <textarea className={field} value={logros} onChange={(e) => setLogros(e.target.value)} rows={4} placeholder={"Primer paso|Completa el tutorial\nExplorador|Encuentra una zona secreta"} />
        </label>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button className="button rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow disabled:opacity-50" disabled={loading}>{id ? "Guardar cambios" : "Crear videojuego"}</button>
          <Link className="text-sm font-semibold text-gamer-blue" to="/">Cancelar</Link>
        </div>
      </form>
    </section>
  );
}

function Detalle() {
  const { id = "" } = useParams();
  const [j, setJ] = useState<Videojuego | null>(null);
  const [ps, setPs] = useState<Partida[]>([]);
  const [r, setR] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const [juego, partidas, resumen] = await Promise.all([videojuegosApi.obtener(id), videojuegosApi.partidas(id), videojuegosApi.resumen(id)]);
      setJ(juego);
      setPs(partidas);
      setR(resumen);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    cargar();
  }, [id]);
  async function logro(lid: string, obtenido: boolean) {
    try {
      await videojuegosApi.marcarLogro(id, lid, obtenido);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function eliminarRegistro(partidaId: string) {
    if (!window.confirm("¿Eliminar esta partida? Esta acción no se puede deshacer.")) return;
    try {
      await partidasApi.eliminar(partidaId);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Estados loading={loading} error={error} empty={!loading && !error && !j} />
      {!loading && !error && j && (
        <>
          <Link className="mb-5 inline-block text-sm font-semibold text-white/60 hover:text-gamer-blue" to="/">← Volver a la biblioteca</Link>
          <section className="detailhero mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">DETALLE DEL JUEGO</p>
              <h1 className="font-display text-4xl font-black">{j.nombre}</h1>
              <p className="mt-2 text-white/65">{j.plataforma} · {j.genero} · <span className={pillClass(j.estado)}>{j.estado}</span></p>
            </div>
            <Link className="button inline-flex rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow" to={`/videojuegos/${id}/editar`}>Editar juego</Link>
          </section>
          <p className="eyebrow mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">RESUMEN CALCULADO</p>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[["SESIONES", r?.totalPartidas ?? 0], ["HORAS JUGADAS", r?.horasTotales ?? 0], ["AVANCE ACTUAL", `${r?.porcentajeAvanceActual ?? 0}%`], ["ÚLTIMA PARTIDA", r?.ultimaPartida ? new Date(r.ultimaPartida).toLocaleDateString() : "Sin sesiones"]].map(([label, val]) => (
              <div className="stat rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-float" key={String(label)}>
                <small className="text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</small>
                <strong className="mt-1 block font-display text-2xl font-black">{val}</strong>
              </div>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="panel rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-float md:p-6">
              <div className="sectionhead mb-4 flex items-end justify-between">
                <div>
                  <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">COLECCIONABLES</p>
                  <h2 className="font-display text-xl font-extrabold">Logros</h2>
                </div>
                <span className="text-sm text-gamer-green">{j.logros.filter((l) => l.obtenido).length}/{j.logros.length}</span>
              </div>
              {!j.logros.length ? <p className="text-sm text-white/55">Este juego aún no tiene logros registrados.</p> : j.logros.map((l) => (
                <label className="mb-1 flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-gamer-blue/10" key={l._id}>
                  <input className="mt-1 accent-gamer-green" type="checkbox" checked={l.obtenido} onChange={(e) => logro(l._id, e.target.checked)} />
                  <span>
                    <b className="block text-sm">{l.nombre}</b>
                    <small className="text-white/50">{l.descripcion}</small>
                  </span>
                </label>
              ))}
            </section>
            <section className="panel rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-float md:p-6">
              <div className="sectionhead mb-4 flex items-end justify-between">
                <div>
                  <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">HISTORIAL</p>
                  <h2 className="font-display text-xl font-extrabold">Partidas</h2>
                </div>
                <Link className="text-sm font-semibold text-gamer-blue" to={`/partidas/nueva?videojuego=${id}`}>+ Registrar</Link>
              </div>
              {!ps.length ? <p className="text-sm text-white/55">Todavía no hay sesiones registradas.</p> : ps.map((p) => (
                <div className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-0" key={p._id}>
                  <div>
                    <b className="block text-sm">{new Date(p.fecha).toLocaleDateString()}</b>
                    <small className="text-white/50">{p.notas || "Sesión de juego"}</small>
                  </div>
                  <div className="text-right">
                    <b className="block text-sm text-gamer-green">{Math.floor(p.duracionMinutos / 60)}h {p.duracionMinutos % 60}m</b>
                    <small className="block text-white/50">{p.porcentajeAvance}% avance</small>
                    <button type="button" onClick={() => eliminarRegistro(p._id)} className="mt-1 text-xs font-semibold text-gamer-orange hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-gamer-blue" aria-label="Eliminar partida">Eliminar</button>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function ListaPartidas() {
  const [ps, setPs] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  function load() {
    setLoading(true);
    partidasApi.listar().then(setPs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, []);
  async function eliminarRegistro(partidaId: string) {
    if (!window.confirm("¿Eliminar esta partida? Esta acción no se puede deshacer.")) return;
    setError("");
    try {
      await partidasApi.eliminar(partidaId);
      await partidasApi.listar().then(setPs);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="sectionhead mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">HISTORIAL COMPLETO</p>
          <h1 className="font-display text-3xl font-black">Mis partidas</h1>
        </div>
        <Link className="button inline-flex rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow" to="/partidas/nueva">+ Nueva partida</Link>
      </div>
      <Estados loading={loading} error={error} empty={!loading && !error && !ps.length} />
      <section className="panel rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-float md:p-6">
        {!loading && !error && ps.map((p) => {
          const juego = typeof p.videojuego === "string" ? null : p.videojuego;
          return (
            <div className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-0" key={p._id}>
              <div>
                <b className="block text-sm">{juego ? <Link className="hover:text-gamer-blue" to={`/videojuegos/${juego._id}`}>{juego.nombre}</Link> : "Videojuego"}</b>
                <small className="text-white/50">{new Date(p.fecha).toLocaleString()} · {p.notas || "Sin notas"}</small>
              </div>
              <div className="text-right">
                <b className="block text-sm text-gamer-green">{p.duracionMinutos} min</b>
                <small className="block text-white/50">{p.porcentajeAvance}% avance</small>
                <button type="button" onClick={() => eliminarRegistro(p._id)} className="mt-1 text-xs font-semibold text-gamer-orange hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-gamer-blue" aria-label="Eliminar partida">Eliminar</button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

function FormPartida() {
  const nav = useNavigate();
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [juegos, setJuegos] = useState<Videojuego[]>([]);
  const [videojuego, setVideojuego] = useState(params.get("videojuego") || "");
  const [fecha, setFecha] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  const [duracion, setDuracion] = useState("60");
  const [avance, setAvance] = useState("0");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    videojuegosApi.listar().then(setJuegos).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await partidasApi.crear({ videojuego, fecha: new Date(fecha).toISOString(), duracionMinutos: Number(duracion), porcentajeAvance: Number(avance), notas });
      nav(`/videojuegos/${videojuego}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const field = "mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-gamer-blue";
  return (
    <section className="formpage mx-auto max-w-2xl">
      <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">HISTORIAL / NUEVA SESIÓN</p>
      <h1 className="mb-6 font-display text-3xl font-black">Registrar partida</h1>
      <Estados loading={loading} error={error} empty={!loading && !error && !juegos.length} />
      {!loading && !error && juegos.length > 0 && (
        <form className="form space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-float md:p-8" onSubmit={submit}>
          <label className="block text-sm font-semibold">Videojuego
            <select className={field} required value={videojuego} onChange={(e) => setVideojuego(e.target.value)}>
              <option value="">Selecciona un juego</option>
              {juegos.map((j) => <option value={j._id} key={j._id}>{j.nombre}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Fecha y hora<input className={field} required type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Duración (minutos)<input className={field} type="number" min="1" max="1440" required value={duracion} onChange={(e) => setDuracion(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Avance (%)<input className={field} type="number" min="0" max="100" required value={avance} onChange={(e) => setAvance(e.target.value)} /></label>
          </div>
          <label className="block text-sm font-semibold">Notas (opcional)<textarea className={field} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="¿Qué hiciste en esta sesión?" /></label>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button className="button rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow disabled:opacity-50" disabled={!juegos.length}>Guardar partida</button>
            <Link className="text-sm font-semibold text-gamer-blue" to="/partidas">Cancelar</Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default function App() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const animated = new WeakSet<Element>();
    const animate = () => {
      document.querySelectorAll(".gamecard, .stat, .panel, .hero, .detailhero, .form, .sectionhead").forEach((el) => {
        if (animated.has(el)) return;
        animated.add(el);
        gsap.fromTo(el, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" });
        if (el.classList.contains("gamecard")) {
          el.addEventListener("mouseenter", () => gsap.to(el, { y: -8, duration: 0.28, ease: "power2.out" }));
          el.addEventListener("mouseleave", () => gsap.to(el, { y: 0, duration: 0.28, ease: "power2.out" }));
        }
      });
    };
    const observer = new MutationObserver(animate);
    observer.observe(document.getElementById("root")!, { childList: true, subtree: true });
    animate();
    return () => observer.disconnect();
  }, []);
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ListaJuegos />} />
          <Route path="/videojuegos/nuevo" element={<FormJuego />} />
          <Route path="/videojuegos/:id" element={<Detalle />} />
          <Route path="/videojuegos/:id/editar" element={<FormJuego />} />
          <Route path="/partidas" element={<ListaPartidas />} />
          <Route path="/partidas/nueva" element={<FormPartida />} />
          <Route path="*" element={<section><h1 className="font-display text-3xl font-black">Página no encontrada</h1><Link className="mt-3 inline-block text-gamer-blue" to="/">Volver al inicio</Link></section>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
