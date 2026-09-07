# crypto-random-string v6

Replaces the removed `cryptoRandomStringAsync` named export with the v6 default synchronous export.

The transform preserves the existing local name when only the async export was imported. If the file already imports the default export, references to the async import are changed to that local name. An `await` that directly wraps a migrated call is removed with the obsolete asynchronous API.

The workflow processes JavaScript and TypeScript source files and ignores dependency and build output directories.
