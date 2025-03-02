+++
author = 'Tehoor Marjan'
categories = ['code']
date = '2025-03-02T22:36:19+01:00'
description = "Is Rust the future of systems programming? This deep dive explores Rust's strengths, weaknesses, and real-world applicability, from CLI tools to embedded systems."
draft = false
image = 'images/posts/2025-03-02-rust-yes-but-not-everywhere/header.webp'
keywords = ['rust', 'rust pros and cons', 'rust embedded systems', 'rust safety features', 'rust compilation speed', 'rust for beginners', 'rust programming issues']
slug = 'rust-yes-but-not-everywhere'
tags = ['code', 'rust', 'embedded-systems']
title = 'Rust, yes, but not everywhere'
+++

Rust is a systems programming language that aims to provide memory safety,
performance, and concurrency. It achieves this through a combination of features
such as ownership, borrowing, and lifetimes, which allow it to enforce memory
safety at compile time without needing a garbage collector. This makes Rust
particularly suitable for performance-critical applications and systems
programming, where manual memory management is typically required. Rust's
zero-cost abstractions promises that high-level features do not incur runtime
overhead, further enhancing its performance. The language's concurrency model is
designed to be safe and efficient, making it easier to write concurrent code
without the common pitfalls of data races.

Rust is gaining traction across industries for its reliability, performance, and
memory safety. Companies like Microsoft, Amazon, and Google use it for cloud
computing and distributed systems, while aerospace and automotive sectors are
eyeing on its safety. Finance, healthcare, and gaming industries are also
adopting Rust for security and efficiency. Additionally, it is being explored in
blockchain, robotics, and embedded systems, though its ecosystem remains a work
in progress. Its adoption is fueled by the need for safe, high-performance
software.

But does Rust deliver on all its promises? To evaluate its real-world
applicability, I tested it on two very different projects: [Renk][renk], a
command-line tool for handling color palettes, and an [ATtiny85 microcontroller
project][attiny]. The results? One turned into a monster... the other into a
nightmare. 👾

## Two Test Projects

[Renk][renk] is a command-line utility for fetching and converting color
palettes. I originally wrote a similar tool in Python, and I wanted to see if
Rust could be a good alternative for this kind of workload, looking at projects
that did a similar move for this kind of use-cases. _It wasn't a good idea..._

I attempted to use Rust to [program an ATtiny85][attiny], a small 8-bit AVR
microcontroller. The goal was simple: blink an LED, then explore how Rust could
improve safety in a constrained embedded environment. _Spoiler alert: just
getting the LED to blink was already a major struggle._

## What Rust Does Well

<h5>Performance</h5>

Rust delivers excellent performance, close to C, thanks to its zero-cost
abstractions and fine-grained memory control. However, this is a given for a
systems language and should not be overhyped.

<h5>Code Reliability</h5>

Rust’s strict compiler ensures that code that compiles is often correct. The `?`
operator enforces proper error handling, which can reduce runtime issues. This
strong safety model is reminiscent of Python or TypeScript’s strict typing but
taken to an extreme. Its error handling is way better than C. It's in the
syntax, and it's somewhat standardized. It doesn't compete with `C++` or other
languages though.

```rust
fn download_sources(url: String) -> Result<String, Error> {
    let response = get(url)?.error_for_status()?;
    let response_text = response.text()?;
    Ok(response_text)
}
```

<h5>A Fresh Option for Low-Level Programming</h5>

Before Rust, the main choices for open-source systems programming were **C, C++,
and Ada**. Rust brings a new paradigm with memory safety guarantees, making it
an interesting addition.

## Rust’s Frustrations and Limitations

<h5>Error Handling is Tedious</h5>

Unlike C++ (which offers structured exceptions), Rust forces explicit error
propagation. This is safer, but often results in cluttered, boilerplate-heavy
code.

```rust
pub enum ConvertError {
    DownloadError(reqwest::Error),
    ConversionError(ConverterError),
    ExportError(ExporterError),
}

// [...]

pub fn convert(source: &PaletteSource, destination: &str) -> Result<(), ConvertError> {
    let response_text = download_palette(&source.url).map_err(ConvertError::DownloadError)?;
    let converter = create_converter(source).map_err(ConvertError::ConversionError)?;
    let swatches = converter.extract_palette(&response_text).map_err(ConvertError::ConversionError)?;
    let palette = Palette {
        name: source.name.clone(),
        swatches,
    };

    let exporter = create_exporter(destination, source).map_err(ConvertError::ExportError)?;
    exporter.export_palette(&palette).map_err(ConvertError::ExportError)?;

    Ok(())
}

```

<h5>Complex Syntax</h5>

