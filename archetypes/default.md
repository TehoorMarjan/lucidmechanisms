+++
author = 'Tehoor Marjan'
categories = ['example']
date = '{{ .Date }}'
description = 'SEO Description Here'
draft = true
image = 'images/posts/{{ .File.ContentBaseName }}/header.webp'
keywords = ["seo", "keywords", "here"]
slug = '{{ .File.ContentBaseName }}'
tags = ['example']
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
+++
