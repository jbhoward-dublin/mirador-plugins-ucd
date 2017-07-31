# mirador-plugins-ucd

This repository contains extensions for the IIIF viewer Mirador (see http://projectmirador.org/).

## IIIF-imageManipulation

A tool for editing images by manipulating IIIF parameters, including a visual cropping tool and Mirador plugin.

See: [https://github.com/jbhoward-dublin/iiif-imageManipulation](https://github.com/jbhoward-dublin/iiif-imageManipulation) for both the app and the plugin.

## mirador-plugin-FromThePage 

See: [linktoFromThePage.js](https://github.com/jbhoward-dublin/mirador-plugins-ucd/tree/master/mirador-plugin-FromThePage)

Determines whether manifests loaded to Mirador have been imported to the [FromThePage transcription platform](http://fromthepage.com/) then presents an icon on the "slot" menu to link to the resource on that site.

The plugin also handles manifests representing items in the [Dúchas platform](http://www.duchas.ie/) which are available for transcription.

## mirador-plugin-geojson

A plugin to enable a map visualisation based on a GeoJSON service specified within a IIIF manifest. The plugin exposes a slippy map as an overlay, launched from a map marker icon on the Mirador "slot" menu. 

The plugin is found at [https://github.com/jbhoward-dublin/mirador-plugins-ucd/tree/master/mirador-plugin-geojson](https://github.com/jbhoward-dublin/mirador-plugins-ucd/tree/master/mirador-plugin-geojson). The plugin also requires that [geojson-share-maps](https://github.com/jbhoward-dublin/geojson-share-maps) be installed, in a version adapted from [the app](https://github.com/bmcbride/geojson-share-maps) written by [Bryan McBride](https://github.com/bmcbride). 

The plugin is written to meet specific needs at University College Dublin, which makes use of a local GeoJSON endpoint (documentation at [https://digital.ucd.ie/docs/DataServicesAPIs_v0.06_Geospatial.pdf](https://digital.ucd.ie/docs/DataServicesAPIs_v0.06_Geospatial.pdf)). The plugin and associated `geojson-share-maps` app will also display arbitrary GeoJSON from other enpoints, and could be adapted with some effort to other specific environments.

To integrate with Mirador, install [geojson-share-maps](https://github.com/jbhoward-dublin/geojson-share-maps) in your web directory, and install the plugin in your Mirador plugins directory. Create a link to the plugin from the Mirador shartup file. A link to launch a map as an overlay will appear on the Mirador 'slot' menu.

Further details are available in this [Gist](https://gist.github.com/ucddigital/1ca55a7d5b7656d9fa717ef4d473490a).

<kbd>
<img alt="demo image" src="https://github.com/jbhoward-dublin/mirador-plugins-ucd/raw/master/img/2017-07-02_Mirador_GeoJSON_demo_02.gif"></img>
</kbd>
