# action-gh-model-prompt

A GitHub Action that renders prompt templates, calls GitHub Models for inference, and outputs structured results (JSON or text). Supports batching over file lists and diffs, jq-style field picking, and optional aggregation of picked values.

## Features
- Render a prompt file with `{{PLACEHOLDER}}` substitutions
- Call GitHub Models (chat completions) with configurable `model`, `system`, and `response_format`
- Optional batching using `FILE_LIST` and `DIFF` placeholders
- Optional jq-like picking (dot-path) from JSON responses via `jq_pick`
- Optional aggregation of picked values across batches: `none | first | join | worst_severity`

## Quick start
```yaml
name: Model Prompt
on: [workflow_dispatch]

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: PR Risk Analysis
        uses: GulerSevil/actions-pr-risk-analysis@main
        with:
          repository: ${{ github.repository }}
          prompt: .github/prompts/ios-risk-unified.prompt
          placeholders_json: >
            {
              "MODE":"pr",
              "DIFF":${{ steps.prepare_diff.outputs.diff }},
              "FILE_LIST":${{ steps.prepare_diff.outputs.files }},
              "CONTEXT":${{ steps.prepare_diff.outputs.context }}
            }
          response_format: json_object
          jq_pick: .verdict.release_risk
          pick_aggregation: none
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Use outputs
        run: |
          echo "Picked: ${{ steps.run.outputs.picked }}"
```

## Inputs
| Name | Description | Default | Required |
|------|-------------|---------|----------|
| `model` | Model id (e.g., `openai/gpt-4o-mini`) | `openai/gpt-4o-mini` | no |
| `prompt_path` | Path to the prompt file | — | yes |
| `placeholders_json` | JSON whose keys map to `{{KEY}}` in the prompt | `{}` | yes |
| `system` | System message | `Output STRICT JSON only.` | no |
| `response_format` | `json_object` or `text` | `json_object` | no |
| `api_url` | Override inference endpoint | `https://models.github.ai/inference/chat/completions` | no |
| `timeout_ms` | HTTP timeout (ms) | `120000` | no |
| `strip_hash_comments` | Remove lines starting with `# ` before sending | `true` | no |
| `request_debug` | Echo rendered prompt/payload to logs | `false` | no |
| `fail_on_invalid_json` | Fail if response isn't valid JSON (when `response_format=json_object`) | `true` | no |
| `jq_pick` | Dot-path-like selector (e.g., `.verdict.release_risk`) | `""` | no |
| `pick_aggregation` | Aggregate picked values across batches: `none | first | join | worst_severity` | `none` | no |
| `token` | GitHub token (defaults to `env.GITHUB_TOKEN`) | — | no |
| `batch_size` | If >0, split `FILE_LIST` into batches and call per batch | `0` | no |

### placeholders_json explained
- A JSON object that supplies values for placeholders used in your prompt. A key `FOO` replaces every `{{FOO}}` in the prompt.
- Values can be strings, numbers, booleans. For multi-line strings, use YAML block syntax (`|`).
- Special keys for batching:
  - `FILE_LIST`: newline-separated file paths (enables batching when non-empty)
  - `DIFF`: unified diff text corresponding to `FILE_LIST`
  - `CHANGED_FILES` is accepted as an alias for `FILE_LIST`

Example (workflow inputs):
```yaml
with:
  prompt_path: prompts/review.prompt
  placeholders_json: |
    {
      "PROJECT_NAME": "action-gh-model-prompt",
      "NAME": "world",
      "FILE_LIST": "src/a.ts\nsrc/b.ts",
      "DIFF": "+++ b/src/a.ts\n+ new line"
    }
```

Given a prompt snippet:
```
Hello {{NAME}} from {{PROJECT_NAME}}.
Files:\n{{FILE_LIST}}
```
It renders as:
```
Hello world from action-gh-model-prompt.
Files:
src/a.ts
src/b.ts
```

### Placeholders and batching
- Any `{{KEY}}` in your prompt will be substituted from `placeholders_json`.
- If you include `{{FILE_LIST}}` (newline-separated) and optionally `{{DIFF}}`, the action will automatically enable batching when `FILE_LIST` is non-empty.
  - Use `batch_size` to control batch chunking (default internal batch size is 30 when batching is enabled and `batch_size` is 0).

## Outputs
| Name | Description |
|------|-------------|
| `raw_response` | Raw HTTP response(s) as JSON string (array for batched) |
| `message_content` | `choices[0].message.content` (array for batched) |
| `json` | Parsed JSON (pretty-printed) when available (array for batched) |
| `picked` | Value after applying `jq_pick` (and optional `pick_aggregation`) |

## Prompt example
```
# review.prompt
System: Please review the changes and output STRICT JSON.

User:
Changed files:
{{FILE_LIST}}

Diff:
{{DIFF}}

Project: {{PROJECT_NAME}}
```

## Development
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test` (watch: `npm run test:watch`)

Project layout highlights:
- `src/core/inference`: single and batched inference orchestrators
- `src/core/runtime`: inputs/types for action runtime
- `src/core/util`: utilities (`severity`, `promptPlaceholders`)
- `src/core/batching.ts`: batching helpers
- `src/prompt`: prompt loader/render and picking helpers

## License
MIT (or your preferred license)
