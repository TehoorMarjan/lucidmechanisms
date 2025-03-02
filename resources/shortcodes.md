# Shortcodes Reference

## Accordion

Creates an accordion element.

**Parameters:**

- `title`: (e.g., "What you need", "Outdated")
- `class`:
  - `"active"`: Open by default
  - `"inactive"`: Closed by default

**Example:**

```markdown
{{< accordion title="Outdated" class="active" >}}

Content goes here.

{{< /accordion >}}
```

## Icons

Displays an SVG icon.

**Parameters:**

- `vendor`:
  - `custom`: Refers to `assets/icons/custom`
  - `dev`: Refers to [devicon](https://devicon.dev/)
- `name`: (e.g., "linux/linux-plain", "cplusplus/cplusplus-original")
- `className`: One of `.hi-svg-inline`, `hi-svg-1`, `hi-svg-2`, `hi-svg-3`

**Example:**

```markdown
{{< icon vendor="dev" name="linux/linux-plain" className="hi-svg-2" >}}
```

## Image

Embeds an image.

**Parameters:**

- `src`: Source (e.g., "lightburn-device-import.png", "lightburn-macros-2.png")
- `alt`: Alternative Text (e.g., "GCode", "Calibration")
- `position`: (e.g., "float-right", "float-left")
- `class`: (e.g., "float-left", "w-32", "max-w-lg")
- `title`: Tooltip when hovering (e.g., "Calibration")
- `zoomable`: (e.g., "true")

**Example:**

```markdown
{{< image src="lightburn-device-import.png" alt="GCode" class="w-32" title="Calibration" zoomable="true" >}}
```

## YouTube Lite

Embeds a YouTube video.

**Parameters:**

- `id`: (e.g., "qLugss9dOag", "ddRW12VKIwY")
- `class`: (e.g., "mx-auto")

**Example:**

```markdown
{{< youtube-lite id="qLugss9dOag" class="mx-auto" >}}
```

## Notice

Displays a notice box.

**Parameters:**

- `<unnamed>`: Type of notice:
  - `abstract`
  - `attention`
  - `bug`
  - `caution`
  - `check`
  - `cite`
  - `danger`
  - `done`
  - `error`
  - `example`
  - `fail`
  - `failure`
  - `faq`
  - `help`
  - `hint`
  - `important`
  - `info`
  - `missing`
  - `note`
  - `question`
  - `quote`
  - `success`
  - `summary`
  - `tip`
  - `tldr`
  - `todo`
  - `warning`

**Example:**

```markdown
{{< notice important >}}

Important notice content.

{{< /notice >}}
```

## Ref

Creates a reference link.

**Parameters:**

- `target`: (e.g., "#busybox-2-systemd", "#extending-layers")

**Example:**

```markdown
{{< ref target="#busybox-2-systemd" >}}
```
