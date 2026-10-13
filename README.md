# VCT Registry

The VCT Registry is a standalone, lightweight registry that serves Type Metadata for SD-JWT VCs, according to the [SD-JWT-based Verifiable Digital Credentials (SD-JWT VC)
](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/) Proposed Standard.

Users can browse registered Type Metadata, while administrators can create, edit, and delete entries with live validation and visual previews.

## Features

- Browse registered SD-JWT VC Type Metadata
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
VC Type Metadata entries are stored in a database, in table `vct`, containing columns `urn` (VCT urn identifier, the primary key) and `metadata` (a JSON object containing the VC Type Metadata).

Setting up VCT Registry as part of the wwWallet ecosystem provides a MariaDB database, but any database can be used.

## Security
Editing Type Metadata is protected using Basic authentication. The username and password can be configured. A strong password is recommended to avoid unauthorized metadata editing.

## API
| Method | Endpoint                 | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/type-metadata/all`     | Retrieve all registered metadata     |
| GET    | `/type-metadata?vct=...` | Retrieve metadata for a specific VCT |
| GET    | `/api/vct-list`          | List available VCTs                  |

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
