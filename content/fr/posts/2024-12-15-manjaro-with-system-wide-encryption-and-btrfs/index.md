+++
date = '2024-12-15T23:41:59+01:00'
draft = false
slug = "manjaro-avec-btrfs-et-le-chiffrement-du-systeme-entier"
title = 'Installer Manjaro avec Btrfs et le chiffrement du système entier'
categories = ["linux", "manjaro"]
tags = ["featured", "linux", "manjaro", "encryption", "btrfs"]
keywords = ["Manjaro", "Chiffrement Système", "Btrfs", "Secure Boot", "Systemd"]
description = " Manjaro avec Btrfs et le chiffrement du système entier, Secure Boot et systemd-boot"
image = "/images/posts/2024-12-15-manjaro-with-system-wide-encryption-and-btrfs/header.webp"
author = "Tehoor Marjan"
+++

Installer [Manjaro Linux][5] avec un [chiffrement système complet][8] et un
système de fichiers moderne [Btrfs][7] peut renforcer considérablement la
sécurité et les fonctionnalités de votre système. Malheureusement, [la
configuration GRUB par défaut ne gère pas les claviers non-US au démarrage][9],
exposant l'utilisateur à une consommation excessive de Doliprane lors de la
saisie du mot de passe. Ce guide explique comment configurer le chiffrement,
remplacer GRUB par [Systemd-boot][1] et activer le Secure Boot pour une sécurité
accrue (et surtout un max de _coolitude_ 😁).

## Étape 1 : Installer Manjaro

Commencer par une [installation standard de Manjaro][6] :

- Choisir **Btrfs** avec **Swap en fichier**.
- Activer le **chiffrement système** et définir la clé de chiffrement.
- Ajuster les autres paramètres de l’installation selon les préférences.
- Laisser l’installation se terminer, mais **ne pas redémarrer**, pas encore.
  Décocher _Redémarrer maintenant_ et rester dans la session live.

## Étape 2 : Ajustements avant le redémarrage

### 2.1 _Optionnel_ : Activer un éditeur de texte graphique pour `root`

Pour les utilisateurs peu habitués aux éditeurs en ligne de commande comme
`nano`, il est possible d’activer l’éditeur graphique `mousepad` dans la session
live:

1. Ouvrir le menu et accéder à **Système > Ajouter/Retirer des logiciels**.
2. Rechercher et installer le paquet `xorg-xhost`.
3. Dans un terminal, exécuter en tant qu’utilisateur :

   ```bash
   xhost +
   ```

Cela permet aux instances de `mousepad` lancées depuis une session `root` de
s’afficher dans l’interface graphique de l’utilisateur.

_Remarque : ce changement n’affecte que la session live et ne compromet pas la
sécurité du système futur installé._

### 2.2 Entrer dans le système installé

Tout d’abord, monter la partition racine de votre futur système et [entrer
dedans][4] :

```bash
sudo -i
mount /dev/mapper/luks-<UUID> /mnt -o subvol=/@
manjaro-chroot /mnt/
```

_(Il n'y a normalement qu'un seul fichier `luks-<UUID>`. Taper
`/dev/mapper/luks-` puis `TAB` devrait compléter correctement le nom du
fichier)_

### 2.3 Corriger le point de montage de la partition EFI

Éditer `/etc/fstab` pour mettre à jour le point de montage de la partition EFI :
(Remplacez `nano` par `mousepad` si vous préférez un éditeur graphique.)

```bash
nano /etc/fstab
```

Modifier la ligne correspondant à la partition EFI :

```plaintext
UUID=<EFI-UUID>  /efi  vfat  defaults,umask=0077  0  2
```

Ensuite, créer le répertoire nécessaire et monter toutes les autres systèmes de
fichiers (dont EFI) :

```bash
mkdir /efi
mount -a
```

### 2.4 Remplacer GRUB par Systemd-boot

Supprimer GRUB et installer [systemd-boot][1]. Ce dernier est un chargeur
d’amorçage plus léger et plus facile à configurer avec le chiffrement système,
Secure Boot et les [images noyau unifiées (UKI)][2].

```bash
pacman -Rcs grub memtest86+-efi
bootctl install
```

### 2.5 Remplacer l’initramfs Busybox par celui de Systemd {#busybox-2-systemd}

Passer à l’[initramfs basé sur systemd][3] pour une meilleure prise en charge du
chiffrement, de l’hibernation et de la localisation :

Éditer `/etc/mkinitcpio.conf` :

```bash
nano /etc/mkinitcpio.conf
```

Supprimer le fichier `/crypto_keyfile.bin` des fichiers inclus dans l’initramfs,
car il sera désormais stocké dans la partition EFI (non chiffrée). Mettre à jour
la ligne `HOOKS` :

```bash
FILES=()
# ...
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block plymouth sd-encrypt filesystems)
```

### 2.6 Configurer les images noyau unifiées

Configurer mkinitcpio pour créer des [images noyau unifiées][2] (UKI) :

```bash
nano /etc/mkinitcpio.d/linux<kernel-version>.preset
```

Commenter l’instruction `<preset>_image=` par défaut et décommenter celle
appelée `<preset>_uki=` :

```bash
#default_config="/etc/mkinitcpio.conf"
#default_image="/boot/initramfs-6.12-x86_64.img"
default_uki="/efi/EFI/Linux/manjaro-6.12-x86_64.efi"
#default_options="--splash /usr/share/systemd/bootctl/splash-manjaro.bmp"

#fallback_config="/etc/mkinitcpio.conf"
#fallback_image="/boot/initramfs-6.12-x86_64-fallback.img"
fallback_uki="/efi/EFI/Linux/manjaro-6.12-x86_64-fallback.efi"
fallback_options="-S autodetect"
```

