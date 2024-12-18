+++
date = '2024-12-15T23:41:59+01:00'
draft = false
slug = "manjaro-with-system-wide-encryption-and-btrfs"
title = 'Installing Manjaro With System-Wide Encryption and Btrfs'
categories = ["linux", "manjaro"]
tags = ["featured", "linux", "manjaro", "encryption", "btrfs"]
keywords = ["Manjaro", "System-Wide Encryption", "Btrfs", "Secure Boot", "Systemd"]
description = "Manjaro with System-Wide Encryption and Btrfs with Secure Boot and systemd boot"
image = "images/posts/2024-12-15-manjaro-with-system-wide-encryption-and-btrfs/header.webp"
author = "Tehoor Marjan"
+++

Installing [Manjaro Linux][5] with [system-wide encryption][8] and a modern
[Btrfs filesystem][7] can significantly enhance your system's security and
functionality. However, [the default GRUB configuration doesn't account for
non-US keymaps at boot][9], potentially causing headaches when entering your
encryption password. This guide walks you through setting up encryption,
replacing GRUB with [Systemd-boot][1], and configuring Secure Boot for increased
security (and _cooliness_ 😁).

## Step 1: Install Manjaro

Begin with a standard [Manjaro installation][6]:

- Choose **Btrfs** with **Swap in file**.
- Enable **System-Wide Encryption** and set your encryption key.
- Adjust other installation settings to your preference.
- Let the installation complete, but **do not reboot** yet. Uncheck _Reboot now_
  and stay in the live session.

## Step 2: Pre-Reboot Adjustments

### 2.1 _Optional:_ Enable Graphical Text Editor for `root`

For users less accustomed to command-line editors like `nano`, you can enable
the graphical editor `mousepad` in the live session:

1. Open the menu and go to **System > Add/Remove Software**.
2. Search for and install the package `xorg-xhost`.
3. In a terminal, as user, execute:

   ```bash
   xhost +
   ```

This allows `mousepad` instances launched from a `root` session to display in
the user’s graphical interface.

_Note: This change only affects the live session and does not weaken the future
installed system._

### 2.2 Mount and Enter the Installed System

First, mount your future system root and [step into it][4]:

```bash
sudo -i
mount /dev/mapper/luks-<UUID> /mnt -o subvol=/@
manjaro-chroot /mnt/
```

_(There is normally only one `luks-<UUID>` file. Type `/dev/mapper/luks-` then
`TAB` and it should properly complete the proper filename.)_

### 2.3 Fix the EFI Partition Mount Point

Edit `/etc/fstab` to update the mount point for the EFI partition: (Replace
`nano` with `mousepad` if you prefer a graphical editor.)

```bash
nano /etc/fstab
```

Change the line for the EFI partition to:

```plaintext
UUID=<EFI-UUID>  /efi  vfat  defaults,umask=0077  0  2
```

Then, create the necessary directory and mount all the remaining filesystems
(including the EFI):

```bash
mkdir /efi
mount -a
```

### 2.4 Replace GRUB with Systemd-boot

Remove GRUB and install [systemd-boot][1]. The latter is a lighter bootloader
that will be easier to configure with system-wide encryption, Secure Boot, and
[unified kernel images][2].

```bash
pacman -Rcs grub memtest86+-efi
bootctl install
```

### 2.5 Replace Busybox Initramfs with Systemd Initramfs {#busybox-2-systemd}

Switch to [systemd-based initramfs][3] for improved support of encryption,
hibernation, and localisation:

Edit `/etc/mkinitcpio.conf`:

```bash
nano /etc/mkinitcpio.conf
```

Remove the `/crypto_keyfile.bin` from the files included in the initramfs
because it will now be stored in the EFI partition, this means in unencrypted
space. Update the `HOOKS` line:

```bash
FILES=()
# ...
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block plymouth sd-encrypt filesystems)
```

### 2.6 Configure Unified Kernel Images

Configure mkinitcpio to create [unified kernel images][2] (UKI):

```bash
nano /etc/mkinitcpio.d/linux<kernel-version>.preset
```

Comment the default `<preset>_image=` instruction and uncomment instead the one
called `<preset>_uki=`:

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

### 2.7 Adjust Kernel Command Line

