+++
author = 'Cilyan Olowen'
categories = ['c', 'code', 'python']
date = '2016-08-19T08:30:05+01:00'
description = "Intégrer correctement des fonctions avec des codes d'erreur et strerror en utilisant le wrapper SWIG"
draft = false
image = 'images/posts/2016-08-19-swig-and-functions-with-error-codes-and-strerror/header.webp'
keywords = ['swig', 'strerror', 'wrapper', 'python']
slug = 'swig-et-les-fonctions-avec-codes-d-erreur-et-strerror'
tags = ['python', 'swig', 'c', 'code']
title = "SWIG et les fonctions avec codes d'erreur et strerror"
+++

[SWIG](http://www.swig.org/) est un générateur de code de glue (wrapper) capable
de connecter des bibliothèques compilées à un tas de langages de script. Le
processus est principalement automatique, mais pour gérer certains cas
particuliers, il faut aider le générateur à faire les choses correctement. Dans
ma bibliothèque, toutes les fonctions renvoient un entier, qui est un code
d'erreur. Une fonction spéciale, suivant le même comportement que
[strerror_r](http://linux.die.net/man/3/strerror_r), peut être utilisée pour
récupérer la signification d'un code d'erreur particulier. C'est un mécanisme
assez courant pour le code C. Mais ce n'est pas ainsi que fonctionnent les
langages de script. Dans leur monde, les fonctions sont plutôt censées lever des
exceptions.

_Si vous êtes familier avec SWIG, vous pouvez préférer [passer directement à la
dernière section]({{<ref "#lever-des-exceptions">}})._

## Bibliothèque d'exemple

Imaginons une petite bibliothèque simple pour servir d'exemple aux explications
ci-dessous. Elle a des fonctions `init` et `do_something`. Les deux renvoient un
code entier spécial qui indique si l'appel a réussi et sinon, quelle erreur
s'est produite. Une fonction de type `strerror` est disponible pour récupérer
une description textuelle d'un code d'erreur donné. De cette façon, une
application utilisant notre bibliothèque peut afficher à son utilisateur final
une meilleure explication de ce qui a mal tourné.

```c
/**
 * @brief Initialise la bibliothèque
 *
 * @return 0 en cas de succès, ou MYLIB_GUEULEDEBOIS_ERROR si la bibliothèque ne
 *         peut pas démarrer correctement (pour une raison inconnue...).
 */
int mylib_init( void );

/**
 * @brief Faire quelque chose
 *
 * @return 0 en cas de succès, MYLIB_VENDREDIAPREM_ERROR si la bibliothèque a
 *         une bonne excuse de ne pas le faire.
 */
int mylib_do_something( void );

/**
 * @brief Récupérer la description d'un code d'erreur
 *
 * @param[in] errorno Le code d'erreur à vérifier
 * @param[out] buf Un tampon alloué où la description sera copiée
 * @param[in] buflen La taille maximale du tampon
 * @return Toujours 0 (succès)
 */
int mylib_strerror_r(int errorno, char *buf, size_t buflen);

#define MYLIB_SUCCESS              (0)
#define MYLIB_GUEULEDEBOIS_ERROR   (-1)
#define MYLIB_VENDREDIAPREM_ERROR  (-2)
```

## Wrapping de base avec SWIG

Dans notre situation, un wrapping direct de la bibliothèque ne fonctionnera pas.
En effet, comme `mylib_strerror_r` prend des arguments en sortie, il faut guider
SWIG pour les utiliser correctement. Cela se fait en injectant du code de glue à
différentes positions lorsque SWIG tombe sur le motif d'arguments spécifié.

```c
/* Nom de la bibliothèque python résultante */
%module mylib

/* Nous avons besoin de ces bibliothèques SWIG pour wrapper strerror_r */
%include exception.i
%include typemaps.i

%{
#define SWIG_FILE_WITH_INIT
#include "mylib.h"
%}

/*
 * Changer la section "in" lorsque le motif "char *buf, size_t buflen" est
 * trouvé. Cette section est utilisée pour préparer les arguments d'entrée à la
 * fonction wrappée.
 * Indiquer que pour ce motif, aucune entrée n'est attendue de la part du
 * script. Ensuite, allouer un tampon pour recevoir la sortie.
 * Si le tampon ne peut pas être alloué, lever une exception côté script.
 */
%typemap(in, numinputs=0) (char *buf, size_t buflen) {
   $1 = (char*) malloc(255*sizeof(char));
   $2 = 255;
   if (!$1) {
      SWIG_exception_fail(SWIG_MemoryError, "Erreur d'allocation mémoire");
   }
}

/*
 * Changer la section "argout" lorsque le motif "char *buf, size_t buflen" est
 * trouvé. Cette section est utilisée pour préparer la sortie qui sera retournée
 * au script.
 * Le tampon que nous avons créé devrait maintenant être rempli avec les données
 * de sortie.
 * On utilise le fragment SWIG_FromCharPtr pour le convertir en type de données
 * 'string' habituel que le script comprend.
 */
%typemap(argout,fragment="SWIG_FromCharPtr") (char *buf, size_t buflen) {
   %append_output(SWIG_FromCharPtr($1));
}

/*
 * La section "free" est utilisée à la fin de la glue pour libérer les variables
 *  allouées de manière personnalisée. C'est ici que l'on libère le tampon.
 */
%typemap(freearg) (char *buf, size_t buflen) {
   free($1);
}

/*
 * Se débarrasser des préfixes de fonction, car le langage de script utilisera
 * l'espace de nom du module.
 */
%rename("%(strip:[mylib_])s") "";

%include "mylib.h"
```

_Remarque : Nous pourrions utiliser `%new_array` et `%delete_array` pour gérer
le tampon, ce qui rendrait le code compatible avec C++. Mais ces macros ne
gèrent pas les échecs d'allocation (en tous cas avec la version 3.0.8)._

```python
>>> import mylib
>>> mylib.init()
-1
>>> mylib.strerror_r(-1)
[0, 'Erreur de gueule de bois']
>>> mylib.MYLIB_GUEULEDEBOIS_ERROR
-1
```

Si nous étions paresseux, la bibliothèque pourrait être utilisée telle quelle.
Comme en C, il suffirait de comparer la valeur retournée et de faire des actions
la valeur indique une erreur.

```python
ret = mylib.init()
if ret != mylib.MYLIB_SUCCESS:
    raise RuntimeError(mylib.strerror_r(ret)[1])
```

Mais ce n'est pas comme ça qu'un module est censé fonctionner dans le monde des
langages de script.

## Lever des exceptions

Ce que nous voulons faire, c'est en fait transformer la valeur de retour. Nous
voulons que SWIG vérifie la valeur de retour et, si elle est 0, ne retourne
rien. Sinon, il doit lever une exception. Si possible, nous voulons un code qui
supporte autant de langages que possible. Pas seulement Python, par exemple,
donc pas de `PyErr_SetString`.

```c
/* Nom de la bibliothèque python résultante */
%module mylib

/* Nous avons besoin de ces bibliothèques SWIG pour wrapper strerror_r */
%include exception.i
%include typemaps.i

%{
#define SWIG_FILE_WITH_INIT
#include "mylib.h"
%}

/*
 * Transformer la valeur de retour lorsqu'elle est un "int". Si la valeur
 * retournée n'est pas 0, appeler strerror_r. Lever une exception d'exécution
 * avec le message récupéré. En cas de succès, ne rien retourner à la place du
 * code d'erreur.
 */
%typemap(out) int {
   if (result < 0) {
      char* errstr = (char*) malloc(255*sizeof(char));
      if (!errstr) {
         /* Adopter un comportement similaire à glibc en cas d'échec
          * d'allocation mémoire lors de la gestion d'erreur. */
         SWIG_exception_fail(SWIG_RuntimeError, "Erreur inconnue");
      }
      /* Cette fonction retourne toujours SUCCESS */
      (void) mylib_strerror_r(result, errstr, 255);
      SWIG_exception(SWIG_RuntimeError, errstr);
      free(errstr);
      SWIG_fail;
   }
#if defined(VOID_Object)
   $result = VOID_Object;
#endif
}

/*
 * Changer la section "in" lorsque le motif "char *buf, size_t buflen" est
 * trouvé. Cette section est utilisée pour préparer les arguments d'entrée à la
 * fonction wrappée.
 * Indiquer que pour ce motif, aucune entrée n'est attendue de la part du
 * script. Ensuite, allouer un tampon pour recevoir la sortie.
 * Si le tampon ne peut pas être alloué, lever une exception côté script.
 */
%typemap(in, numinputs=0) (char *buf, size_t buflen) {
   $1 = (char*) malloc(255*sizeof(char));
   $2 = 255;
   if (!$1) {
      SWIG_exception_fail(SWIG_MemoryError, "Erreur d'allocation mémoire");
   }
}

/*
 * Changer la section "argout" lorsque le motif "char *buf, size_t buflen" est
 * trouvé. Cette section est utilisée pour préparer la sortie qui sera retournée
 * au script.
 * Le tampon que nous avons créé devrait maintenant être rempli avec les données
 * de sortie.
 * On utilise le fragment SWIG_FromCharPtr pour le convertir en type de données
 * 'string' habituel que le script comprend.
 */
%typemap(argout,fragment="SWIG_FromCharPtr") (char *buf, size_t buflen) {
   %append_output(SWIG_FromCharPtr($1));
}

/*
 * La section "free" est utilisée à la fin de la glue pour libérer les variables
 *  allouées de manière personnalisée. C'est ici que l'on libère le tampon.
 */
%typemap(freearg) (char *buf, size_t buflen) {
   free($1);
}

/*
 * Se débarrasser des préfixes de fonction, car le langage de script utilisera
 * l'espace de nom du module.
 */
%rename("%(strip:[mylib_])s") "";

%include "mylib.h"
```

Maintenant, on a une bibliothèque bien plus intégrée à un environnement de
script.

```python
>>> import mylib
>>> mylib.init()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
RuntimeError: Erreur de gueule de bois
>>> mylib.init()
>>> mylib.do_something()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
RuntimeError: Erreur de vendredi aprèm
>>> mylib.do_something()
>>> mylib.strerror_r(-1)
'Erreur de gueule de bois'
```
