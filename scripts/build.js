const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

let metroProcess = null;

function exitWithError(message) {
  console.error(message);
  if (metroProcess) {
    metroProcess.kill();
  }
  process.exit(1);
}

function setupSignalHandlers() {
  const cleanup = () => {
    if (metroProcess) {
      console.log("Cleaning up Metro process...");
      metroProcess.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGHUP", cleanup);
}

function stripProtocol(domain) {
  let urlString = domain.trim();

  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    return new URL(urlString).host;
  } catch (e) {
    return urlString;
  }
}

function getDeploymentDomain() {
  // Check Replit deployment environment variables first
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    return stripProtocol(process.env.REPLIT_INTERNAL_APP_DOMAIN);
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    return stripProtocol(process.env.REPLIT_DEV_DOMAIN);
  }

  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return stripProtocol(process.env.EXPO_PUBLIC_DOMAIN);
  }

  // Fallback if no domain is set
  console.warn(
    "WARNING: No specific deployment domain found. Using localhost as fallback.",
  );
  return "localhost:8081"; 
}

function prepareDirectories(timestamp) {
  console.log("Preparing build directories...");

  if (fs.existsSync("static-build")) {
    fs.rmSync("static-build", { recursive: true, force: true });
  }

  const dirs = [
    path.join("static-build", timestamp, "_expo", "static", "js", "ios"),
    path.join("static-build", timestamp, "_expo", "static", "js", "android"),
    path.join("static-build", "ios"),
    path.join("static-build", "android"),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log("Build:", timestamp);
}

// FIXED: Removed fs.globSync to support older Node versions
function clearMetroCache() {
  console.log("Clearing Metro cache...");

  const cacheDirs = [
    ".metro-cache",
    "node_modules/.cache/metro"
  ];

  for (const dirPath of cacheDirs) {
    const fullPath = path.resolve(dirPath);
    if (fs.existsSync(fullPath)) {
       try {
         fs.rmSync(fullPath, { recursive: true, force: true });
       } catch (e) {
         console.warn(`Warning: Could not clear cache at ${fullPath}`);
       }
    }
  }

  console.log("Cache cleared");
}

async function checkMetroHealth() {
  try {
    // AbortSignal.timeout requires Node 17.3+. Using a fallback if needed.
    const signal = AbortSignal.timeout ? AbortSignal.timeout(5000) : null;
    const options = signal ? { signal } : {};
    
    const response = await fetch("http://localhost:8081/status", options);
    return response.ok;
  } catch {
    return false;
  }
}

async function startMetro(expoPublicDomain) {
  const isRunning = await checkMetroHealth();
  if (isRunning) {
    console.log("Metro already running");
    return;
  }

  console.log("Starting Metro...");
  console.log(`Setting EXPO_PUBLIC_DOMAIN=${expoPublicDomain}`);
  const env = {
    ...process.env,
    EXPO_PUBLIC_DOMAIN: expoPublicDomain,
    CI: "1", 
  };
  
  // Try to start Expo using npm script
  metroProcess = spawn("npm", ["run", "expo:start:static:build"], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    env,
  });

  if (metroProcess.stdout) {
    metroProcess.stdout.on("data", (data) => {
      const output = data.toString().trim();
      if (output) console.log(`[Metro] ${output}`);
    });
  }
  if (metroProcess.stderr) {
    metroProcess.stderr.on("data", (data) => {
      const output = data.toString().trim();
      if (output) console.error(`[Metro Error] ${output}`);
    });
  }

  console.log("Waiting for Metro to be ready...");
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const healthy = await checkMetroHealth();
    if (healthy) {
      console.log("Metro ready");
      return;
    }
  }

  console.error("Metro timeout - Failed to start within 60s");
  process.exit(1);
}

