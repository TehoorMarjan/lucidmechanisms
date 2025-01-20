+++
author = 'Tehoor Marjan'
categories = ['creation', 'laser-cutter', 'inkscape']
date = '2025-01-15T02:40:20+01:00'
description = 'Learn how to create a stunning multi-layer greeting card using Inkscape and a laser cutter. This fun and engaging DIY tutorial guides you step by step!'
draft = true
image = 'images/posts/2025-01-15-a-step-by-step-guide-to-making-a-3d-greeting-card/header.webp'
keywords = ['creation', 'laser-cutter', 'inkscape', 'lightburn', 'greeting-card', 'embossing', 'diy']
slug = 'a-step-by-step-guide-to-making-a-3d-greeting-card'
tags = ['creation', 'laser-cutter', 'inkscape', 'design']
title = 'Let’s Get Creative: A Step-by-Step Guide to Making a 3D Greeting Card'
+++

On a cold winter day, when the weather keeps you indoors, why not dive into a
cozy and creative project? Let’s make a greeting card that’s not only fun to
craft but also a joy to share with loved ones! In this tutorial, we’ll combine
artistic flair with technology to create a 3D layered greeting card. Using
Inkscape and a laser cutter, you can craft a card that pops with depth and
color. If you don’t have a laser cutter, no worries—this project works with any
cutting tool (but be nice on yourself and keep from complicated cuts if you plan
to use a craft knife!).

<!-- more -->

{{< accordion title="What You’ll Need" class="active">}}

<p class="text-xl font-bold">Tools</p>

- **Inkscape** or your preferred vector graphic software,
- **Laser cutter** or another cutting tool (e.g., craft knife or Cricut
  machine),
- **Printer**.

<p class="text-xl font-bold">Materials</p>

- **Paper**: Use thick cardstock for a better effect (220 gr/m² for example).
- **Glue**: Spray adhesive or stick glue.
- **Paint and Glitter** _(optional)_: For extra flair.

{{< /accordion >}}

Let's get into the fun. Take a quick look at the process to plan ahead and make
the most of your crafting time. There's enough to think about in each step, but
on the other hand it may be good having a glimpse at what is coming next in
order to avoid bad decisions. We’ll design a card with layers that create depth,
so when you have choice, think about how the layers will be printed, cut and
glued on top of each other.

## Design Your Card in Inkscape

Start by creating a design with multiple layers to give your card depth. For
instance, in our example, the layers include:

- A night sky with the moon and the year “2025” (base layer),
- Mountains,
- Hills,
- A small house,
- A foreground with snowy hills (top layer).

{{< youtube-lite id="qLugss9dOag" class="mx-auto my-6 max-w-lg" >}}

{{< notice "tip" >}}

**Think in Layers**, divide your design into background, middle, and foreground
elements.

If you’re out of ideas, browse online for inspiration or ask AI tools for help
creating a layered design. Remember, this step is all about creativity!

{{< /notice >}}

{{<notice "important">}}

For dimensions, mind

- **Printing Margins**: The capabilities of your printer.
- **Cut Margins**: The precision of your cutting tool, you may want to leave
  some millimeters of drawing around the cutting path ([check how to extend
  layers]({{<ref "#extending-layers">}}))
- **Cutting Work Area**: Although it is possible to realize cuts in several
  steps, it's way more complex.

{{< /notice >}}

## Prepare The Layers

### Separate Layers in Inkscape

Divide your design into separate layers. For example, create layers for the sky,
mountains, hills, and foreground.

Inkscape now allows multipage documents. Basically, you will want to create a
page for each layer. On some occasions, two layers can fit on the same page, in
my case layer 3 is small enough to fit layer 5 above it. This saves a bit of
paper. On older versions of Inkscape, you may create a document per page, but
you will soon notice that having all in a single window makes the process a lot
easier.

### Prepare The Cuts{#extending-layers}

For each layer, create the shape(s) that defines where the layer is to be cut. I
like to make the stroke of these shapes `red`, because my cutting tool
[LightBurn][lightburn] identify these as cut paths. (I could use `blue` too,
just a habit...)

