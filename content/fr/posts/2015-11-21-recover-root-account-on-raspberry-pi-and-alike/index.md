+++
author = 'Cilyan Olowen'
categories = ['linux']
date = '2015-11-21T08:00:30+01:00'
description = 'Un article sur comment réinitialiser le mot de passe root sur une carte SD'
draft = false
image = 'images/posts/2015-11-21-recover-root-account-on-raspberry-pi-and-alike/header.webp'
keywords = ['root', 'password', 'recover', 'raspberrypi']
slug = 'recuperer-le-compte-root-sur-raspberry-pi-et-similaires'
tags = ['encryption', 'linux', 'raspberrypi']
title = 'Récupérer le compte Root sur RaspberryPi et similaires'
+++

_"Salut, l'ami ! Comment ça va ? Tu te souviens de ce petit projet que j'avais
sur le [CubieTruck](http://cubieboard.org/)? Je m'y suis remis. Mais c'est
dommage, j'ai perdu mon mot de passe root... Je vais devoir tout recommencer. Tu
te souviendrais du mot de passe idiot qu'on avait choisi ensemble par hasard ?"_

Si seulement c'était le mot de passe du compte utilisateur, ce serait facile :
se connecter en tant que root, changer le mot de passe pour l'utilisateur,
terminé. Mais cette fois, qui va sauver le compte root ? Est-ce qu'il y aurait
par hasard un compte _rootroot_ ? Non. Mais ne vous inquiétez pas, nous allons
tout de même pirater le compte root. Mais comment ? C'est Linux, c'est super
sécurisé, c'est le compte root, j'ai choisi un mot de passe super sécurisé avec
50 bits d'entropie aléatoire... Peut-être. Mais presque n'importe quelle
sécurité échoue une fois que le pirate a accès au matériel. Et aujourd'hui, nous
sommes les pirates !

## « Hacker » le matériel

Obtenons l'accès au "matériel" : débranchez la carte SD ! Ensuite, branchez-la
sur votre propre système et montez la partition root de votre Pi quelque part,
par exemple dans `/tmp/Rasp`. Dans ce document, je vais me concentrer sur la
récupération du compte root sur une carte flash, mais la même technique
fonctionnerait sur n'importe quelle machine où vous pouvez accéder à la
partition root en dehors de son système d'origine. Cela signifie, par exemple,
débrancher le disque dur principal et le brancher sur un autre ordinateur, ou
démarrer sur le matériel une distribution live à partir de laquelle vous pouvez
monter la partition root.

Quelques points de théorie. _Pour ceux que cela n'intéresse pas, passez au
paragraphe suivant._ Sur un système Linux, le fichier `/etc/passwd` stocke les
informations des comptes. Ce fichier contenait également les mots de passe il y
a quelques années, mais ils sont dans le fichier `/etc/shadow` désormais. La
raison est que les informations dans le fichier `/etc/passwd` sont nécessaires à
de nombreux outils (très) courants, même `ls`, il n'est donc pas possible de
refuser l'accès à ce fichier et il est en fin de compte accessible en lecture à
tous les utilisateurs du système. Bien sûr, les mots de passe ne sont pas
stockés en texte clair, mais cela affaiblit tout de même la sécurité car cela
permet à quiconque sur le système de récupérer le hash et d'effectuer une
attaque hors ligne, comme une attaque par force brute. C'est pourquoi les mots
de passe sont aujourd'hui stockés dans un autre fichier, le `/etc/shadow`, qui
n'est accessible qu'à des processus hautement privilégiés, _c'est-à-dire_ root.
L'ancien champ de mot de passe dans le `/etc/passwd` n'est maintenant plus qu'un
"`x`", indiquant au système de consulter le fichier `/etc/shadow` à la place.

## Remplacer le mot de passe

Maintenant que la partition root est montée sur un système qui n'est pas le
sien, le système de permissions d'origine qui empêcherait quelqu'un d'autre que
root d'accéder et de modifier le fichier `/etc/shadow` ne s'applique plus.
Certaines stratégies voudraient simplement vider le champ de mot de passe,
permettant ainsi de se connecter au compte sans mot de passe. Mais d'après mon
expérience, cela ne fonctionne pas sur les systèmes avec des politiques de
protection récentes. Ne chatouillons pas trop le système, essayons de trouver
quelque chose de plus élégant.

Tout d'abord, il existe une option `--root` pour l'utilitaire `passwd`, que vous
pouvez théoriquement définir sur le point de montage du lecteur de stockage :

```bash
passwd -R /tmp/Rasp root
```

Mais dans mon cas, ça n'a pas du tout fonctionné. Peu importe, faisons
exactement la même chose, mais manuellement. Avec un avantage supplémentaire :
nous allons apprendre quelque chose dans le processus.

Dans le fichier `/etc/shadow`, les mots de passe sont hashés et salés (miam...).
La méthode, le sel et le hash résultants sont tous stockés sous la forme
`$method_id$sel$hash`. Nous n'allons pas déchiffrer le mot de passe, mais
maintenant que nous avons accès au fichier, on peut changer ce hash pour être
celui d'un nouveau mot de passe. Quelque chose qu'on ne va pas oublier ce
coup-ci, si possible… Après quelques recherches d'un petit outil pratique pour
faire le travail, j'ai découvert que le meilleur était un simple script Python.
Il suffit de démarrer une console Python et de taper :

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

Ci-dessus, `'cilyan.org'` est notre nouveau mot de passe, et la chaîne
résultante correspond exactement à ce que nous devons placer dans le fichier
shadow dans le champ mot de passe (n'oubliez pas quand même d'enlever les
guillemets). J'ai utilisé l'algorithme SHA512, qui devrait également être
standard sur votre système. Vous pouvez vérifier la méthode standard de votre
système comme suit :

```bash
grep ENCRYPT_METHOD /tmp/Rasp/etc/login.defs
```

De toute façon, comme la méthode utilisée est stockée dans le fichier avec le
sel et le hash, même si ce n'est pas la méthode par défaut, vous devriez pouvoir
vous connecter.

Remplacez le mot de passe dans le fichier `shadow`, sur la ligne du compte root,
qui devrait maintenant ressembler à ceci :

```plaintext
root:$6$2uhsNKMqZ/OoEfd6$7ihU49hjdfxb1O82fd5Kh2gJAvzWvUvFXS.yA/Wk6y.dO8cO/MBMWpJ4fyIol9BUYph.9seJ7wb2TqCjaaNHc.:15735::::::
```

Et si vous êtes vraiment, vraiment paresseux, vous pouvez simplement copier la
ligne ci-dessus, la coller dans votre fichier shadow, et vous connecter à votre
Raspberry Pi en utilisant le mot de passe "`cilyan.org`" !
