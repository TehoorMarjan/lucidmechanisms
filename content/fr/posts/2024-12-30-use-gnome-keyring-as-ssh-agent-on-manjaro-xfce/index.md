+++
author = 'Tehoor Marjan'
categories = ['linux', 'manjaro']
date = '2024-12-30T22:00:01+01:00'
description = 'Utiliser GNOME Keyring comme agent SSH sur Manjaro XFCE - La méthode facile !'
draft = false
image = 'images/posts/2024-12-30-use-gnome-keyring-as-ssh-agent-on-manjaro-xfce/header.webp'
keywords = ["Manjaro", "XFCE", "GNOME Keyring", "ssh-agent"]
slug = 'utiliser-gnome-keyring-comme-ssh-agent-sur-manjaro-xfce'
tags = ['featured', 'linux', 'manjaro', 'xfce', 'ssh-agent']
title = 'Utiliser GNOME Keyring comme agent SSH sur Manjaro XFCE'
+++

Utiliser GNOME Keyring sur XFCE sous Manjaro n'est pas compliqué, mais la
documentation de [ArchLinux][1] n'est pas adaptée et peut vous laisser vous
gratter la tête pendant des heures. Allez, ne perdez plus de cheveux, je vous
aide.

<!-- more -->

## Étape 1 : Empêcher XFCE de prendre le contrôle de ssh-agent

XFCE aime démarrer `ssh-agent` automatiquement, sauf qu'on veut GNOME Keyring.
On commence par lui coller deux baffes. Exécutez ceci dans votre terminal :

```bash
xfconf-query -c xfce4-session -p /startup/ssh-agent/enabled -n -t bool -s false
xfconf-query -c xfce4-session -p /startup/ssh-agent/type -n -t string -s ssh-agent
```

## Étape 2 : Désactiver les services GNOME dans XFCE

Assurez-vous que XFCE n'essaie pas de lancer les services GNOME tout seul non
plus. Allez dans **Session et démarrage > Avancé**, et décochez _Lancer les
services GNOME au démarrage_.

{{< image src="XFCE-disable-GNOME-services.png" alt="Désactiver les services GNOME dans XFCE" zoomable="true" >}}

Également dans **Applications au démarrage** :

{{< image src="XFCE-disable-GNOME-services-list.png" alt="Désactiver les services GNOME dans les applications au démarrage" zoomable="true" >}}

## Étape 3 : Activer `gcr-ssh-agent`

Maintenant, activez l'agent SSH de GNOME Keyring :

```bash
systemctl --user enable --now gcr-ssh-agent.socket
```

## Étape 4 : Corriger `SSH_AUTH_SOCK`

Malgré ce qui est écrit dans [l'article sur GNOME Keyring sur l'ArchWiki][1],
comme XFCE est lancé par LightDM en dehors de la session utilisateur SystemD, il
ne récupérera pas la variable d'environnement `SSH_AUTH_SOCK`. Donc même si
c'est écrit le contraire, vous devez définir la variable dans `~/.xprofile`. (Ce
fichier n'existe probablement pas encore dans votre HOME.)

```bash
echo 'export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/gcr/ssh"' >> ~/.xprofile
```

{{< notice "tip" >}}

Notez bien l'utilisation des guillemets simples, on ne veut pas développer la
variable (pas encore).

{{< /notice >}}

## Étape 5 : Vérifier le statut de GNOME Keyring

Assurez-vous que `gnome-keyring-daemon.service` est activé dans votre session
utilisateur (c'est normalement le cas).

```bash
systemctl --user status gnome-keyring-daemon.service
```

Si ce n'est pas le cas :

```bash
systemctl --user enable gnome-keyring-daemon.service
```

Et voilà. Facile ? Oui, enfin... Une fois qu'on sait comment faire, c'est sûr.

[1]: https://wiki.archlinux.org/title/GNOME/Keyring#SSH_keys