Adjust the kernel command line to properly support the encrypted system. For
[UKI][2] blobs, this is managed through files in `/etc/cmdline.d/`. To help us
write the parameters correctly, we define two variables:

- `UUID_DEV` is the UUID of the locked device.
- `UUID_ROOT` is the UUID of the root partition after being unlocked.

Run the following commands to set this up:

```bash
UUID_DEV=$(blkid -s UUID -o value /dev/sda2)
UUID_ROOT=$(blkid -s UUID -o value /dev/mapper/luks-${UUID_DEV})
mkdir /etc/cmdline.d/
echo "root=UUID=${UUID_ROOT} rw rootflags=subvol=/@ rd.luks.name=${UUID_DEV}=luks-${UUID_DEV}" > /etc/cmdline.d/00_root.conf
echo "quiet splash loglevel=3 rd.udev.logpriority=3 vt.globalcursor_default=0" > /etc/cmdline.d/10_quiet.conf
mkinitcpio -P
```

### 2.8 Recreate the Swapfile

The installer allocates a swap file that is often too small to support
hibernation. To ensure the system can hibernate properly, the swapfile should be
at least as large as the RAM size.

_Note: While smaller sizes might work in specific cases, this is outside the
scope of this article. For advanced configurations, you can inspect
`/sys/power/image_size` on the final system (not the live one)._

Recreate the swapfile with an appropriate size (adjust the size value to your
needs):

```bash
rm /swap/swapfile
btrfs filesystem mkswapfile --size 16g --uuid clear /swap/swapfile
```

### 2.9 Clean Up Encryption Keys

The busybox-based `encrypt` hook relies on `crypto_keyfile.bin` to unlock
multiple devices at boot, using GRUB to unlock the main device and the initramfs
to unlock others. However, the `sd-encrypt` hook in systemd can unlock multiple
devices using a shared password, making the keyfile unnecessary. Furthermore,
the keyfile would be stored unencrypted in the EFI partition when using
[systemd-boot][1], creating a potential security risk (that's why we removed it
from the initramfs at [step 2.5][10]).

Remove the keyfile to clean up:

```bash
cryptsetup luksRemoveKey /dev/sda2 /crypto_keyfile.bin
rm /crypto_keyfile.bin
```

## Step 3: Configure Secure Boot

### 3.1 Prepare Secure Boot Tools

Ensure your BIOS/UEFI is in **Setup Mode** to allow Secure Boot key enrollment.

```bash
pacman -Sy sbctl
sbctl status  # Check if Secure Boot is in Setup Mode
```

### 3.2 _Optional:_ Reboot

If your system is not in **Setup Mode**, you may reboot now to modify your UEFI
settings, your system is now already configured to reboot properly. If
`sbctl status` tells you that the system is in setup mode, then you may proceed
without rebooting right now.

### 3.3 Configure Secure Boot

1. _Optional:_ If you just booted you new system, open a terminal and become
   root again:

   ```bash
   sudo -i
   ```

2. Use `sbctl` to setup Secure Boot:

   ```bash
   sbctl setup
   sbctl create-keys
   sbctl enroll-keys -m
   ```

3. Check that all files involved in booting have been signed properly. If not,
   then sign them now.

   ```bash
   sbctl verify       # Identify unsigned files
   sbctl sign -s ...  # Sign all necessary files
   ```

4. Reboot again and activate Secure Boot in your BIOS/UEFI.

---

Done! You've successfully installed Manjaro with system-wide encryption, Btrfs,
Secure Boot, hibernation, keymap localisation at boot... 😎 Time to enjoy a cup
of coffee! _Cheers_ ☕

[1]: https://wiki.archlinux.org/title/Systemd-boot
[2]: https://wiki.archlinux.org/title/Unified_kernel_image
[3]: https://wiki.archlinux.org/title/Mkinitcpio#Common_hooks
[4]: https://wiki.archlinux.org/title/Chroot#Using_arch-chroot
[5]: https://manjaro.org/
[6]: https://manjaro.org/products/download/x86
[7]: https://wiki.manjaro.org/index.php/Btrfs
[8]:
  https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LUKS_on_a_partition
[9]:
  https://forum.manjaro.org/t/keyboard-layout-for-boot-encryption-password/115990

[10]: {{<ref "#busybox-2-systemd">}}
