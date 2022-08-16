# publish-police
*check npm package dist before publish*

[![npm](https://img.shields.io/npm/v/publish-police)](https://github.com/JiangWeixian/publish-police) [![GitHub](https://img.shields.io/npm/l/publish-police)](https://github.com/JiangWeixian/publish-police)

## install 

```console
pnpm i publish-police -D
```

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
  "ci:publish": "publish-police && pnpm run build && pnpm changeset publish",
}
```

### options

`strict` - default `true`, e.g. `publish-police --strict=false`

throw error if `files` not present or empty in `package.json`.
