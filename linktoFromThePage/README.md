# mirador-plugins-ucd

This repository contains extensions for the IIIF viewer Mirador (see http://projectmirador.org/).

## IIIF-imageManipulation

A tool for editing images by manipulating IIIF parameters, including a visual cropping tool and Mirador plugin.

[https://github.com/jbhoward-dublin/iiif-imageManipulation](https://github.com/jbhoward-dublin/iiif-imageManipulation)

## Link to FromThePage 

linktoFromThePage_ucd.js

Determines whether manifests loaded to Mirador have been imported to the [FromThePage transcription platform](http://fromthepage.com/) then presents a userButton to link to the resource on that site.

To enable it, include the JavaScript linktoFromThePage_ucd.js (**after** loading Mirador):

```html
<script src="{plugin_path}/linktoFromThePage_ucd.js"></script>
```
(Also creates links to the Dúchas.ie transcription site for IIIF manifests representing stories from the Schools' Collection, National Folklore Collection UCD.)
