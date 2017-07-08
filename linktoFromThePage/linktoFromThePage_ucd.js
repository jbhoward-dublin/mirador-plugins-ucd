var linktoFromThePage = {
  /* options of the plugin */
  /*
   * in Mirador startup file, add to windowSettings: "linktoFromThePage": true
   */
  options: {},
  
  /* i18next locales */
  
  locales: {
    'ga': {
      'transcribe-canvas-image': 'Trascríobh',
      'status': 'stádas'
    },
    'en': {
      'transcribe-canvas-image': 'Transcribe this page',
      'status': 'status'
    }
  },
  /* template for CSS styles */
  styleTemplate: Mirador.Handlebars.compile([
  '<style>',
  '.mirador-container .window-manifest-title { font-size: 14px!important; }',
  '</style>'].join('')),
  
  /* template for the Transcribe buttons */
  transcribeTemplate: Mirador.Handlebars.compile([
  '<a title="{{t "transcribe-canvas-image"}}" class="mirador-btn mirador-icon-canvas-transcribe hidden" target="_blank" aria-label="" style="position: relative!important; padding-right:6px;">',
  '<i class="fa fa-lg fa-fw fa-pencil" style="color:red;"></i>',
  '</a>'].join('')),
  styleTemplate: Mirador.Handlebars.compile([
  '<style>',
  ' .transcribe { position:relative; }',
  '</style>'].join('')),
  
  /* initializes the plugin */
  init: function () {
    i18next.on('initialized', function () {
      this.addLocalesToViewer();
    }.bind(this));
    this.injectStylesToDom();
    this.setPluginOptions();
    this.injectWorkspaceEventHandler();
    this.injectWindowEventHandler();
  },
  
  /* injects the button to the window menu */
  injectButtonToMenu: function (windowButtons) {
    //if (this.options.linktoFromThePage && this.options.linktoFromThePage == true) {
    $(windowButtons).prepend(this.transcribeTemplate());
    //}
  },
  
  /* inject style template */
  injectStylesToDom: function () {
    var this_ = this;
    document.body.insertAdjacentHTML('beforeend', this_.styleTemplate());
  },
  
  /* set local options */
  setPluginOptions: function () {
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function () {
      origFunc.apply(this);
      var windowSettings = this.state.currentConfig.windowSettings;
      if (windowSettings.linktoFromThePage && windowSettings.linktoFromThePage == true) {
        linktoFromThePage.options[ "linktoFromThePage"] = true;
      }
    };
  },
  
  /* inject workspace event handler */
  injectWorkspaceEventHandler: function () {
    var this_ = this;
    var origFunc = Mirador.Workspace.prototype.bindEvents;
    Mirador.Workspace.prototype.bindEvents = function () {
      origFunc.apply(this);
      
      this.eventEmitter.subscribe('WINDOW_ELEMENT_UPDATED', function (event, data) {
        var windowButtons = data.element.find('.window-manifest-navigation');
        this_.injectButtonToMenu(windowButtons);
      });
      
      this.eventEmitter.subscribe('manifestReceived', function (event, data) {
        if (data.jsonLd !== undefined) {
          /* if collections_FtP.json data is available, initialise manifestsFromThePage with null values for collections NOT in FromThePage */
          if (data.jsonLd.within !== undefined) {
            if (collectionsFtP !== undefined) {
              var isTranscribedCollection = this_.isFtP(data.jsonLd.within[ "@id"]);
              if (isTranscribedCollection == false) {
                var manifestID = 'https:' + data.uri;
                manifestsFromThePage[manifestID] = null;
                $.each(data.jsonLd.sequences[0].canvases, function (index, item) {
                  $.each(this, function (index, val) {
                    if (index == '@id') {
                      manifestsFromThePage[val] = null;
                    }
                  });
                });
                if (data.jsonLd.metadata) {
                  var isText = false;
                  $.each(data.jsonLd.metadata, function (index, item) {
                    if (item.label == 'Type of resource') {
                      if (item.value[0][ "@value"] == 'dctypes:Text') {
                        isText = true;
                      }
                    }
                  });
                  if (isText == true) {
                    var fromThePageURI = this_.linktoFromThePage(data.jsonLd["@id"], 'manifests');
                  } else {
                    manifestsFromThePage[data.jsonLd["@id"]] = null;
                  }
                }
              }
            }
          }
          /* duchas specific: */
          if (data.jsonLd[ "@id"].includes("duchas")) {
            var duchasURI;
            var transcribed = false;
            var manifestID = 'https:' + data.uri;
            if (data.jsonLd.seeAlso) {
              $.each(data.jsonLd.seeAlso, function (index, item) {
                var label = Mirador.JsonLd.getTextValue(item.label);
                var format = Mirador.JsonLd.getTextValue(item.format);
                if (~ format.indexOf("application/tei+xml")) {
                  transcribed = true;
                }
                var id = Mirador.JsonLd.getTextValue(item[ "@id"]);
                if (~ id.indexOf("http://www.duchas.ie/en/cbes/")) {
                  duchasURI = id;
                }
              });
            }
            if (duchasURI !== undefined && transcribed == false) {
              if (configFromThePage[ 'show_transcribed_link'] == true) {
                manifestsFromThePage[manifestID] = duchasURI;
              } else {
                manifestsFromThePage[manifestID] = duchasURI;
              }
            } else {
              manifestsFromThePage[manifestID] = null;
            }
            /* end duchas specific */
            /* add all canvas @ids in the manifest to the manifestsFromThePage hash */
            $.each(data.jsonLd.sequences[0].canvases, function (index, item) {
              $.each(this, function (index, val) {
                if (index == '@id') {
                  manifestsFromThePage[val] = manifestsFromThePage[manifestID];
                }
              });
            });
          }
        }
      });
    };
  },
  
  /* inject window event handler */
  injectWindowEventHandler: function () {
    var this_ = this;
    
    var origFunc = Mirador.Window.prototype.bindEvents;
    Mirador.Window.prototype.bindEvents = function () {
      origFunc.apply(this);
      var localDomain = document.location.origin;
      _this = this;
      
      var canvasID = this.canvasID;
      var current_slot_id = $('.highlight[data-image-id="' + canvasID + '"]').closest("div.layout-slot").attr('data-layout-slot-id');
      /* already declared */
      if (manifestsFromThePage[_this.manifest.uri] !== undefined && manifestsFromThePage[_this.manifest.uri] !== null && manifestsFromThePage[_this.manifest.uri] !== false) {
        var link = this_.setLinkTypeFromThePage(manifestsFromThePage[_this.manifest.uri], 'read');
        console.log('oink');
        console.log(manifestsFromThePage[_this.manifest.uri]);
        showTranscriptionLink(current_slot_id, link);
        return;
      } else if (! canvasID.includes("duchas")) {
        /* is this manifest represented at FromThePage? (skip dúchas records) */
        var fromThePageURI;
        fromThePageURI = this_.linktoFromThePage(_this.manifest.uri, 'manifests', current_slot_id);
      }
      if (canvasID.includes("duchas")) {
        /* handle dúchas records here */
        if (manifestsFromThePage[canvasID] !== undefined && manifestsFromThePage[canvasID] !== '' && manifestsFromThePage[canvasID] !== null && manifestsFromThePage[canvasID] !== false) {
          /* (chapter objects have null manifestsFromThePage values) */
          showTranscriptionLink(current_slot_id, manifestsFromThePage[canvasID]);
          return;
        }
      }
      function showTranscriptionLink(slot_id, link) {
        $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-transcribe').attr("href", link);
        if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').hasClass("hidden")) {
          $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').removeClass("hidden");
        }
      }
    };
  },
  
  /* add the locales to the internationalisation module (i18next) of the viewer */
  addLocalesToViewer: function () {
    for (var language in this.locales) {
      i18next.addResources(
      language, 'translation',
      this.locales[language]);
    }
  },
  
  linktoFromThePage: function (ID, type, slot_id) {
    _this = this;
    if (this.isLocalResource(ID) == false) {
      return;
    }
    if (ID.includes('duchas')) {
      return;
    }
    if (manifestsFromThePage[ID] !== undefined) {
      if (manifestsFromThePage[ID] == null) {
        return manifestsFromThePage[ID];
      }
    } else if (manifestsFromThePage[ID] == undefined) {
      manifestsFromThePage[ID] = false;
    }
    if (typeof type === undefined) {
      type = 'manifests';
    }
    /* add protocol declaration if missing ... not appropriate for all sites */
    if (ID.substring(0, 2) == '//') {
      ID = $.trim('https:' + ID);
    }
    /* skip if previously queried */
    if (manifestsFromThePage[ID] !== undefined && manifestsFromThePage[ID] !== null && manifestsFromThePage[ID] !== false) {
      return manifestsFromThePage[ID];
    }
    var url = 'https://fromthepage.com/iiif/for/' + ID;
    
    $.ajax(url, {
      success: function (responseText) {
        returnResponse(responseText);
      },
      error: function (xhr, ajaxOptions, errorMsg) {
        if (xhr.status == 404) {
          //console.log(errorMsg);
          manifestsFromThePage[ID] = null;
        } else if (xhr.status == 401) {
          /* not implemented at FromThePage */
        }
      },
      timeout: configFromThePage[ 'timeoutFromThePage']
    });
    
    function returnResponse(data) {
      if (data !== undefined) {
        if (manifestsFromThePage[ID] === undefined || manifestsFromThePage[ID] == false) {
          if (type == 'manifests') {
            manifestsFromThePage[ID] = data[ "@id"];
            showTranscriptionLink(slot_id, _this.setLinkTypeFromThePage(manifestsFromThePage[ID], 'read'));
          } else if (type == 'canvases') {
            var response = data[ "@id"];
            response = data[ "@id"].substr(0, response.indexOf('/canvas/')) + '/manifest';
            manifestsFromThePage[ID] = $.trim(response);
            showTranscriptionLink(slot_id, _this.setLinkTypeFromThePage(manifestsFromThePage[ID], 'read'));
          }
        }
      }
    }
    
    function showTranscriptionLink(slot_id, link) {
      $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').attr("href", link);
      if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').hasClass("hidden")) {
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').removeClass("hidden");
      }
    }
  },
  
  isLocalResource: function (ID) {
    if (configFromThePage[ 'local_domain'] && configFromThePage[ 'local_domain'] !== '') {
      if (ID.includes(configFromThePage[ 'local_domain'])) {
        return true;
      }
    }
    return false;
  },
  
  setLinkTypeFromThePage: function (uri, activity) {
    if (uri == false) {return; }
    var val = uri.substr(uri.indexOf("/iiif/") + 6);
    val = val.substr(0, val.indexOf('/'));
    var uri;
    switch (activity) {
      case 'about':
        uri = 'https://fromthepage.com/work/show?work_id=' + val;
        break;
      case 'edit':
        uri = 'https://fromthepage.com/work/edit?work_id=' + val;
        break;
      case 'read':
        uri = 'https://fromthepage.com/display/read_work?work_id=' + val;
        break;
      case 'show':
        uri = 'https://fromthepage.com/display/show?work_id=' + val;
        break;
      case 'xhtml':
        uri = 'https://fromthepage.com/export/show?work_id=' + val;
        break;
      default:
        uri = 'https://fromthepage.com/display/read_work?work_id=' + val;
    }
    return uri;
  },
  
  isFtP: function (collectionId) {
    /* is the manifest part of a collection declared in local collections_FtP.json? */
    var status = false;
    $.each(collectionsFtP, function (index, item) {
      $.each(item, function (key, collection) {
        if (collection.collectionIdLocal == collectionId) {
          status = true;
        }
      });
    });
    return status;
  }
};