Unless you have a super good laser (or cutting tool) and you are confident it is
"point-perfect", the cut will most likely be a bit off with the print. That's
why you'll want to expand your drawing slightly over the layer borders. That
way, even if the cut is a bit off, there will not be a (sometimes not so) thin
white border that you would need to trim later.

{{< notice "tip">}}

During design, when you want to cut some shapes to the layer borders, rather use
a _clipping mask_ than a boolean operation. That way, when planning the print,
you can offset the clipping mask a touch.

{{< /notice >}}

{{< notice "important" >}}

Remember that upper layers will be glued on top of lower layers. That means that
the lower layer's material must include the upper layer's footprint, even if
there is no drawing on these areas.

{{< /notice >}}

### _Optional:_ Calibration Targets

{{< image src="images/posts/2025-01-15-a-step-by-step-guide-to-making-a-3d-greeting-card/example_target.png" alt="Calibration Target" position="float-right" class="w-32" title="Calibration Target" >}}

Conveniently, you may add small calibration marks outside the visible area to
help align your prints during cutting. I like to make a cross in a circle. This
is because LightBurn takes reference from the center of the selected object, so
a circle is best, and the cross allows pointing the laser precisely at this
center.

### Printing Layers{.clear-both}

**For printing**, I find it often better to export the SVG from Inkscape into
PDF first. Nowadays, many printers directly accept PDF files (additionally to
PostScript) as their input, which is good because PDF is meant to be rendered
the same whatever the medium. This is a good step to ensure that every detail is
fine: fonts if you did not convert text to path, gradients, filters like blurs,
cutting paths still showing 🤭...

### Export for Cutting

**For cutting**, it is doubtful that the cutting software will know how to
handle multipage documents. Using the _Export_ dialogue of Inkscape, you can
_Batch Export_ each page into an individual SVG document. In each document, you
will probably want to remove all the graphic elements, keeping only the cutting
paths and the targets.

## _Optional:_ Prepare Some Stencils

You may want to add specific manual touches to your final design. For example, I
like to use golden paint and glitter to give the card extra sparkle. Both
involve spraying —golden paint spray and glue spray for glitter— onto specific
areas.

Using Inkscape, you can create stencils to use as spray masks. This allows you
to apply paint or glitter precisely where you want it.

Depending on your desired outcome, decide whether to apply the stencils before
or after cutting the layers.

## Cut The Stencils And Layers

This step depends heavily on the software and hardware you’re using. If you feel
adventurous, you may try [gcodetools][gcodetools] directly from Inkscape to
generate the cutting instructions
([<i class="fa-brands fa-wikipedia-w text-sm"></i> G-Code][gcode]). You can use
your targets to fine-tune the coordinates. You’ll need software like
[bCNC][bcnc] or [Pronterface][printrun] to send the code to your cutter. Good
luck 🍀.

Other popular options are:

- [**LightBurn**][lightburn]: A versatile tool compatible with many laser
  cutters. _This is what I currently use._
- [**LaserGRBL**][lasergrbl]: Great for DIY laser cutters,
  <i class="fa-brands fa-windows"></i> Windows only.

## Assemble and Finish

With all layers cut, it’s time to assemble your card! Start by gluing the layers
together in order, from the base layer to the top. Use:

- **Spray Adhesive**: Ensures even glue coverage but requires precise
  positioning, as it dries quickly.
- **Stick Glue**: Allows for slight repositioning but may cause the paper to
  wrinkle due to moisture.

For a polished finish, consider applying a layer of varnish spray. You can even
sprinkle glitter between two coats for an extra touch of magic. Remember,
there’s no such thing as too much glitter! ✨

I hope you’ve enjoyed this tutorial and feel inspired to create your own 3D
greeting cards. Have fun crafting and spreading joy with your handmade designs!

[lightburn]: https://lightburnsoftware.com/
[gcodetools]: https://gitlab.com/inkscape/extras/extensions-gcodetools
[bcnc]: https://github.com/vlachoudis/bCNC
[printrun]: https://www.pronterface.com/
[lasergrbl]: https://lasergrbl.com/
[gcode]: https://en.wikipedia.org/wiki/G-code
