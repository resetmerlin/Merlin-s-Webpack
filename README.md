# Merlin-s-Webpack

Build webpack from scratch

- [x] Add a `--minify` flag that runs a minifier like [`terser`](https://github.com/terser/terser) on each individual file in the bundle.

- [x] Add a cache that will store transformed files and only re-compile files that have changed.

- [x] _Medium:_ Learn about [source maps](https://firefox-source-docs.mozilla.org/devtools-user/debugger/how_to/use_a_source_map/index.html) and generate the corresponding `.map` file for your bundle.

- [x] _Medium:_ Add a `--dev` option that starts a HTTP server that serves the bundled code through an HTTP endpoint.

- [ ] _Medium:_ After implementing the HTTP server, make use of `jest-haste-map`’s [`watch`](https://github.com/facebook/jest/blob/04b75978178ccb31bccb9f9b2f8a0db2fecc271e/packages/jest-haste-map/src/index.ts#L75) function to listen for changes and re-bundle automatically.

- [ ] _Advanced_: Learn about [Import Maps](https://blog.logrocket.com/es-modules-in-browsers-with-import-maps/) and change the bundler from being `require` based to work with native ESM!

- [ ] _Advanced_: Hot reloading: Adjust the runtime so it can update modules by first de-registering and then re-running the module and all of its dependencies.

- [ ] _Advanced_: Rewrite the above bundler in another programming language like Rust.
