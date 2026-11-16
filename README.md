# VCT Registry

The VCT Registry is a standalone, lightweight registry that serves Type Metadata for Verifiable Credentials, according to the [SD-JWT-based Verifiable Digital Credentials (SD-JWT VC)
](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/) Proposed Standard. While the Registry has been built upon SD-JWT VCs, it is credential-format-agnostic. It currently supports the `dc+sd-jwt` credential format, and other verifiable credential formats can be added by introducing a schema and adding the format identifier to existing endpoints.

Users can browse registered Type Metadata, while administrators can create, edit, and delete entries with live validation and visual previews.

## Features

- Browse registered Verifiable Credential Type Metadata
- View metadata in a human-friendly interface
- Create, edit and delete Type Metadata entries
- Live JSON validation and preview
- Automatic image integrity hash generation
- REST API for metadata access
- Database-backed storage

> [!NOTE]
> To quickly setup the **wwWallet** ecosystem see https://github.com/wwWallet/wwwallet

## How to run

Install dependencies

```
yarn install
```

Run in dev mode

```
yarn run dev
```

## Storage

VC Type Metadata entries are stored in a database, in table `type_metadata`, containing columns `identifier` (the type identifier, the primary key), `format` (`dc+sd-jwt`), and `metadata` (a JSON object containing the type metadata).

Setting up VCT Registry as part of the wwWallet ecosystem provides a MariaDB database, but any database can be used.

## Security

Editing Type Metadata is protected using Basic authentication. The username and password can be configured. A strong password is recommended to avoid unauthorized metadata editing.

## API

| Method | Endpoint                        | Description                                                                                       |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET`  | `/type-metadata/all`            | Retrieve all registered metadata. Use query parameters to filter credential format results.       |
| `GET`  | `/type-metadata?identifier=...` | Retrieve metadata for a specific type metadata identifier or vct, specified as a query parameter. |
| `GET`  | `/type-metadata?vct=...`        | Retrieve metadata for a specific VCT                                                              |
| `GET`  | `/type-metadata/list`           | List all formats as `{identifier, format, name}`                                                  |
| `GET`  | `/api/vct-list`                 | Deprecated: list SD-JWT VC types as `{vct, name}`.                                                |

### Management API

Management routes require an authenticated session obtained through `/auth/login`:

| Method | Endpoint                                  |
| ------ | ----------------------------------------- |
| `GET`  | `/api/type-metadata/entry?identifier=...` |
| `POST` | `/api/type-metadata/create`               |
| `POST` | `/api/type-metadata/edit`                 |
| `POST` | `/api/type-metadata/delete`               |
| `POST` | `/api/type-metadata/preview`              |

### Upgrading from the VCT-only registry

Run `yarn migration:run` before starting the updated application. The migration renames `vct` to `type_metadata` and `urn` to `identifier`, and backfills existing entries with the `dc+sd-jwt` format.

Management clients must replace `/vct/create`, `/vct/edit`, `/vct/delete`, and `/vct/preview` with the corresponding `/api/type-metadata/*` routes. Create and edit requests use `identifier` instead of `vct`; create requests also require an explicit `format`. The old management routes have been removed. Public VCT lookup and the original `/type-metadata/schema` endpoint remain available; `/api/vct-list` is deprecated in favor of `/type-metadata/list`.

`MAX_METADATA_SIZE` sets the metadata size limit in bytes and takes precedence over the legacy `MAX_VCT_SIZE`. If neither is set, the limit remains 102400 bytes.

### Example

**GET** `/type-metadata?vct=urn:eu.europa.ec.eudi:pid:1`

```
{
  "vct": "urn:eu.europa.ec.eudi:pid:1",
  "name": "PID SD-JWT VC Type Metadata",
  "display": [
    ...
  ],
  "claims": [
    ...
  ]
}
```

## Adding new Type Metadata

Authenticated users can insert Type Metadata through the "Add new credential" page. An interactive JSON editor provides live validation and instant feedback. A live preview is provided next to the editor. SVG, PNG or JPEG images are supported, either by uploading to the public folder or from external sources. The JSON entry is validated before submission to ensure invalid type metadata is not committed. URI integrity hashes are automatically calculated for all included images.

## Pre-commit

We use [pre-commit](https://pre-commit.com/) to enforce our `.editorconfig` (newline at EOF, no bad indentation, etc.) before code is committed.

#### One-time setup

```
# install pre-commit if you don’t already have it
pip install pre-commit       # or brew install pre-commit / pipx install pre-commit

# enable the git hook in this repo
pre-commit install

# optional: clean up the repo on demand
pre-commit run --all-files
git add -A
```

#### Local checks without committing

Run only the EditorConfig check, without running auto-fixers:

```sh
pre-commit run editorconfig-checker --all-files
```

Omit `--all-files` to check only staged files. The first run installs the pinned native checker in pre-commit's cache. This check reports violations without changing or staging files.

#### What happens on commit

- Auto-fixers run (e.g. add final newlines).
- After the auto-fixers, editorconfig-checker validates staged files.
- If violations remain, fix them manually until the commit passes.
