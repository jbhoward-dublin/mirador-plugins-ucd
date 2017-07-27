## Link to FromThePage 

```mirador-plugin-fromThePage.js```

Determines whether manifests loaded to Mirador have been imported to the [FromThePage transcription platform](http://fromthepage.com/) then presents a userButton to link to the resource on that site.

To enable it, include the JavaScript linktoFromThePage_ucd.js (**after** loading Mirador):

```html
<script src="{plugin_path}/mirador-plugin-fromThePage.js"></script>
```
(Also creates links to the Dúchas.ie transcription site for IIIF manifests representing stories from the Schools' Collection, National Folklore Collection UCD.)

### Configuration Options

The file ```mirador-plugin-fromThePage.js```  includes a range of configuration options:

* ```show_status_link```: If set to 'true', a 'status' button displays in the Mirador menu bar linking to the TEI export of FromThePage
* ```show_transcribed_link```: if already transcribed, Mirador may provide a seeAlso link with format property == 'application/tei+xml'; when ```show_transcribed_link``` is ```true``` and such a seeAlso link appears, a menu bar button will appear to enable TEI download; default value is ```false```
* ```local_domain```: to limit lookup to the FromThePage endpoint to resources from the local domain, declare here the domain name of the host that serves your IIIF manifests
* ```timeoutFromThePage```: enter a value representing the maximum tolerable number of milliseconds to wait for a response from the IIIF endpoint; default is ```5000```

### Declaring Collections in FromThePage

If your resources have been imported to FromThePage via IIIF collections, you can limit lookups to the FromThePage endpoint by initialising a JSON array of registered collections in the data file ```collections_FtP.json```. Assure that the plugin will be properly initialised with these values by adding the file ```collections_FtP.js``` to the Mirador startup file *before* including the plugin, so:

```     
     <script src="/mirador/build/mirador/mirador.js"></script>
     <script src="/mirador/<your_path>/collections_FtP.js"></script>
     <script src="/mirador/<your path>/mirador-plugin-fromThePage.js"></script>
     
