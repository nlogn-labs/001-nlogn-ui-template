# Third-party notices

This project consumes components from five component libraries. They are **not
all under the same terms**, and that difference changes what this repository is
allowed to contain. Read this before you publish a fork.

## Fetched at setup — not redistributed here

These are **git-ignored** and installed by `npm run setup` from the libraries'
own registries, because their licences do not permit this repository to
redistribute their source.

| Library | Components | Licence | The relevant restriction |
| --- | --- | --- | --- |
| [React Bits](https://reactbits.dev) | `Threads`, `BlurText` | MIT + Commons Clause | *"You may use this Software, including for any commercial purpose, so long as you do not sell, sublicense, or redistribute the components themselves — whether alone, in a bundle, or as a ported version."* |
| [Aceternity UI](https://ui.aceternity.com) | `3D Card`, `Spotlight` | Aceternity licence | *"You cannot re-distribute the Item as a stock image or its source files"*, and *"You cannot create themes, templates, or derivative products to sell on any marketplace."* |

Shipping those files inside a public template repository would be redistributing
them in a bundle. `npm run setup` installs them into your own working copy
instead, which is ordinary use.

If you fork this project, **keep them git-ignored**. `.gitignore` already does
this; don't remove those entries.

## Included in this repository

These are plain MIT, which explicitly permits redistribution provided the
copyright notice travels with the code. They are committed and pinned so an
upstream change cannot silently break the wrappers built on them.

| Library | Components | Copyright |
| --- | --- | --- |
| [Cult UI](https://www.cult-ui.com) | `Hero Liquid Metal` | Copyright (c) 2023 Jordan-Gilliam — MIT |
| [Magic UI](https://magicui.design) | `Animated Beam` | Copyright (c) Magic UI — MIT |
| [Kokonut UI](https://kokonutui.com) | `Liquid Glass Card`, `Hold Button` | Copyright (c) 2025 kokonutUI — MIT |
| [shadcn/ui](https://ui.shadcn.com) | `button`, `card`, `badge` | Copyright (c) 2023 shadcn — MIT |

Their full MIT text is reproduced by the licence above; each grants permission
to use, copy, modify, publish, distribute, sublicense and sell, with the notice
included.

## Runtime dependencies

`motion`, `ogl`, `@paper-design/shaders-react`, `lucide-react`,
`class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`, `next`,
`react` and `tailwindcss` are installed from npm under their own licences and
are not vendored here.

## Fonts

Schibsted Grotesk and JetBrains Mono are served through `next/font/google` and
are licensed under the SIL Open Font License.

## Not legal advice

This file records what the upstream licences say and how this repository is
arranged in response. If you intend to sell something built on it, read the
licences yourself.
