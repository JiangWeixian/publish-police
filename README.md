# publish-police
*Check npm package dist before publish (yep, I always forgot to build before publish)*

[![npm](https://img.shields.io/npm/v/publish-police)](https://github.com/JiangWeixian/publish-police) [![GitHub](https://img.shields.io/npm/l/publish-police)](https://github.com/JiangWeixian/publish-police)

## install 

```console
pnpm i publish-police -D
```

## features

```json
{
  "files": ["<pattern>"],
  "exports": {
    // ...exports
  },
}
```

1. Check `files` fields in `package.json` is exit on disk.
2. Check file listed in `exports` fields in `package.json` is exit on disk.

### options

`strict` - default `true`, e.g. `publish-police --strict=false`

throw error if `files` not present or empty in `package.json`.


## usage

set it in `prepublishOnly` script

```json
{
  "prepublishOnly": "publish-police",
}
```

or exec manually before publish...

```json
{
  "ci:publish": "pnpm run build && publish-police && pnpm changeset publish",
}
```
