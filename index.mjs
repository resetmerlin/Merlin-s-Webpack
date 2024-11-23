import { cpus } from "os";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { Worker } from "jest-worker";
import fs from "fs";
import JestHasteMap from "jest-haste-map";
import Resolver from "jest-resolve";
import yargs from "yargs";
import { minify } from "terser";
import { createHash } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "product");

const hasteMapOptions = {
  extensions: ["js"],
  maxWorkers: cpus().length,
  name: "jest-bundler",
  platforms: [],
  rootDir: root,
  roots: [root],
  id: "Merlin's Bundler",
};

const hasteMap = new JestHasteMap.default(hasteMapOptions);

await hasteMap.setupCachePath(hasteMapOptions);

const { hasteFS, moduleMap } = await hasteMap.build();

const options = yargs(process.argv).argv;

const entryPoint = resolve(process.cwd(), options.entryPoint);

if (!hasteFS.exists(entryPoint)) {
  throw new Error(
    "`--entry-point` does not exist. Please provide a path to a valid file."
  );
}

const resolver = new Resolver.default(moduleMap, {
  extensions: [".js"],
  hasCoreModules: false,
  rootDir: root,
});

const seen = new Set();

const modules = new Map();

const queue = [entryPoint];

let id = 0;

while (queue.length) {
  const module = queue.shift();
  if (seen.has(module)) {
    continue;
  }
  seen.add(module);

  const dependencyMap = new Map(
    hasteFS
      .getDependencies(module)
      .map((dependencyName) => [
        dependencyName,
        resolver.resolveModule(module, dependencyName),
      ])
  );

  const code = fs.readFileSync(module, "utf8");
  console.log(module);

  const metadata = {
    id: id++,
    code,
    dependencyMap,
  };

  modules.set(module, metadata);

  queue.push(...dependencyMap.values());
}

const wrapModule = (id, code) =>
  `define(${id}, function(module, exports, require) {\n${code}});`;

const worker = new Worker(
  join(dirname(fileURLToPath(import.meta.url)), "worker.js"),
  {
    enableWorkerThreads: true,
  }
);

const results = await Promise.all(
  Array.from(modules)
    .reverse()
    .map(async ([module, metadata]) => {
      let { id, code } = metadata;
      ({ code } = await worker.transformFile(code));
      for (const [dependencyName, dependencyPath] of metadata.dependencyMap) {
        const dependency = modules.get(dependencyPath);
        code = code.replace(
          new RegExp(
            `require\\(('|")${dependencyName.replace(/[\/.]/g, "\\$&")}\\1\\)`
          ),
          `require(${dependency.id})`
        );

        if (options.minify) {
          code = await minify(code, { sourceMap: false }).then(
            (res) => res.code
          );
        }
      }
      return wrapModule(id, code);
    })
);

let code = fs.readFileSync("./require.js", "utf8");

const hash = createHash("sha256").update(code).digest("hex");

const output = [code, ...results, "requireModule(0);"].join("\n");

if (options.output) {
  const outputs = options.output.split(" ");

  const giveFileName = outputs.find((file) => /\.js$/.test(file)).split(".");

  const filename = [
    [...giveFileName].shift(),
    hash,
    [...giveFileName].pop(),
  ].join(".");

  const htmlName = outputs.find((file) => /\.html$/.test(file));

  fs.writeFileSync(filename, output, "utf8");

  fs.writeFileSync(
    htmlName ?? "index.html",
    `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
        </head>
        <body>
          <div id="app"></div>
          <script src='${filename}'></script>
        </body>
      </html>
    `,
    "utf8"
  );
}

worker.end();