async function downloadFile(url, outputPath) {
  const controller = new AbortController();
  const fiveMinMS = 5 * 60 * 1_000;
  const timeoutId = setTimeout(() => controller.abort(), fiveMinMS);

  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const file = fs.createWriteStream(outputPath);
    // Compatible stream handling
    if (response.body && typeof response.body.pipe === 'function') {
        // Node 16- style stream
        await new Promise((resolve, reject) => {
            response.body.pipe(file);
            response.body.on('error', reject);
            file.on('finish', resolve);
        });
    } else {
        // Node 18+ Web Streams
        await pipeline(Readable.fromWeb(response.body), file);
    }

    const fileSize = fs.statSync(outputPath).size;

    if (fileSize === 0) {
      fs.unlinkSync(outputPath);
      throw new Error("Downloaded file is empty");
    }
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    if (error.name === "AbortError") {
      throw new Error(`Download timeout after 5m: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function downloadBundle(platform, timestamp) {
  const url = new URL("http://localhost:8081/client/index.bundle");
  url.searchParams.set("platform", platform);
  url.searchParams.set("dev", "false");
  url.searchParams.set("hot", "false");
  url.searchParams.set("lazy", "false");
  url.searchParams.set("minify", "true");

  const output = path.join(
    "static-build",
    timestamp,
    "_expo",
    "static",
    "js",
    platform,
    "bundle.js",
  );

  console.log(`Fetching ${platform} bundle...`);
  await downloadFile(url.toString(), output);
  console.log(`${platform} bundle ready`);
}

async function downloadManifest(platform) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300_000);

  try {
    console.log(`Fetching ${platform} manifest...`);
    const response = await fetch("http://localhost:8081/manifest", {
      headers: { "expo-platform": platform },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const manifest = await response.json();
    console.log(`${platform} manifest ready`);
    return manifest;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Manifest download timeout after 5m for platform: ${platform}`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function downloadBundlesAndManifests(timestamp) {
  console.log("Downloading bundles and manifests...");
  
  try {
    const results = await Promise.allSettled([
      downloadBundle("ios", timestamp),
      downloadBundle("android", timestamp),
      downloadManifest("ios"),
      downloadManifest("android"),
    ]);

    const failures = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === "rejected");

    if (failures.length > 0) {
      const errorMessages = failures.map(({ result, index }) => {
        const names = [
          "iOS bundle",
          "Android bundle",
          "iOS manifest",
          "Android manifest",
        ];
        return `  - ${names[index]}: ${result.reason?.message || result.reason}`;
      });

      exitWithError(`Download failed:\n${errorMessages.join("\n")}`);
    }

    const iosManifest = results[2].value;
    const androidManifest = results[3].value;

    console.log("All downloads completed successfully");
    return { ios: iosManifest, android: androidManifest };
  } catch (error) {
    exitWithError(`Unexpected download error: ${error.message}`);
  }
}

function extractAssets(timestamp) {
  const iosPath = path.join("static-build", timestamp, "_expo", "static", "js", "ios", "bundle.js");
  const androidPath = path.join("static-build", timestamp, "_expo", "static", "js", "android", "bundle.js");

  if (!fs.existsSync(iosPath) || !fs.existsSync(androidPath)) {
      exitWithError("Bundle files not found for asset extraction.");
  }

  const bundles = {
    ios: fs.readFileSync(iosPath, "utf-8"),
    android: fs.readFileSync(androidPath, "utf-8"),
  };

  const assetsMap = new Map();
  const assetPattern =
    /httpServerLocation\s*:\s*"([^"]+)"[^}]*hash\s*:\s*"([^"]+)"[^}]*name\s*:\s*"([^"]+)"[^}]*type\s*:\s*"([^"]+)"/g;

  const extractFromBundle = (bundle, platform) => {
    for (const match of bundle.matchAll(assetPattern)) {
      const originalPath = match[1];
      const filename = match[3] + "." + match[4];

      const tempUrl = new URL(`http://localhost:8081${originalPath}`);
      const unstablePath = tempUrl.searchParams.get("unstable_path");

      if (!unstablePath) {
        continue;
      }

      const decodedPath = decodeURIComponent(unstablePath);
      const key = path.posix.join(decodedPath, filename);

      if (!assetsMap.has(key)) {
        const asset = {
          url: path.posix.join("/", decodedPath, filename),
          originalPath: originalPath,
          filename: filename,
          relativePath: decodedPath,
          hash: match[2],
          platforms: new Set(),
        };

        assetsMap.set(key, asset);
      }
      assetsMap.get(key).platforms.add(platform);
    }
  };

  extractFromBundle(bundles.ios, "ios");
  extractFromBundle(bundles.android, "android");

  return Array.from(assetsMap.values());
}

async function downloadAssets(assets, timestamp) {
  if (assets.length === 0) return 0;

  console.log("Downloading assets...");
  let successCount = 0;
  
  // Batch download to avoid network errors
  const BATCH_SIZE = 10;
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
      const batch = assets.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (asset) => {
        const platform = Array.from(asset.platforms)[0];
        const tempUrl = new URL(`http://localhost:8081${asset.originalPath}`);
        const unstablePath = tempUrl.searchParams.get("unstable_path");

        if (!unstablePath) return;

        const decodedPath = decodeURIComponent(unstablePath);
        const metroUrl = new URL(
          `http://localhost:8081${path.posix.join("/assets", decodedPath, asset.filename)}`,
        );
        metroUrl.searchParams.set("platform", platform);
        metroUrl.searchParams.set("hash", asset.hash);

        const outputDir = path.join(
          "static-build",
          timestamp,
          "_expo",
          "static",
          "js",
          asset.relativePath,
        );
        fs.mkdirSync(outputDir, { recursive: true });
        const output = path.join(outputDir, asset.filename);

        try {
          await downloadFile(metroUrl.toString(), output);
          successCount++;
        } catch (error) {
           // Skip errors for optional assets
        }
      }));
  }

  console.log(`Downloaded ${successCount} assets`);
  return successCount;
}

