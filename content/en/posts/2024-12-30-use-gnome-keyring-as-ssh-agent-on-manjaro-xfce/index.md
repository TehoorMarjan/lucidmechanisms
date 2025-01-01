+++
author = 'Tehoor Marjan'
categories = ['linux', 'manjaro']
date = '2024-12-30T22:00:01+01:00'
description = 'Use GNOME Keyring as ssh-agent on Manjaro XFCE - The easy way!'
draft = false
image = 'images/posts/2024-12-30-use-gnome-keyring-as-ssh-agent-on-manjaro-xfce/header.webp'
keywords = ['Manjaro', 'XFCE', 'GNOME Keyring', 'ssh-agent']
slug = 'use-gnome-keyring-as-ssh-agent-on-manjaro-xfce'
tags = ['linux', 'manjaro', 'xfce', 'ssh-agent']
title = 'Use GNOME Keyring as SSH Agent on Manjaro XFCE'
+++

Using GNOME Keyring on XFCE on Manjaro is not complicated, but the documentation
of [ArchLinux][1] doesn't apply and you can scratch your head for a few hours
before getting what you want. Well, loose no more hair, here are the simple
steps.

<!-- more -->

## Step 1: Stop XFCE from Hijacking ssh-agent

XFCE likes to start `ssh-agent` on its own, but we need it to chill and let
GNOME Keyring step forward. Run this in your terminal:

```bash
xfconf-query -c xfce4-session -p /startup/ssh-agent/enabled -n -t bool -s false
xfconf-query -c xfce4-session -p /startup/ssh-agent/type -n -t string -s ssh-agent
```

## Step 2: Disable GNOME Services in XFCE

Make sure XFCE isn’t trying to start GNOME services itself. Go to **Session and
Startup > Advanced**, and uncheck _Launch GNOME services on startup_. Like this:

{{< image src="XFCE-disable-GNOME-services.png" alt="XFCE disable GNOME services" zoomable="true" >}}

Also in **Application Autostart**:

{{< image src="XFCE-disable-GNOME-services-list.png" alt="XFCE disable GNOME services in autostart" zoomable="true" >}}

## Step 3: Enable `gcr-ssh-agent`

Now, activate the GNOME Keyring SSH agent:

```bash
systemctl --user enable --now gcr-ssh-agent.socket
```

## Step 4: Fix `SSH_AUTH_SOCK`

Despite what is written on [the article about GNOME Keyring on the ArchWiki][1],
because XFCE is started by LightDM aside from your SystemD user session, it will
not pick up the `SSH_AUTH_SOCK` environment variable. To do that, you need to
set it in `~/.xprofile`. (This file probably doesn't even exists in your HOME.)

```bash
echo 'export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/gcr/ssh"' >> ~/.xprofile
```

{{< notice "tip" >}}

Mind the use of single quotes, you don't want the variable to expand (yet).

{{< /notice >}}

## Step 5: Check GNOME Keyring Status

Ensure that `gnome-keyring-daemon.service` is enabled on your user session (this
is normally the case).

```bash
systemctl --user status gnome-keyring-daemon.service
```

If not,

```bash
systemctl --user enable gnome-keyring-daemon.service
```

That's it. Easy? Yeah, well... When you know how, sure.

[1]: https://wiki.archlinux.org/title/GNOME/Keyring#SSH_keys
