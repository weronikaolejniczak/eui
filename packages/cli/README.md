# EUI CLI

Command-line access to Elastic UI's knowledge base.

## Usage

List all public EUI components:

```sh
npx @elastic/eui-cli list components
```

Choose JSON or TOON output for programmatic and agent consumption:

```sh
npx @elastic/eui-cli list components --format json
npx @elastic/eui-cli list components --format toon
```

## Development

From `packages/cli`:

```sh
yarn generate
yarn lint
yarn test-unit
```

The generated component index is committed so the published CLI works without
access to the EUI repository. Regenerate it whenever public component exports
change.
