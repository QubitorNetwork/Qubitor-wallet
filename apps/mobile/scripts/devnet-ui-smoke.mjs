import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright-core";

const port = Number(process.env.QUBITOR_MOBILE_UI_SMOKE_PORT ?? "19006");
const baseUrl = `http://127.0.0.1:${port}`;
const artifactDir = resolve(process.env.QUBITOR_MOBILE_UI_SMOKE_ARTIFACT_DIR ?? "artifacts/devnet-ui-smoke");
const staticDir = resolve(artifactDir, "static");
const chromeExecutable = process.env.CHROME_BIN ?? "/usr/bin/google-chrome";
const commandOutput = [];
let server;

function rememberOutput(chunk) {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  commandOutput.push(...lines);
  while (commandOutput.length > 240) commandOutput.shift();
}

async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchOk(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForExpo() {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await fetchOk(baseUrl)) return;
    await sleep(1000);
  }
  throw new Error(`Expo web did not become ready at ${baseUrl}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", rememberOutput);
    child.stderr.on("data", rememberOutput);
    child.on("error", rejectCommand);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveCommand();
        return;
      }
      rejectCommand(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function buildStaticExport() {
  await rm(staticDir, { recursive: true, force: true });
  await runCommand("pnpm", ["exec", "expo", "export", "--platform", "web", "--output-dir", staticDir], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      EXPO_NO_TELEMETRY: "1",
      EXPO_PUBLIC_QUBITOR_CHAIN_ID: process.env.EXPO_PUBLIC_QUBITOR_CHAIN_ID ?? "91337",
      EXPO_PUBLIC_QUBITOR_RPC_URL: process.env.EXPO_PUBLIC_QUBITOR_RPC_URL ?? "http://127.0.0.1:18545/rpc",
      EXPO_PUBLIC_QUBITOR_FAUCET_URL: process.env.EXPO_PUBLIC_QUBITOR_FAUCET_URL ?? "http://127.0.0.1:18546",
      EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL:
        process.env.EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL ?? "http://127.0.0.1:18548",
    },
  });
}

function contentType(path) {
  const ext = extname(path);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".woff") return "font/woff";
  if (ext === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function resolveStaticPath(pathname) {
  const cleaned = pathname === "/" ? "/index.html" : pathname;
  const candidates = [
    join(staticDir, cleaned),
    join(staticDir, `${cleaned}.html`),
    join(staticDir, cleaned, "index.html"),
    join(staticDir, "index.html"),
  ];

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized.startsWith(staticDir)) continue;
    try {
      const stats = await stat(normalized);
      if (stats.isFile()) return normalized;
    } catch {
      // Try the next route candidate.
    }
  }
  return undefined;
}

function startStaticServer() {
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", baseUrl);
      const filePath = await resolveStaticPath(decodeURIComponent(url.pathname));
      if (!filePath) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, { "content-type": contentType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(error instanceof Error ? error.message : "Static server failed");
    }
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(port, "127.0.0.1", () => resolveServer());
  });
}

async function stopStaticServer() {
  if (!server) return;
  await new Promise((resolveStop) => server.close(resolveStop));
}

async function waitForText(page, text, timeout = 90_000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
}

async function main() {
  if (await fetchOk(baseUrl)) {
    throw new Error(`Port ${port} is already serving HTTP. Stop the existing Expo server or set QUBITOR_MOBILE_UI_SMOKE_PORT.`);
  }

  await mkdir(artifactDir, { recursive: true });
  await buildStaticExport();
  await startStaticServer();
  await waitForExpo();

  const browser = await chromium.launch({
    executablePath: chromeExecutable,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 920 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle", timeout: 120_000 });

    await waitForText(page, "Quanta Account");
    await waitForText(page, "QBT");
    await waitForText(page, "Network");
    await waitForText(page, "PQ Native");
    await waitForText(page, "Send");
    await waitForText(page, "Receive");
    await waitForText(page, "Bridge");
    await waitForText(page, "Secure");

    const bodyText = await page.locator("body").innerText();
    if (!bodyText.includes("Qubitor Devnet") && !bodyText.includes("Qubitor Testnet")) {
      throw new Error("Home screen did not show a Qubitor network label.");
    }
    if (!bodyText.includes("Deployed") && !bodyText.includes("Counterfactual")) {
      throw new Error("Home screen did not show a deployment state.");
    }
    if (pageErrors.length > 0) {
      throw new Error(`Browser page error: ${pageErrors[0]}`);
    }

    const screenshotPath = resolve(artifactDir, "home-final.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`[qubitor-mobile-ui-smoke] url ${baseUrl}/home`);
    console.log("[qubitor-mobile-ui-smoke] saw Quanta Account, QBT, Network, and PQ Native");
    console.log("[qubitor-mobile-ui-smoke] verified Home quick actions render");
    console.log(`[qubitor-mobile-ui-smoke] screenshot ${screenshotPath}`);
    console.log("[qubitor-mobile-ui-smoke] ok");
  } catch (error) {
    const pages = browser.contexts().flatMap((context) => context.pages());
    const page = pages[0];
    if (page) {
      const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
      await writeFile(resolve(artifactDir, "failure-body.txt"), bodyText);
      await page.screenshot({ path: resolve(artifactDir, "failure.png"), fullPage: true }).catch(() => undefined);
    }
    throw error;
  } finally {
    await browser.close();
  }
}

main()
  .catch(async (error) => {
    await mkdir(artifactDir, { recursive: true });
    await writeFile(resolve(artifactDir, "expo.log"), `${commandOutput.join("\n")}\n`);
    console.error(`[qubitor-mobile-ui-smoke] ${error instanceof Error ? error.message : "UI smoke failed"}`);
    console.error(`[qubitor-mobile-ui-smoke] expo log ${resolve(artifactDir, "expo.log")}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopStaticServer();
  });