var duchasTranscribed = false;
/* FromThePage may retain references to manifests that were added, deleted, then added again; 
 * initialising as follows avoids receiving blind references from the FromThePage API for such cases
 */
var manifestsFromThePage = {
  "https://data.ucd.ie/api/img/manifests/ivrla:3849": "https://fromthepage.com/iiif/355/manifest",
  "https://data.ucd.ie/api/img/ivrla:3849/canvas/ivrla:3850": "https://fromthepage.com/iiif/355/manifest",
  "https://data.ucd.ie/api/img/manifests/ivrla:3827": "https://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3828": "https://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3829": "https://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3830": "https://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3831": "https://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/manifests/ivrla:3835": "https://fromthepage.com/iiif/344/manifest",
  "https://data.ucd.ie/api/img/ivrla:3835/canvas/ivrla:3836": "https://fromthepage.com/iiif/344/manifest",
  "https://data.ucd.ie/api/img/ivrla:3835/canvas/ivrla:3837": "https://fromthepage.com/iiif/344/manifest"
};
var localCollections;
var configFromThePage = {
  /* transpose to Mirador config? */
  "local_domain": "data.ucd.ie",  // identifying the local domain prevents lookup of resources from outside that domain
  "show_status_link": false,      // provide link to FromThePage's xhtml output
  "show_transcribed_link": false, // if already transcribed, there is a seeAlso link for format property == 'application/tei+xml' ; show if true, not if false
  // show_transcribed_link is a UCD practice when a TEI document is available in the UCD repository
  "timeoutFromThePage": 5000      // maximum tolerable latency for a FromThePage response
}

$(document).ready(function () {
  linktoFromThePage.init();
});
