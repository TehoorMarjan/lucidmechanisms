+++
author = 'Tehoor Marjan'
categories = ['code']
date = '2025-03-02T22:36:19+01:00'
description = "Rust est-il l'avenir de la programmation système ? Cette analyse approfondie explore ses forces, faiblesses et son applicabilité réelle, des outils CLI aux systèmes embarqués."
draft = false
image = 'images/posts/2025-03-02-rust-yes-but-not-everywhere/header.webp'
keywords = ['rust', 'avantages et inconvénients de rust', 'rust systèmes embarqués', 'sécurité mémoire rust', 'vitesse de compilation rust', 'rust pour débutants', 'problèmes de programmation rust']
slug = 'rust-oui-mais-pas-partout'
tags = ['code', 'rust', 'embedded-systems']
title = 'Rust, oui, mais pas partout'
+++

Rust est un langage de programmation système conçu pour offrir sécurité mémoire,
performance et concurrence. Il le fait grâce à des fonctionnalités telles que
l'_ownership_, le _borrowing_ et les _lifetimes_, permettant d'assurer la
sécurité mémoire dès la compilation sans nécessiter de ramasse-miettes. Cela
rend Rust particulièrement adapté aux applications critiques en performance et à
la programmation système, où la gestion manuelle de la mémoire est généralement
nécessaire. Ses abstractions "à coût nul" garantissent que les fonctionnalités
de haut niveau n'impliquent pas de surcharge à l'exécution, renforçant ainsi sa
performance. Son modèle de concurrence est conçu pour être sûr et efficace,
facilitant l'écriture de code concurrent sans les pièges habituels des _race
conditions_.

Rust gagne du terrain dans diverses industries grâce à sa fiabilité, ses
performances et sa sécurité mémoire. Des entreprises comme Microsoft, Amazon et
Google l’utilisent pour le cloud et les systèmes distribués, tandis que les
secteurs de l'aérospatiale et de l'automobile s'y intéressent pour ses garanties
de sécurité. Les industries de la finance, de la santé et du jeu vidéo
l'adoptent également pour ses avantages en matière de sécurité et d'efficacité.
De plus, il est exploré dans des domaines comme la blockchain, la robotique et
les systèmes embarqués, bien que son écosystème soit encore en développement.
Son adoption est principalement motivée par la nécessité d'un logiciel
performant et sûr.

Mais Rust tient-il toutes ses promesses ? Pour évaluer son applicabilité réelle,
je l’ai testé sur deux projets très différents : [Renk][renk], un outil en ligne
de commande pour gérer les palettes de couleurs, et un [projet sur un
microcontrôleur ATtiny85][attiny]. Les résultats ? L’un est devenu un monstre…
l’autre un cauchemar. 👾

## Deux projets de test

[Renk][renk] est un utilitaire en ligne de commande permettant de récupérer et
de convertir des palettes de couleurs. J'avais déjà écrit un outil similaire en
Python et je voulais voir si Rust pouvait être une bonne alternative pour ce
type de travail, en m’inspirant d’autres projets ayant fait une transition
similaire. _Ce n'était pas une bonne idée…_

J'ai aussi tenté d'utiliser Rust pour [programmer un ATtiny85][attiny], un petit
microcontrôleur AVR 8 bits. L'objectif était simple : faire clignoter une LED,
puis explorer comment Rust pouvait améliorer la sécurité dans un environnement
embarqué contraint. _Spoiler : réussir à allumer la LED c'était déjà un gros
combat._

## Ce que Rust fait bien

<h5>Performance</h5>

Rust offre d'excellentes performances, proches de celles du C, grâce à ses
abstractions "à coût nul" et à son contrôle précis de la mémoire. Cependant,
cela va un peu de soi pour un langage système, ce n'est pas non plus une
révolution.

<h5>Fiabilité du code</h5>

Le compilateur strict de Rust garantit que le code qui compile est souvent
correct. L'opérateur `?` impose une gestion rigoureuse des erreurs, réduisant
ainsi les problèmes à l’exécution. Ce modèle de sécurité fort rappelle le typage
strict de Python ou TypeScript, mais poussé à l'extrême. Sa gestion des erreurs
est bien meilleure que celle du C, mais ne rivalise pas avec celle du C++ ou
d’autres langages.

```rust
fn download_sources(url: String) -> Result<String, Error> {
    let response = get(url)?.error_for_status()?;
    let response_text = response.text()?;
    Ok(response_text)
}
```

<h5>Une nouvelle option pour la programmation bas niveau</h5>

Avant Rust, les principales options open-source pour la programmation système
étaient **C, C++ et Ada**. Rust introduit un nouveau paradigme avec des
garanties de sécurité mémoire, ce qui en fait un ajout intéressant.

## Les limites de Rust, et des frustrations

<h5>Gestion des erreurs fastidieuse</h5>

Contrairement au C++ (qui propose des exceptions structurées), Rust force une
propagation explicite des erreurs. C'est plus sûr, mais cela alourdit le code
avec beaucoup de constructions mal séparées.

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

<h5>Syntaxe complexe</h5>

La syntaxe de Rust mélange différents paradigmes, ce qui crée des incohérences.
Un langage bas niveau n’a pas besoin d’être "beau", mais les choix de Rust ne
sont pas toujours intuitifs. Surtout que Rust n'a plus les contraintes des
parsers de l'époque.

```rust
enum Payment {
    Cash(f64),
    CreditCard(String, String),
    Bitcoin { address: String },
}
```

<h5>Compilation lente et exécutables volumineux</h5>

Rust génère un unique binaire statique, ce qui est bien pour le déploiement,
mais entraîne des temps de compilation longs et des exécutables massifs.
Acceptable pour de petits outils, problématique pour de gros projets.

