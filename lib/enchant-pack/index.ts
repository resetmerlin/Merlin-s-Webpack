import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'jest-worker';
import fs, { readFileSync } from 'fs';
import JestHasteMap from 'jest-haste-map';
import Resolver from 'jest-resolve';
import { minify } from 'terser';
import { createHash } from 'crypto';
import { createServer } from 'http';
import { compress } from 'brotli';

/**
 * MerlinBunlder is a bundler that uses hasted map( Facebook's haste module system) for collection.
 *
 * This implementation is inspired by https://cpojer.net/posts/building-a-javascript-bundler
 *
 *
 * The MerlinBundler is created as follows:
 *  1. Collection: used jest-haste-map to collection all the dependency of entry point
 *
 *  2. Dependency Graph: used jest resolve to resolve haste-map based dependency and transform into bundler based dependency
 *
 *  3. Transfromation: used Babel plugin to change modern js syntax into common js or esm
 *
 *  4. Optimization: used terser for minification, currently tree shacking is not established
 *
 */
class MerlinBundler {
  private _root: any;
  private _hasteMapOptions: any;
  private _outputs: any;
  private _entryPoint: any;
  private _dev: any;

  constructor({
    root,
    hasteMapOptions,
    entryPoint,
    outputs,
    isDev = false,
  }: {
    root: string;
  }) {
    this._root = root;
    this._hasteMapOptions = hasteMapOptions;
    this._entryPoint = entryPoint;
    this._outputs = outputs;
    this._dev = isDev;
  }

  async _bundle() {
    const { hasteFS, moduleMap } = await this.collection();

    const dependencyGraph = await this.createDependencyGraph(
      hasteFS,
      moduleMap,
    );

    const transpiledCode = await this.transformation(dependencyGraph);

    const { filename, url, minifiedCode } =
      await this.optimization(transpiledCode);

    const htmlName =
      this._outputs.find((file) => /\.html$/.test(file)) ?? 'index.html';

    fs.writeFileSync(filename, minifiedCode.code, 'utf8');
    fs.writeFileSync(url, minifiedCode.map, 'utf8');
    fs.writeFileSync(`${filename}.br`, compress(readFileSync(filename)));

    fs.writeFileSync(
      htmlName,
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
      'utf8',
    );

    fs.writeFileSync(`${htmlName}.br`, compress(readFileSync(htmlName)));
  }

  async bundle() {
    const HasteMap = JestHasteMap.default;

    this._hasteMap = await HasteMap.create(this._hasteMapOptions);

    this._hasteMap.on('change', async ({ eventQueue }) => {
      console.log('Detected file changes:', eventQueue);

      await this._bundle();
    });

    await this._bundle();

    if (this._dev) {
      const server = createServer((req, res) => {
        if (req.url === '/') {
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Encoding', 'br');
          res.statusCode = 200;

          const html = readFileSync('./index.html.br');
          res.write(html);
          res.end();
        }

        if (req.url.endsWith('.js')) {
          res.setHeader(
            'Content-Type',
            'application/javascript; charset=utf-8',
          );
          res.setHeader('Content-Encoding', 'br');
          res.statusCode = 200;

          const javascript = readFileSync('.' + req.url + '.br');
          res.write(javascript);
          res.end();
        }
      });

      server.listen(5173, 'localhost', () => {
        console.log(`Server is running on http://localhost:5173`);
      });
    }
  }

  /**
   * 1. collect the modules
   */
  async collection() {
    const { hasteFS, moduleMap } = await this._hasteMap.build();

    return { hasteFS, moduleMap };
  }

  /**
   * 2. create dependency graph
   */
  async createDependencyGraph(hasteFS, moduleMap) {
    const resolver = new Resolver.default(moduleMap, {
      extensions: this._hasteMapOptions.extensions.map((str) => `.${str}`),
      hasCoreModules: false,
      rootDir: this._root,
    });

    const seen = new Set();

    const modules = new Map();

    const queue = [this._entryPoint];

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
          ]),
      );

      const code = fs.readFileSync(module, 'utf8');

      const metadata = {
        id: id++,
        code,
        dependencyMap,
      };

      modules.set(module, metadata);

      queue.push(...dependencyMap.values());
    }

    return modules;
  }

  /**
   * 3. transpile the code into common js or esm
   */
  async transformation(dependencyGraph) {
    const worker = new Worker(
      join(dirname(fileURLToPath(import.meta.url)), 'worker.js'),
      {
        enableWorkerThreads: true,
      },
    );

    const results = await Promise.all(
      Array.from(dependencyGraph)
        .reverse()
        .map(async ([_, metadata]) => {
          let { id, code } = metadata;
          ({ code } = await worker.transformFile(code));
          for (const [
            dependencyName,
            dependencyPath,
          ] of metadata.dependencyMap) {
            const dependency = dependencyGraph.get(dependencyPath);
            code = code.replace(
              new RegExp(
                `require\\(('|")${dependencyName.replace(
                  /[\/.]/g,
                  '\\$&',
                )}\\1\\)`,
              ),
              `require(${dependency.id})`,
            );
          }

          return MerlinBundler.wrapModule(id, code);
        }),
    );

    worker.end();

    return results;
  }

  /**
   * 4. Optimize the code; tree shaking, minification
   */
  async optimization(bundledResult) {
    const { sourceMapName, hashedFileName, bundledCode } =
      this.retrieveMetadataForOpt(bundledResult);

    const minifiedCode = await this.minification(
      bundledCode,
      hashedFileName,
      sourceMapName,
    );

    return minifiedCode;
  }

  async minification(code, filename, url) {
    const minifiedCode = await minify(code, {
      sourceMap: {
        filename,
        url,
        includeSources: true,
      },
    });

    return {
      filename,
      url,
      minifiedCode,
    };
  }

  retrieveMetadataForOpt(bundledResult) {
    const outputs = this._outputs;
    const code = fs.readFileSync('./require.js', 'utf8');

    const outputFile = outputs.find((file) => /\.js$/.test(file)).split('.');

    const extension = outputFile.pop();
    const filename = outputFile.shift();

    if (!new Set(this._hasteMapOptions.extensions).has(extension)) {
      throw new Error('Extension missmatch!');
    }

    const bundledCode = [code, ...bundledResult, 'requireModule(0);'].join(
      '\n',
    );

    const hash = createHash('sha256').update(bundledCode).digest('hex');

    const sourceMapName = MerlinBundler.getHashedFileName(
      filename,
      hash,
      extension,
      true,
    );
    const hashedFileName = MerlinBundler.getHashedFileName(
      filename,
      hash,
      extension,
    );

    return { sourceMapName, hashedFileName, bundledCode };
  }

  static getHashedFileName(name, hash, extension, isSourceMap = false) {
    if (!isSourceMap) {
      return `${name}.${hash}.${extension}`;
    }

    return `${name}.${hash}.${extension}.map`;
  }

  static wrapModule(id, code) {
    return `define(${id}, function(module, exports, require) {\n${code}});`;
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), 'csr');

const entryPoint = resolve(process.cwd(), 'csr/index.js');

const outputs = ['test.js', 'index.html'];

const hasteMapOptions = {
  extensions: ['js'],
  name: 'jest-bundler',
  platforms: [],
  rootDir: root,
  roots: [root],
  id: "Merlin's Bundler",
  watch: true,
  maxWorkers: 4,
  retainAllFiles: true,
};

const bundler = new MerlinBundler({
  root,
  hasteMapOptions,
  entryPoint,
  outputs,
  isDev: true,
});

await bundler.bundle();
