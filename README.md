# publish-checker
*check npm package dist before publish*

[![npm](https://img.shields.io/npm/v/publish-checker)](https://github.com/JiangWeixian/publish-checker) [![GitHub](https://img.shields.io/npm/l/publish-checker)](https://github.com/JiangWeixian/publish-checker)

## install 

```console
pnpm i publish-checker -D
```

## usage

set it in `prepublishOnly` script

```json
{
  "prepublishOnly": "publish-checker",
}
```

or exec manually before publish...

```json
{
  "ci:publish": "publish-checker && pnpm run build && pnpm changeset publish",
}
```

### options

`strict` - default `true`, e.g. `publish-checker --strict=false`

throw error if `files` not present or empty in `package.json`.
