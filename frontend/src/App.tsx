import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { videojuegosApi } from "./api/videojuegosApi";
import { partidasApi } from "./api/partidasApi";
import type { Videojuego, Partida } from "./tipos";
import "./index.css";
import { DetalleVideojuego } from "./pages/DetalleVideojuego";
import gsap from "gsap";
import { formatearFechaCivil, hoyGuayaquil } from "./utils/fechas";

const plataformas = ["PC", "PlayStation", "Xbox", "Switch", "Movil"];
const generos = [
  "Accion",
  "Rol",
  "Estrategia",
  "Puzzle",
  "Deportes",
  "Terror",
  "Otro",
];
const estados = ["Jugando", "Pausado", "Completado", "Abandonado"];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-aviso border-2 px-4 py-2 text-cuerpo transition-colors ${
    isActive
      ? "border-acento bg-panel text-texto"
      : "border-transparent text-texto-sec hover:bg-panel hover:text-texto"
  }`;

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo p-2 text-texto md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1580px] gap-4 md:min-h-[calc(100vh-2rem)]">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 md:flex">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center font-display text-seccion"
          >
            SAVE<span className="text-primario">POINT</span>
          </Link>
          <nav
            aria-label="Navegación principal"
            className="flex flex-col gap-2"
          >
            <p className="px-4 text-ayuda font-semibold uppercase tracking-wide text-texto-sec">
              Navegación
            </p>
            <NavLink to="/" end className={navClass}>
              Videojuegos
            </NavLink>
            <NavLink to="/partidas" className={navClass}>
              Partidas
            </NavLink>
            <NavLink to="/videojuegos/nuevo" className={navClass}>
              + Añadir juego
            </NavLink>
          </nav>
          <div className="mt-auto rounded-panel border border-borde bg-panel p-6">
            <p className="text-cuerpo">Diario de progreso gamer</p>
            <p className="mt-2 text-ayuda text-texto-sec">
              Tu aventura, tus estadísticas.
            </p>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-launcher border border-borde bg-fondo">
          <header className="flex flex-col gap-4 border-b border-borde p-4 md:hidden">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center self-start font-display text-seccion"
            >
              SAVE<span className="text-primario">POINT</span>
            </Link>
            <nav
              aria-label="Navegación móvil"
              className="grid grid-cols-2 gap-2"
            >
              <NavLink to="/" end className={navClass}>
                Videojuegos
              </NavLink>
              <NavLink to="/partidas" className={navClass}>
                Partidas
              </NavLink>
              <NavLink
                to="/videojuegos/nuevo"
                className={(state) => `${navClass(state)} col-span-2`}
              >
                + Añadir juego
              </NavLink>
            </nav>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Estados({
  loading,
  error,
  empty,
  nebula = false,
  reintentar,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  nebula?: boolean;
  reintentar?: () => void;
}) {
  if (nebula) {
    const aviso = "rounded-aviso border border-borde bg-panel p-4 text-cuerpo";
    if (loading)
      return (
        <p role="status" className={`${aviso} text-texto-sec`}>
          Cargando datos…
        </p>
      );
    if (error)
      return (
        <div role="alert" className={`${aviso} space-y-4 text-error`}>
          <p>{error}</p>
          {reintentar && (
            <button
              type="button"
              onClick={reintentar}
              className="inline-flex min-h-11 items-center justify-center rounded-pill border border-acento px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento"
            >
              Reintentar
            </button>
          )}
        </div>
      );
    if (empty)
      return (
        <div role="status" className={`${aviso} space-y-4 text-texto-sec`}>
          <p>Todavía no hay datos. ¡Añade el primero!</p>
          <p>Puedes añadir un videojuego o ajustar la búsqueda.</p>
          <Link
            to="/videojuegos/nuevo"
            className="inline-flex min-h-11 items-center justify-center rounded-pill border border-acento px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento"
          >
            Añadir videojuego
          </Link>
        </div>
      );
    return null;
  }
  if (loading)
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
        Cargando datos…
      </p>
    );
  if (error)
    return (
      <p className="rounded-2xl border border-gamer-orange/50 bg-gamer-orange/10 px-4 py-3 text-sm text-[#ffac80]">
        {error}
      </p>
    );
  if (empty)
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
        Todavía no hay datos. ¡Añade el primero!
      </p>
    );
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
    videojuegosApi
      .listar(filtro)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
      <section className="hero mb-12 rounded-launcher border border-borde bg-panel p-6 md:p-8">
        <div className="max-w-xl">
          <p className="eyebrow mb-4 text-ayuda font-semibold uppercase tracking-wide text-[color:var(--color-destacado)]">
            TU COLECCIÓN · TU HISTORIA
          </p>
          <h1 className="font-display text-pantalla">
            Tu próxima partida
            <br />
            <em className="not-italic text-primario">empieza aquí.</em>
          </h1>
          <p className="mt-4 text-cuerpo text-texto-sec">
            Registra tus sesiones, sigue tu progreso y celebra cada logro.
          </p>
          <Link
            to="/videojuegos/nuevo"
            className="button mt-6 inline-flex min-h-11 items-center justify-center rounded-pill bg-primario px-6 py-2 text-[length:var(--texto-destacado)] font-semibold text-fondo"
          >
            + Añadir juego
          </Link>
        </div>
      </section>
      <div className="sectionhead mb-6 space-y-6">
        <div>
          <p className="eyebrow text-ayuda font-semibold uppercase tracking-wide text-[color:var(--color-destacado)]">
            BIBLIOTECA
          </p>
          <h2 className="mt-2 font-display text-seccion">Mis videojuegos</h2>
        </div>
        <div>
          <label
            htmlFor="filtro-videojuegos"
            className="mb-2 block text-cuerpo"
          >
            Filtrar videojuegos
          </label>
          <input
            id="filtro-videojuegos"
            placeholder="Buscar por nombre…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="min-h-11 w-full rounded-pill border border-borde bg-panel px-6 py-2 text-cuerpo text-texto outline-none placeholder:text-texto-sec focus:border-acento"
          />
        </div>
      </div>
      <Estados
        loading={loading}
        error={error}
        empty={!loading && !error && !items.length}
        nebula
        reintentar={cargar}
      />
      <div className="cards grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {items.map((j) => (
          <article
            className="gamecard min-w-0 rounded-panel border border-borde bg-panel p-6"
            key={j._id}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-aviso bg-fondo font-display text-seccion text-primario"
              >
                {j.nombre.slice(0, 1).toUpperCase()}
              </span>
              <span className="inline-flex rounded-pill border border-borde bg-fondo px-4 py-2 text-ayuda text-[color:var(--color-destacado)]">
                {j.estado}
              </span>
            </div>
            <div className="gameinfo mt-6 space-y-4">
              <h3 className="break-words font-display text-seccion">
                {j.nombre}
              </h3>
              <p className="text-ayuda text-texto-sec">
                {j.plataforma} · {j.genero}
              </p>
              <p className="text-ayuda text-texto-sec">
                {j.logros.filter((l) => l.obtenido).length}/{j.logros.length}{" "}
                logros
              </p>
              <div className="actions flex flex-wrap items-center gap-2 pt-2">
                <Link
                  className="button inline-flex min-h-11 items-center justify-center rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento"
                  to={`/videojuegos/${j._id}`}
                >
                  Ver progreso ↗
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-pill border border-acento px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-acento"
                  to={`/videojuegos/${j._id}/editar`}
                >
                  Editar
                </Link>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-pill border border-error px-4 py-2 text-[length:var(--texto-destacado)] font-semibold text-error"
                  onClick={() => borrar(j._id)}
                >
                  Eliminar
                </button>
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
          setLogros(
            j.logros
              .map(
                (l) => `${l.nombre}${l.descripcion ? "|" + l.descripcion : ""}`,
              )
              .join("\n"),
          );
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
          const anterior = id
            ? juegoOriginal?.logros.find((l) => l.nombre === nombre)
            : undefined;
          return { nombre, descripcion, obtenido: anterior?.obtenido ?? false };
        }),
    };
    try {
      const j = id
        ? await videojuegosApi.actualizar(id, data)
        : await videojuegosApi.crear(data);
      nav(`/videojuegos/${j._id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const field =
    "mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-gamer-blue";
  return (
    <section className="formpage mx-auto max-w-2xl">
      <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">
        BIBLIOTECA / {id ? "EDITAR" : "NUEVO"}
      </p>
      <h1 className="mb-6 font-display text-3xl font-black">
        {id ? "Editar videojuego" : "Añadir videojuego"}
      </h1>
      <Estados loading={loading} error={error} empty={false} />
      <form
        onSubmit={submit}
        className="form space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-float md:p-8"
      >
        <label className="block text-sm font-semibold">
          Nombre
          <input
            className={field}
            required
            maxLength={120}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. The Legend of Zelda"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Plataforma
            <select
              className={field}
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
            >
              {plataformas.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Género
            <select
              className={field}
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
            >
              {generos.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Estado
          <select
            className={field}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            {estados.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Logros iniciales{" "}
          <small className="font-normal text-white/50">
            (uno por línea; formato: nombre|descripción)
          </small>
          <textarea
            className={field}
            value={logros}
            onChange={(e) => setLogros(e.target.value)}
            rows={4}
            placeholder={
              "Primer paso|Completa el tutorial\nExplorador|Encuentra una zona secreta"
            }
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            className="button rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow disabled:opacity-50"
            disabled={loading}
          >
            {id ? "Guardar cambios" : "Crear videojuego"}
          </button>
          <Link className="text-sm font-semibold text-gamer-blue" to="/">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}

function ListaPartidas() {
  const [ps, setPs] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  function load() {
    setLoading(true);
    partidasApi
      .listar()
      .then(setPs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, []);
  async function eliminarRegistro(partidaId: string) {
    if (
      !window.confirm(
        "¿Eliminar esta partida? Esta acción no se puede deshacer.",
      )
    )
      return;
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
          <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">
            HISTORIAL COMPLETO
          </p>
          <h1 className="font-display text-3xl font-black">Mis partidas</h1>
        </div>
        <Link
          className="button inline-flex rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow"
          to="/partidas/nueva"
        >
          + Nueva partida
        </Link>
      </div>
      <Estados
        loading={loading}
        error={error}
        empty={!loading && !error && !ps.length}
      />
      <section className="panel rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-float md:p-6">
        {!loading &&
          !error &&
          ps.map((p) => {
            const juego =
              typeof p.videojuego === "string" ? null : p.videojuego;
            return (
              <div
                className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-0"
                key={p._id}
              >
                <div>
                  <b className="block text-sm">
                    {juego ? (
                      <Link
                        className="hover:text-gamer-blue"
                        to={`/videojuegos/${juego._id}`}
                      >
                        {juego.nombre}
                      </Link>
                    ) : (
                      "Videojuego"
                    )}
                  </b>
                  <small className="text-white/50">
                    {formatearFechaCivil(p.fecha)} · {p.notas || "Sin notas"}
                  </small>
                </div>
                <div className="text-right">
                  <b className="block text-sm text-gamer-green">
                    {p.duracionMinutos} min
                  </b>
                  <small className="block text-white/50">
                    {p.porcentajeAvance}% avance
                  </small>
                  <button
                    type="button"
                    onClick={() => eliminarRegistro(p._id)}
                    className="mt-1 text-xs font-semibold text-gamer-orange hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-gamer-blue"
                    aria-label="Eliminar partida"
                  >
                    Eliminar
                  </button>
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
  const hoy = hoyGuayaquil(new Date());
  const [fecha, setFecha] = useState(hoy);
  const [duracion, setDuracion] = useState("60");
  const [avance, setAvance] = useState("0");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  useEffect(() => {
    videojuegosApi
      .listar()
      .then(setJuegos)
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrorEnvio("");
    try {
      await partidasApi.crear({
        videojuego,
        fecha,
        duracionMinutos: Number(duracion),
        porcentajeAvance: Number(avance),
        notas,
      });
      nav(`/videojuegos/${videojuego}`);
    } catch (e) {
      setErrorEnvio((e as Error).message);
    }
  }
  const field =
    "mt-1.5 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-gamer-blue";
  return (
    <section className="formpage mx-auto max-w-2xl">
      <p className="eyebrow text-[11px] font-bold uppercase tracking-[0.2em] text-gamer-yellow">
        HISTORIAL / NUEVA SESIÓN
      </p>
      <h1 className="mb-6 font-display text-3xl font-black">
        Registrar partida
      </h1>
      <Estados
        loading={loading}
        error={errorCarga}
        empty={!loading && !errorCarga && !juegos.length}
      />
      {!loading && !errorCarga && juegos.length > 0 && (
        <form
          className="form space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-float md:p-8"
          onSubmit={submit}
        >
          {errorEnvio && (
            <p
              role="alert"
              className="rounded-aviso border border-borde bg-panel p-4 text-sm text-error"
            >
              No pudimos guardar la partida. {errorEnvio} Revisa los datos o la
              conexión y vuelve a intentarlo.
            </p>
          )}
          <label className="block text-sm font-semibold">
            Videojuego
            <select
              className={field}
              required
              value={videojuego}
              onChange={(e) => setVideojuego(e.target.value)}
            >
              <option value="">Selecciona un juego</option>
              {juegos.map((j) => (
                <option value={j._id} key={j._id}>
                  {j.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Fecha de inicio
            <input
              className={field}
              required
              type="date"
              min="0001-01-01"
              max={hoy}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Duración (minutos)
              <input
                className={field}
                type="number"
                min="1"
                max="1440"
                required
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Avance (%)
              <input
                className={field}
                type="number"
                min="0"
                max="100"
                required
                value={avance}
                onChange={(e) => setAvance(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Notas (opcional)
            <textarea
              className={field}
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="¿Qué hiciste en esta sesión?"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              className="button rounded-full bg-gamer-orange px-5 py-2.5 text-sm font-bold shadow-orangeglow disabled:opacity-50"
              disabled={!juegos.length}
            >
              Guardar partida
            </button>
            <Link
              className="text-sm font-semibold text-gamer-blue"
              to="/partidas"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}

export default function App() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;
    const animated = new WeakSet<Element>();
    const animate = () => {
      document
        .querySelectorAll(
          ".gamecard, .stat, .panel, .hero, .detailhero, .form, .sectionhead",
        )
        .forEach((el) => {
          if (animated.has(el)) return;
          animated.add(el);
          gsap.fromTo(
            el,
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
          if (el.classList.contains("gamecard")) {
            el.addEventListener("mouseenter", () =>
              gsap.to(el, { y: -8, duration: 0.28, ease: "power2.out" }),
            );
            el.addEventListener("mouseleave", () =>
              gsap.to(el, { y: 0, duration: 0.28, ease: "power2.out" }),
            );
          }
        });
    };
    const observer = new MutationObserver(animate);
    observer.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
    });
    animate();
    return () => observer.disconnect();
  }, []);
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ListaJuegos />} />
          <Route path="/videojuegos/nuevo" element={<FormJuego />} />
          <Route path="/videojuegos/:id" element={<DetalleVideojuego />} />
          <Route path="/videojuegos/:id/editar" element={<FormJuego />} />
          <Route path="/partidas" element={<ListaPartidas />} />
          <Route path="/partidas/nueva" element={<FormPartida />} />
          <Route
            path="*"
            element={
              <section>
                <h1 className="font-display text-3xl font-black">
                  Página no encontrada
                </h1>
                <Link className="mt-3 inline-block text-gamer-blue" to="/">
                  Volver al inicio
                </Link>
              </section>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
