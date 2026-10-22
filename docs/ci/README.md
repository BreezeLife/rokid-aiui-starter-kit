# Optional GitHub Actions workflow

`verify.yml` is a prepared, pinned workflow template. It is not active in this repository because the publishing credential did not have GitHub's `workflow` write scope. The same install, verify, audit, pack and HTML-export commands passed from a clean local clone.

To enable it with an authorized GitHub credential or the repository web editor, place this file at `.github/workflows/verify.yml` and commit it. Keep the external DevKit and Actions pins. Then inspect the actual workflow result; do not treat a prepared YAML file as a CI pass.

The workflow tests local behavior and packages source. It does not certify browser rendering, Studio, glasses, or the live vision provider.
