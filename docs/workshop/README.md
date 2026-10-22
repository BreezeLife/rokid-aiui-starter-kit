# Workshop tutorial

[Download the four-page English PDF](rokid-aiui-workshop-tutorial-en.pdf) for the **24 October 2026** workshop. The handout is designed for overseas participants using the Starter Kit with the external Rokid AIUI Agent DevKit Skill.

1. Choose Cook Along or Style Lens; understand the two repositories and prerequisites.
2. Install the Skill and tools, open a diagnostic browser walkthrough, or import the exact app directory in AIUI Studio.
3. Change one of three entrypoints, use the copyable coding prompt, and reload your edited project.
4. Run local checks and packaging; optionally configure Style Lens Live with a private backend.

The QR code opens the [public Starter Kit](https://github.com/BreezeLife/rokid-aiui-starter-kit). Links inside the PDF open the repository, both walkthrough videos, local diagnostic pages and the backend guide. The local links require the server command on page 2.

## Presenter notes

The suggested hands-on loop is 30 minutes: 5 to run, 15 to edit, 5 to check and 5 to show. Install prerequisites and open both no-key flows on the teaching laptop before the session. The printed commands assume a macOS/Linux shell; prepare a corresponding Windows environment separately if needed.

Download the two walkthrough videos in advance as a backup. Keep Style Lens in Sample unless you have tested your own HTTPS backend and camera/provider flow. Generate temporary team credentials near the session; the server rejects an expiry more than 24 hours away. Never share a configured private app or provider key in the public template.

The handout reflects starter source revision `44587c6338a6569e1206d1df0ce0564ce6729a4f`. The application sources are unchanged by this tutorial. Screenshots are actual patched Ink 0.19 browser diagnostics, and the videos are edited screenshot walkthroughs. Studio, physical glasses, real camera/provider and Docker execution remain unverified; see [verification status](../../verification/README.md).

## Edit or rebuild

- [tutorial.en.json](tutorial.en.json): English text, links, code blocks and screenshot references.
- [build_tutorial.py](build_tutorial.py): A4 layout, four-page validation and PDF generation. Screenshots are clipped from the original captures during PDF rendering; source image files are unchanged.
- [rokid-aiui-workshop-tutorial-en.pdf](rokid-aiui-workshop-tutorial-en.pdf): shareable checked output.

From the repository root, create an isolated Python environment and rebuild:

```bash
python3 -m venv output/workshop-venv
output/workshop-venv/bin/python -m pip install reportlab==4.4.9
output/workshop-venv/bin/python docs/workshop/build_tutorial.py
```

The renderer writes `output/pdf/rokid-aiui-workshop-tutorial-en.pdf` and a layout report. Render all four pages to images and inspect them after edits, check that commands can be copied correctly, then replace the tracked PDF:

```bash
cp output/pdf/rokid-aiui-workshop-tutorial-en.pdf \
  docs/workshop/rokid-aiui-workshop-tutorial-en.pdf
```

Participant use does not require ReportLab or this build environment. The [verification record](verification.json) captures the PDF hash, page/code/link checks, visual/content review and local app verification.