<h5>Performance difficile à prédire pour du code bas niveau</h5>

En C, les développeurs expérimentés peuvent facilement estimer les coûts mémoire
et CPU de différentes constructions. En Rust, les abstractions comme les
closures, l’opérateur `?` et les traits masquent ces coûts, rendant
l’optimisation plus complexe.

<h5>Manque de structuration claire du code</h5>

Le système de modules de Rust semble dispersé par rapport à la structure bien
définie des fichiers `.h/.c` en C ou même aux modèles de conception OOP en C++.
Même des crates populaires (`reqwest`, `palette`) manquent d'une organisation
cohérente.

## Quand (ne pas) choisir Rust

Mon expérience m'a finalement montré où Rust ne doit pas être utilisé plutôt que
là où il excelle. Avoir choisi Rust pour `renk` était une erreur. J’ai opté pour
lui en voyant de nombreux nouveaux projets liés à l'ES basculer sur Rust et en
pensant qu’adapter mon programme Python existant serait plus simple que de
repartir de zéro. Cependant, Rust n'est pas idéal pour les logiciels sans
grandes contraintes, mais très liés aux ES. Son approche bas niveau ne rivalise
pas avec des langages plus haut niveau comme Python, Ruby ou Java pour ce type
de tâches, car les gains de performance sont totalement annulés par les appels
d’entrée-sortie.

Un mauvais exemple (à mon sens), c'est [uv][], un outil de gestion des
dépendances Python. Malgré une popularité naissante, les avantages d’utiliser
Rust ne justifient pas la complexité ajoutée, surtout lorsque la communauté
principale d’utilisateurs est basée sur Python et ne peut donc pas facilement
contribuer à un projet Rust. Je vois venir des difficultés à ajouter des
fonctionnalités et côté gains de performance, ils ne sont perceptibles qu’avec
un _« cache chaud »_, ce qui ne correspond pas à l’usage typique. Ce n’est pas
une critique de [uv][], j’ai essayé l’outil et il est excellent. Il faudra juste
voir comment il évolue face à [Poetry][] ou [Hatch][].

À l’inverse, j’approuve totalement le choix de Rust pour des outils comme
[eza][] et [zoxide][]. [eza][] est une alternative moderne à `ls`, et [zoxide][]
améliore `cd`. Ces commandes, utilisées fréquemment, doivent être rapides et
efficaces. Rust offre une base stable, et son typage strict et sa syntaxe rigide
facilitent les contributions. Même sa structure monolithique est ici un
avantage.

Je n’ai pas encore évalué Rust pour les logiciels serveurs, mais il semble
prometteur. De grandes entreprises l'ont déjà adopté dans ce domaine.

## Rust dans les systèmes embarqués : À l'épreuve de la réalité

<h5>La dure réalité de Rust sur ATtiny85</h5>

Je m’attendais à des défis... pas à un désastre total. Configurer un projet Rust
pour ATtiny85 m'a confronté à :

- Une confusion totale des HALs (`avr-hal`, `attiny-hal`)
- Des dépendances incompatibles et des options non documentées
- L’obligation d’utiliser Rust nightly et de gérer des erreurs de compilation
  dues à des fonctionnalités instables
- Des difficultés avec la toolchain et des options de l’éditeur de liens non
  documentés
- Une documentation fragmentée et aucun exemple réel disponible

Même avec une expérience approfondie en systèmes embarqués (C critique,
bootloaders personnalisés, debug assembleur), j’ai trouvé l’écosystème embarqué
de Rust vraiment chaotique. Une fois toutes les pièces assemblées, ça fait du
sens, mais jusque-là, on est complètement perdu. Difficile de parler de sécurité
quand on doit utiliser nightly, `unsafe` et naviguer sans documentation.

<h5>Pourquoi Rust n’est pas prêt pour l’embarqué</h5>

- **Une dépendance excessive aux fonctionnalités instables et à `unsafe`**, ce
  qui annule sa promesse de sécurité.
- **Un manque de documentation**, obligeant à tâtonner à chaque problème
  rencontré.
- **Une courbe d’apprentissage abrupte pour un faible retour sur
  investissement**, comparé à l'efficacité d'un C bien écrit.

Cela dit, Rust **pourrait** devenir viable à l’avenir, notamment pour des
surcouches applicatives robustes. Mais aujourd’hui ? Restez sur C... et lisez
mon prochain article.

## Conclusion : Rust n’est pas une solution miracle

Rust est un langage intéressant, mais il n’est pas une solution universelle pour
remplacer C ou Python. S’il apporte sécurité et fiabilité, il introduit aussi
une complexité et des frictions qui le rendent inadapté à de nombreux cas
d’usage.

<h5>Où Rust fonctionne bien</h5>

- Petits outils critiques en performance, utilisés fréquemment.
- Applications nécessitant une forte sécurité mémoire.
- Backend à grande échelle nécessitant une haute concurrence.

<h5>Où Rust échoue (pour l’instant)</h5>

- Scripts généraux et outils basés sur l’IO.
- Développement embarqué, où la stabilité et la maturité de l’écosystème
  comptent plus que la sûreté théorique.

Rust mérite d’être suivi de près. Mais pour la plupart des projets ? Utilisez
l’outil adapté à la mission. Laissons l’effet de mode passer, et on verra où
Rust se positionne réellement dans un ou deux ans.

[eza]: https://github.com/eza-community/eza
[Hatch]: https://github.com/pypa/hatch
[Poetry]: https://python-poetry.org/
[uv]: https://github.com/astral-sh/uv
[zoxide]: https://github.com/ajeetdsouza/zoxide
[renk]: https://github.com/TehoorMarjan/renk
[attiny]: https://github.com/TehoorMarjan/attiny85-arduino-cmake-rust
