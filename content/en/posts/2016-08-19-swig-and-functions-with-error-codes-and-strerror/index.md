+++
author = 'Cilyan Olowen'
categories = ['c', 'code', 'python']
date = '2016-08-19T08:30:05+01:00'
description = 'Integrate properly functions with error codes and strerror using SWIG wrapper'
draft = true
image = 'images/posts/2016-08-19-swig-and-functions-with-error-codes-and-strerror/header.webp'
keywords = ["swig", "strerror", "wrapper", "python"]
slug = 'swig-and-functions-with-error-codes-and-strerror'
tags = ['featured', 'python', 'SWIG', 'c', 'code']
title = 'SWIG and functions with error codes and strerror'
+++

[SWIG](http://www.swig.org/) is a wrapper generator that is able to connect
compiled libraries to a bunch of scripting languages. The process is mostly
automatic, but to tackle some corner cases, you have to help the generator do
the right thing. In my library, all functions would return an integer, which is
an error code. A special function, following the same behavior as
[strerror_r](http://linux.die.net/man/3/strerror_r), can be used to retrieve the
meaning of a special error code. This is a pretty usual mechanism for C code.
But that's not the way scripting languages work. In their world, functions are
rather supposed to raise exceptions.

_If you are familiar with SWIG, you may prefer to skip to the last section._

## Example Library

Let's imagine a small and simple library to serve as an example to the below
explanations. It has an `init` and a `do_something` functions. Both return a
special integer code that indicates whether the call was successful and if not,
which error happened. An `strerror`-like function is available to retrieve a
textual description for a given error code. That way, an application using our
library can display to its end-user a better explanation of what has gone wrong.

```c
/**
 * @brief Initialises the library
 *
 * @return 0 on success, or MYLIB_HANGOVER_ERROR if library cannot
 *         startup properly.
 */
int mylib_init( void );

/**
 * @brief Do something
 *
 * @return 0 on success, MYLIB_SUNNY_AFTERNOON_ERROR if the library feels
 *         lazy at the time of query.
 */
int mylib_do_something( void );

/**
 * @brief Retrieve the description for an error code
 *
 * @param[in] errorno The error code to check
 * @param[out] buf An allocated buffer where the description will be
 *                 copied
 * @param[in] buflen The maximum size of the buffer
 * @return Always 0 (success)
 */
int mylib_strerror_r(int errorno, char *buf, size_t buflen);

#define MYLIB_SUCCESS               (0)
#define MYLIB_HANGOVER_ERROR        (-1)
#define MYLIB_SUNNY_AFTERNOON_ERROR (-2)
```

## Basic Wrapping with SWIG

In our situation, a direct wrapping of the library will not work. Indeed, as
`mylib_strerror_r` is taking arguments as outputs, we need to instruct SWIG to
use them properly. This is done by injecting wrapping code at different
positions when the arguments pattern is found.

```c
/* Name of the resulting python library */
%module mylib

/* We need these SWIG-libraries to wrap strerror_r */
%include exception.i
%include typemaps.i

%{
#define SWIG_FILE_WITH_INIT
#include "mylib.h"
%}

/*
 * Change the "in" section when pattern "char *buf, size_t buflen" is
 * found. That section is used to prepare input arguments to the wrapped
 * function.
 * Instruct that for this pattern, no inputs are expected from the
 * scripting VM. Then, allocate a buffer to receive the output.
 * If buffer cannot be allocated, raise an exception to the scripting VM.
 */
%typemap(in, numinputs=0) (char *buf, size_t buflen) {
   $1 = (char*) malloc(255*sizeof(char));
   $2 = 255;
   if (!$1) {
      SWIG_exception_fail(SWIG_MemoryError, "Memory allocation error");
   }
}

/*
 * Change the "argout" section when pattern "char *buf, size_t buflen" is
 * found. That section is used to prepare the output that will be
 * returned to the scripting VM.
 * The buffer we created should be now filled with the output data.
 * We use the fragement SWIG_FromCharPtr to convert it to the usual
 * string data type the scripting VM understands.
 */
%typemap(argout,fragment="SWIG_FromCharPtr") (char *buf, size_t buflen) {
   %append_output(SWIG_FromCharPtr($1));
}

/*
 * The "free" section is used at the end of the wrapping to clear
 * custom-allocated variables. We need to clear our buffer there.
 */
%typemap(freearg) (char *buf, size_t buflen) {
   free($1);
}

/*
 * Get rid of the function prefixes, as the scripting language will use
 * the module's namespace.
 */
%rename("%(strip:[mylib_])s") "";

%include "mylib.h"
```

_Note: We could use `%new_array` and `%delete_array` to manage the buffer, which
would make the piece of code compatible with C++. But these macros do not handle
allocation failures (as of 3.0.8)._

```python
>>> import mylib
>>> mylib.init()
-1
>>> mylib.strerror_r(-1)
[0, 'Hangover error']
>>> mylib.MYLIB_HANGOVER_ERROR
-1
```

If we were lazy, the library could be used as it is now. As in C, we would just
compare the returned value and do some actions if it doesn't succeed.

```python
ret = mylib.init()
if ret != mylib.MYLIB_SUCCESS:
    raise RuntimeError(mylib.strerror_r(ret)[1])
```

But this is not how a module in expected to work in the world of scripting
languages.

## Raising Exceptions

What we want to do, is actually map the return value. We want SWIG to check the
return value and, if it is 0, return nothing. Else, it shall raise an exception.
If possible, we want some code that supports as many languages as possible. Not
just Python, for example, so no `PyErr_SetString`.

```c
/* Name of the resulting python library */
%module mylib

/* We need these SWIG-libraries to wrap strerror_r */
%include exception.i
%include typemaps.i

%{
#define SWIG_FILE_WITH_INIT
#include "mylib.h"
%}

/*
 * Map return value when it is an "int". If the returned value is not
 * 0, call strerror_r. Raise a runtime exception with the retrieved
 * message. If success, return nothing instead of the code.
 */
%typemap(out) int {
   if (result < 0) {
      char* errstr = (char*) malloc(255*sizeof(char));
      if (!errstr) {
         /* Accept behavior similar to glibc on memory allocation failure */
         SWIG_exception_fail(SWIG_RuntimeError, "Unknown error");
      }
      /* This function always returns SUCCESS */
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
 * Change the "in" section when pattern "char *buf, size_t buflen" is
 * found. That section is used to prepare input arguments to the wrapped
 * function.
 * Instruct that for this pattern, no inputs are expected from the
 * scripting VM. Then, allocate a buffer to receive the output.
 * If buffer cannot be allocated, raise an exception to the scripting VM.
 */
%typemap(in, numinputs=0) (char *buf, size_t buflen) {
   $1 = (char*) malloc(255*sizeof(char));
   $2 = 255;
   if (!$1) {
      SWIG_exception_fail(SWIG_MemoryError, "Memory allocation error");
   }
}

/*
 * Change the "argout" section when pattern "char *buf, size_t buflen" is
 * found. That section is used to prepare the output that will be
 * returned to the scripting VM.
 * The buffer we created should be now filled with the output data.
 * We use the fragement SWIG_FromCharPtr to convert it to the usual
 * string data type the scripting VM understands.
 */
%typemap(argout,fragment="SWIG_FromCharPtr") (char *buf, size_t buflen) {
   %append_output(SWIG_FromCharPtr($1));
}

/*
 * The "free" section is used at the end of the wrapping to clear
 * custom-allocated variables. We need to clear our buffer there.
 */
%typemap(freearg) (char *buf, size_t buflen) {
   free($1);
}

/*
 * Get rid of the function prefixes, as the scripting language will use
 * the module's namespace.
 */
%rename("%(strip:[mylib_])s") "";

%include "mylib.h"
```

Now, the library feels much more at home in the scripting ecosystem.

```python
>>> import mylib
>>> mylib.init()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
RuntimeError: Hangover error
>>> mylib.init()
>>> mylib.do_something()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
RuntimeError: Sunny afternoon error
>>> mylib.do_something()
>>> mylib.strerror_r(-1)
'Hangover error'
```
