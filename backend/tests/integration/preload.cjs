require("../setup.cjs");

// Ignorar overrides heredados del binario, descargas o configuración de MMS.
// No se leen valores de variables de producción ni archivos de entorno.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("MONGOMS_")) delete process.env[name];
}
process.env.MONGOMS_PREFER_GLOBAL_PATH = "false";
process.env.MONGOMS_MD5_CHECK = "true";
process.env.MONGOMS_DOWNLOAD_MIRROR = "https://fastdl.mongodb.org";