function updateBundleUrls(timestamp, baseUrl) {
  const updateForPlatform = (platform) => {
    const bundlePath = path.join(
      "static-build",
      timestamp,
      "_expo",
      "static",
      "js",
      platform,
      "bundle.js",
    );
    let bundle = fs.readFileSync(bundlePath, "utf-8");

    bundle = bundle.replace(
      /httpServerLocation:"(\/[^"]+)"/g,
      (_match, capturedPath) => {
        const tempUrl = new URL(`http://localhost:8081${capturedPath}`);
        const unstablePath = tempUrl.searchParams.get("unstable_path");

        if (!unstablePath) return _match;

        const decodedPath = decodeURIComponent(unstablePath);
        return `httpServerLocation:"${baseUrl}/${timestamp}/_expo/static/js/${decodedPath}"`;
      },
    );

    fs.writeFileSync(bundlePath, bundle);
  };

  updateForPlatform("ios");
  updateForPlatform("android");
  console.log("Updated bundle URLs");
}

function updateManifests(manifests, timestamp, baseUrl, assetsByHash) {
  const updateForPlatform = (platform, manifest) => {
    if (!manifest || !manifest.launchAsset || !manifest.extra) {
       return;
    }

    manifest.launchAsset.url = `${baseUrl}/${timestamp}/_expo/static/js/${platform}/bundle.js`;
    manifest.launchAsset.key = `bundle-${timestamp}`;
    
    // Ensure URL has no trailing slash issues
    const cleanBaseUrl = baseUrl.replace(/^https?:\/\//, "");
    
    manifest.extra.expoClient = manifest.extra.expoClient || {};
    manifest.extra.expoGo = manifest.extra.expoGo || { packagerOpts: {} };

    manifest.extra.expoClient.hostUri = cleanBaseUrl;
    manifest.extra.expoGo.debuggerHost = cleanBaseUrl;
    manifest.extra.expoGo.packagerOpts.dev = false;

    if (manifest.assets && manifest.assets.length > 0) {
      manifest.assets.forEach((asset) => {
        if (!asset.url || !asset.hash) return;
        const assetInfo = assetsByHash.get(asset.hash);
        if (!assetInfo) return;
        asset.url = `${baseUrl}/${timestamp}/_expo/static/js/${assetInfo.relativePath}/${assetInfo.filename}`;
      });
    }

    fs.writeFileSync(
      path.join("static-build", platform, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  };

  updateForPlatform("ios", manifests.ios);
  updateForPlatform("android", manifests.android);
  console.log("Manifests updated");
}

async function main() {
  console.log("Building static Expo Go deployment...");

  setupSignalHandlers();

  const domain = getDeploymentDomain();
  const baseUrl = `https://${domain}`;
  const timestamp = `${Date.now()}-${process.pid}`;

  prepareDirectories(timestamp);
  clearMetroCache();

  await startMetro(domain);

  const downloadTimeout = 300000;
  const downloadPromise = downloadBundlesAndManifests(timestamp);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error("Overall download timeout. Check Metro logs above."),
      );
    }, downloadTimeout);
  });

  const manifests = await Promise.race([downloadPromise, timeoutPromise]);

  console.log("Processing assets...");
  const assets = extractAssets(timestamp);
  console.log("Found", assets.length, "unique asset(s)");

  const assetsByHash = new Map();
  for (const asset of assets) {
    assetsByHash.set(asset.hash, {
      relativePath: asset.relativePath,
      filename: asset.filename,
    });
  }

  const assetCount = await downloadAssets(assets, timestamp);

  if (assetCount > 0) {
    updateBundleUrls(timestamp, baseUrl);
  }

  console.log("Updating manifests...");
  updateManifests(manifests, timestamp, baseUrl, assetsByHash);

  console.log("Build complete! Deploy to:", baseUrl);

  if (metroProcess) metroProcess.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error("Build failed:", error.message);
  if (metroProcess) metroProcess.kill();
  process.exit(1);
});