Rust’s syntax is a mix of different paradigms, leading to inconsistencies. While
low-level languages don’t need to be "pretty," Rust’s design choices don’t
always feel intuitive. Even more so, that Rust doesn't have the limitations that
parsers did have years ago.

```rust
enum Payment {
    Cash(f64),
    CreditCard(String, String),
    Bitcoin { address: String },
}
```

<h5>Slow Compilation and Large Executables</h5>

Rust compiles everything into a single static binary, which is great for
deployment but leads to long compile times and bloated executables. This is
acceptable for small utilities, but problematic for larger applications.

<h5>Hard to Predict Performance for Low-Level Code</h5>

In C, experienced developers can easily estimate memory and CPU costs for
different constructs. In Rust, abstractions like closures, the `?` operator, and
trait objects obscure these costs, making fine-tuning difficult.

<h5>Lack of Clear Code Structuring</h5>

Rust’s module system feels scattered compared to the well-defined `.h/.c`
structure in C or even OOP patterns in C++. Even popular crates (`reqwest`,
`palette`) seem to lack a consistent organizational approach.

## When to (Not) Choose Rust

My experience now leans more towards understanding where Rust should not be used
rather than where it excels. Choosing Rust for `renk` was a mistake. I opted for
it because I saw many new, IO-bound projects using Rust and had a similar Python
program, thinking conversion would be easier than designing anew. However, Rust
is not ideal for IO-bound standard software. Its low-level nature doesn't
compete well with higher-level languages like Python, Ruby, or Java for such
tasks, as performance gains are negated by long IO calls.

A misleading example was [uv][], a tool for managing Python dependencies.
Despite its popularity, the benefits of using Rust didn't justify the
complexity, especially since the primary user community is Python-based and
couldn't contribute to a Rust project. I expect that features will be hard to
add, and performance gains are only notable with a _"warm cache"_, not your
typical use case. This is not a rant against [uv][], I've tried the tool and it
is awesome. Let's just see how it ages compared to [Poetry][] or [Hatch][].

Conversely, I totally support the choice of Rust for tools like [eza][] and
[zoxide][]. [eza][] is a modern ls alternative, and [zoxide][] enhances cd.
These commands, used frequently, must be quick and efficient. Rust provides a
stable foundation, and its strong typing, rigid syntax makes contributions
easier. Even the monolithic structure is here a plus.

I haven't evaluated Rust for server software, but it seems promising. Major
companies have already adopted it in this domain.

## Rust in Embedded Systems: A Reality Check

<h5>The Harsh Reality of Rust on ATtiny85</h5>

I went into this expecting challenges... not a total disaster. Just setting up a
Rust project for ATtiny85 meant dealing with:

- Confusing HALs (`avr-hal`, `attiny-hal`)
- Incompatible dependencies and undocumented feature flags
- Required nightly Rust and dealing with compilation errors with unstable
  features
- Toolchain struggles, undocumented linker flags
- Fragmented documentation with no existing real-world examples

Even with extensive experience in embedded systems (safety-compliant C, custom
bootloaders, assembly-level debugging), I found Rust’s embedded story a complete
mess. Once you have all pieced together, it makes sense. But until that point,
you're in the blue. You cannot argue about safety when dealing with nightly,
unsafe, and lack of documentation.

<h5>Why Rust Isn’t Ready for Embedded</h5>

- **Heavy reliance on unstable, `unsafe` code** defeats Rust’s safety promise.
- **Absence of documentation** lets you struggle alone in the blue at each
  issue.
- **Steep learning curve with minimal reward**, given the efficiency of
  well-written C.

That said, Rust **could** become viable in the future, especially for robust
top-layers applications. But today? Stick to C... and check my next article.

## Conclusion: Rust is Not a Silver Bullet

Rust is an interesting language, but it’s not a universal replacement for C or
Python. While it brings safety and reliability, it introduces complexity and
friction that make it unsuitable for many use cases.

<h5>Where Rust Works Well</h5>

- Small, performance-critical tools used frequently.
- Security-sensitive applications where memory safety is paramount.
- Large-scale backend systems needing high concurrency.

<h5>Where Rust Fails (For Now)</h5>

- General-purpose scripting and IO-bound tools.
- Embedded development, where stability and ecosystem maturity matter more than
  theoretical safety.

Rust is worth keeping an eye on. But for most projects? Stick to the right tool
for the job. Let the hype settle, and we’ll see where Rust stands in a couple of
years.

[eza]: https://github.com/eza-community/eza
[Hatch]: https://github.com/pypa/hatch
[Poetry]: https://python-poetry.org/
[uv]: https://github.com/astral-sh/uv
[zoxide]: https://github.com/ajeetdsouza/zoxide
[renk]: https://github.com/TehoorMarjan/renk
[attiny]: https://github.com/TehoorMarjan/attiny85-arduino-cmake-rust
