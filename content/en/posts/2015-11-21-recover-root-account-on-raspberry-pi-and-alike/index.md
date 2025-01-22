+++
author = 'Cilyan Olowen'
categories = ['linux']
date = '2015-11-21T08:00:30+01:00'
description = 'An article on how to reset root password on a SD Card'
draft = false
image = 'images/posts/2015-11-21-recover-root-account-on-raspberry-pi-and-alike/header.webp'
keywords = ['root', 'password', 'recover', 'raspberrypi']
slug = 'recover-root-account-on-raspberry-pi-and-alike'
tags = ['encryption', 'linux', 'raspberrypi']
title = 'Recover Root Account on Raspberry Pi and Alike'
+++

_"Hey, Pal! How are you? Remember that little project I had on the
[CubieTruck](http://cubieboard.org/)? I resumed hacking on it. But it's a pity,
I lost my root password... I have to start all over again. Any chance you
remember what silly password we choose together?"_

If only it was the user's account password, it would be easy: log as root,
change the password on behalf of the user, done. That time, who is going to save
the root account? Is there any _rootroot_ account, by any chance? No. But don't
worry, we're going to hack into the root account nonetheless. But how? It's
Linux, it's super secure, it's the root account, I choose a
50-bits-of-entropy-random-super-secure password... Maybe. But almost any
security will fail, once the hacker has access to the hardware. And today, we're
the hacker!

## “Hack” into the hardware

Let's get access to the "hardware": unplug the SD card! Then, plug it into your
own system and mount the root partition of your Pi somewhere like `/tmp/Rasp`.
Further in this document, I will consider only rescuing the root account on a
flash card, but the exact same technique would work on any machine where you can
get access to the root partition outside of its original system. This means for
example unplugging the main hard drive and plugging it into another computer, or
booting a live distribution on the hardware from which you can mount the root
partition.

Some bits of theory. _For those who don't care, jump to next paragraph._ On a
Linux system, the `/etc/passwd` file stores the accounts information. Although
that file also contained the passwords some years ago, the `/etc/shadow` file
now takes care of them. The reason is that the information in the `/etc/passwd`
file is necessary for a lot of common tools such as `ls`, so that it isn't
possible to hide this file and it is actually readable from anyone on the
system. Of course, passwords are not stored in plain text, but still it weakens
the security as it allows anyone on the system to retrieve the hash and run an
offline attack, like brute forcing. That's why passwords are today stored in
another file, the `/etc/shadow`, which is only accessible to highly privileged
processes, _i.e._ root. The old password field in the `/etc/passwd` is now just
an "`x`", telling the system to ask `/etc/shadow` instead.

## Replace password

Now that the root partition is mounted on a foreign system, the original
permissions system that would prevent someone other than root to access and
modify the `/etc/shadow` doesn't hold any more. Some strategies suggest simply
emptying the password field, so that one could log into the account without
passwords. But to my experience, this doesn't work on systems with recent
protection policies. Let's not tickle the system too much, and try to find
something more elegant.

First, there is a `--root` option to the `passwd` utility, which you can
theoretically set to the mountpoint of the storage device

```bash
passwd -R /tmp/Rasp root
```

but it miserably failed in my case. Nevermind, let's do exactly the same, but
manually. With a plus point: we will learn something in the process.

In the `/etc/shadow`, the passwords are hashed and salted. The method, the salt
and the resulting hash are all stored in the form `$method_id$salt$hash`. We
can't decipher back the password, but now that we have access to the file, we
can change this hash to be the one of a new password. Something that we will
remember this time, if possible… After some research of a nice little tool to do
the job, I found out that the best was a simple python script. Just start a
python console and type

```python
$ python
Python 3.5.0 (default, Sep 20 2015, 11:28:25)
[GCC 5.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import crypt
>>> crypt.crypt('cilyan.org', crypt.mksalt(crypt.METHOD_SHA512))
'$6$2uhsNKMqZ/OoEfd6$7ihU49hjdfxb1O82fd5Kh2gJAvzWvUvFXS.yA/Wk6y.dO8cO/MBMWpJ4fyIol9BUYph.9seJ7wb2TqCjaaNHc.'
>>>

```

Above, `'cilyan.org'` is our new password, and the resulting string is exactly
what we have to place in the shadow file in the password field (just remember
not to include the quotes). I used the SHA512 algorithm, which should also be
standard to your system. You can check your standard method for your system as
follows:

```bash
grep ENCRYPT_METHOD /tmp/Rasp/etc/login.defs
```

Anyway, as the method used is stored in the file along the salt and hash, even
if it isn't the default one, you should be able to log in.

Replace the password in the shadow file, on the line for the root account, which
should now look something like this

```plaintext
root:$6$2uhsNKMqZ/OoEfd6$7ihU49hjdfxb1O82fd5Kh2gJAvzWvUvFXS.yA/Wk6y.dO8cO/MBMWpJ4fyIol9BUYph.9seJ7wb2TqCjaaNHc.:15735::::::
```

And if you are really, really lazy, you may just copy the above line, paste it
in your shadow file, and log onto your Raspberry Pi using the password
"`cilyan.org`"!
