const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    // Unpack certs so they are accessible at runtime outside app.asar
    asar: {
      unpack: "certs/**",
    },
    // Also copy certs alongside resources for reliable access
    extraResource: ["./certs"],
    // We'll copy renderer/dist into the app via hooks below
  },
  rebuildConfig: {},
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const fs = require("fs");
      const fsp = fs.promises;
      const path = require("path");

      const src = path.resolve(__dirname, "..", "renderer", "dist");
      const dest = path.join(buildPath, "renderer", "dist");

      const ensureDir = async (dir) => {
        await fsp.mkdir(dir, { recursive: true });
      };

      const copyRecursive = async (from, to) => {
        const stat = await fsp.stat(from);
        if (stat.isDirectory()) {
          await ensureDir(to);
          const entries = await fsp.readdir(from);
          for (const entry of entries) {
            await copyRecursive(path.join(from, entry), path.join(to, entry));
          }
        } else {
          await fsp.copyFile(from, to);
        }
      };

      try {
        await ensureDir(path.dirname(dest));
        await copyRecursive(src, dest);
        // eslint-disable-next-line no-console
        console.log("Copied renderer/dist to", dest);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to copy renderer/dist:", err);
      }
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32", "darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