### 2.7 Ajuster la ligne de commande du noyau

Adapter la ligne de commande du noyau pour prendre en charge correctement le
système chiffré. Pour les blobs [UKI][2], cela se gère via des fichiers dans
`/etc/cmdline.d/`. Pour faciliter l'écriture correcte des paramètres, on définit
deux variables :

- `UUID_DEV` est l’UUID du périphérique verrouillé.
- `UUID_ROOT` est l’UUID de la partition racine après déverrouillage.

Exécuter les commandes suivantes pour configurer tout ça :

```bash
UUID_DEV=$(blkid -s UUID -o value /dev/sda2)
UUID_ROOT=$(blkid -s UUID -o value /dev/mapper/luks-${UUID_DEV})
mkdir /etc/cmdline.d/
echo "root=UUID=${UUID_ROOT} rw rootflags=subvol=/@ rd.luks.name=${UUID_DEV}=luks-${UUID_DEV}" > /etc/cmdline.d/00_root.conf
echo "quiet splash loglevel=3 rd.udev.logpriority=3 vt.globalcursor_default=0" > /etc/cmdline.d/10_quiet.conf
mkinitcpio -P
```

### 2.8 Recréer le fichier swap

L’installateur crée un fichier swap souvent trop petit pour prendre en charge
l’hibernation. Pour garantir que le système puisse hiberner correctement, le
fichier swap doit être au moins aussi grand que la taille de la RAM.

_Remarque : Bien que des tailles plus petites puissent fonctionner dans certains
cas, cela dépasse le cadre de cet article. Pour des configurations avancées, il
est possible d’inspecter `/sys/power/image_size` sur le système final (pas celui
en live)._

Recréer le fichier swap avec une taille appropriée (adapter la valeur selon le
besoin) :

```bash
rm /swap/swapfile
btrfs filesystem mkswapfile --size 16g --uuid clear /swap/swapfile
```

### 2.9 Nettoyer les clés de chiffrement

Le hook `encrypt` basé sur busybox utilise `crypto_keyfile.bin` pour
déverrouiller plusieurs périphériques au démarrage. En fait, il laisse GRUB
déverrouiller le périphérique principal puis l’initramfs se sert du fichier clef
pour déverouiller les autres. Cependant, le hook `sd-encrypt` de systemd peut
déverrouiller plusieurs périphériques en utilisant un mot de passe partagé,
rendant ce fichier clef inutile. De plus, ce fichier sensible serait stocké non
chiffré dans la partition EFI lors de l’utilisation de [systemd-boot][1], ce qui
mettrait le concept de sécurité par terre (c’est pour ça qu'on l'a retiré de
l’initramfs à [l’étape 2.5][10]).

Supprimer le fichier clé pour nettoyer :

```bash
cryptsetup luksRemoveKey /dev/sda2 /crypto_keyfile.bin
rm /crypto_keyfile.bin
```

## Étape 3 : Configurer le Secure Boot

### 3.1 Préparer les outils pour le Secure Boot

S’assurer que le BIOS/UEFI est en **Mode Setup** pour permettre l’enregistrement
des clés Secure Boot.

```bash
pacman -Sy sbctl
sbctl status  # Vérifier si Secure Boot est en Mode Setup
```

### 3.2 _Optionnel_ : Redémarrer

Si le système n’est pas en **Mode Setup**, il est possible de redémarrer
maintenant pour modifier les paramètres UEFI, le système est déjà prêt pour
redémarrer correctement. Si `sbctl status` indique que le système est en Mode
Setup, il est possible de continuer sans redémarrage.

### 3.3 Configurer Secure Boot

1. _Optionnel_ : Si le nouveau système vient de démarrer, ouvrir un terminal et
   passer root à nouveau :

   ```bash
   sudo -i
   ```

2. Utiliser `sbctl` pour configurer le Secure Boot :

   ```bash
   sbctl setup
   sbctl create-keys
   sbctl enroll-keys -m
   ```

3. Vérifier que tous les fichiers impliqués dans le démarrage ont été
   correctement signés. Sinon, les signer maintenant.

   ```bash
   sbctl verify       # Identifier les fichiers non signés
   sbctl sign -s ...  # Signer tous les fichiers nécessaires
   ```

4. Redémarrer et activer le Secure Boot dans le BIOS/UEFI.

---

Eh bah voilà ! Vous avez installé avec succès Manjaro avec le chiffrement
système, Btrfs, Secure Boot, hibernation, prise en charge de la localisation
clavier au démarrage... 😎 Il n'y a plus qu'à boire une bonne bière ! _Santé_ 🍻

[1]: https://wiki.archlinux.org/title/Systemd-boot
[2]: https://wiki.archlinux.org/title/Unified_kernel_image
[3]: https://wiki.archlinux.org/title/Mkinitcpio_(Fran%C3%A7ais)#Hooks_communs
[4]: https://wiki.archlinux.org/title/Chroot_(Fran%C3%A7ais)#Avec_arch-chroot
[5]: https://manjaro.org/
[6]: https://manjaro.org/products/download/x86
[7]: https://wiki.manjaro.org/index.php/Btrfs
[8]:
  https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LUKS_on_a_partition
[9]:
  https://forum.manjaro.org/t/keyboard-layout-for-boot-encryption-password/115990

[10]: {{<ref "#busybox-2-systemd">}}
