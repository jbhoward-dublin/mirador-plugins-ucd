var linktoFromThePage = {
  /* options of the plugin */
  /*
   * in Mirador startup file, add to windowSettings.plugins: "linktoFromThePage": true
   */
  options: {},
  
  /* i18next locales */
  
  locales: {
    'ga': {
      'transcribe-canvas-image': 'Trascríobh',
      'canvas-image-transcription': 'Amharc trascríobh',
      'download-tei-xml': 'Íoslódáil trascríobh',
      'status': 'stádas'
    },
    'en': {
      'transcribe-canvas-image': 'Transcribe this page',
      'canvas-image-transcription': 'View transcription',
      'download-tei-xml': 'Download TEI transcription',
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
  '<a title="{{t "transcribe-canvas-image"}}" class="mirador-btn mirador-icon-canvas-transcribe showTranscribeLink hidden" target="_blank" aria-label="" style="position: relative!important; padding-right:6px;">',
  '<i class="fa fa-lg fa-fw fa-pencil" style="color:red;"></i>',
  '</a>',
  '<a title="{{t "download-tei-xml"}}" class="mirador-btn mirador-icon-canvas-tei hidden" target="_blank" aria-label="" style="position: relative!important; padding-right:6px;">',
  '<i class="fa fa-lg fa-fw fa-download" style="color:#1874cd;"></i>',
  '</a>',
  '<a title="{{t "canvas-image-transcription"}}" class="mirador-btn mirador-icon-canvas-transcription showTranscriptionLink showRendering hidden" target="_blank" aria-label="" style="position: relative!important; padding-right:6px;">',
  '<i class="fa fa-lg fa-fw" style="color:#1874cd;"></i>',
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
    if (this.options.showTranscribeLink && this.options.showTranscribeLink == true) {
      $(windowButtons).prepend(this.transcribeTemplate());
    }
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
      if (windowSettings.plugins && windowSettings.plugins.linktoFromThePage) {
        $.each(windowSettings.plugins.linktoFromThePage, function (index, item) {
          linktoFromThePage.options[index] = item;
        });
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
        this_.setSavedPreferences();
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
                var transcribed = false;
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
                    if (data.jsonLd.seeAlso) {
                      $.each(data.jsonLd.seeAlso, function (index, item) {
                        if (~ item.format.indexOf("application/tei+xml")) {
                          transcribed = true;
                        }
                      });
                    }
                    if (transcribed == false) {
                      var fromThePageURI = this_.linktoFromThePage(data.jsonLd[ "@id"], 'manifests', '', transcribed);
                    }
                  } 
                  else {
                    manifestsFromThePage[data.jsonLd[ "@id"]] = null;
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
              if (this.options && this.options.showTranscribeLink && this.options.showTranscribeLink == true) {
                manifestsFromThePage[manifestID] = duchasURI; }
                else {
                  manifestsFromThePage[manifestID] = duchasURI;
                }
            } 
            else {
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
      
      /* if registered with Dúchas.ie ... */
      
      if (canvasID.includes("duchas")) {
        /* handle dúchas records here */
        if (manifestsFromThePage[canvasID] !== undefined && manifestsFromThePage[canvasID] !== '' && manifestsFromThePage[canvasID] !== null && manifestsFromThePage[canvasID] !== false) {
          /* (Dúchas chapter objects have null manifestsFromThePage values) */
          /* check data.manifest to see if it has already been transcribed */
          this_.showTranscriptionLink(current_slot_id, manifestsFromThePage[canvasID]);
          return;
        }
      }
      
      var transcribed = false;
      
      /* if registered with FromThePage ... */
      
      if (manifestsFromThePage[_this.manifest.uri] !== undefined && manifestsFromThePage[_this.manifest.uri] !== null && manifestsFromThePage[_this.manifest.uri] !== false) {
        link = this_.setLinkTypeFromThePage(manifestsFromThePage[_this.manifest.uri], 'read');
        if (_this.manifest.jsonLd.seeAlso) {
          $.each(_this.manifest.jsonLd.seeAlso, function (index, item) {
            if (~ item.format.indexOf("application/tei+xml")) {
              transcribed = true;
            }
          });
        }
        if (transcribed == false) {
          this_.showTranscriptionLink(current_slot_id, link);
          var fromThePageURI = this_.linktoFromThePage(_this.manifest.uri, 'manifests', current_slot_id, transcribed);
          return;
        } 
        else if (this_.options.showTranscriptionLink && this_.options.showTranscriptionLink == true) {
            this_.showDocumentLink(current_slot_id, link, 'FtP');
        }
        var fromThePageURI = this_.linktoFromThePage(_this.manifest.uri, 'manifests', current_slot_id, transcribed);
        return;
      }
      
      if (manifestsFromThePage[_this.manifest.uri] == undefined) {
        if (_this.manifest.jsonLd.seeAlso) {
          console.log(_this.manifest.jsonLd.seeAlso);
          /*
          $.each(_this.manifest.jsonLd.seeAlso, function (index, item) {
            if (~ item.format.indexOf("application/tei+xml")) {
              transcribed = true;
              //var downloadLink = this[ "@id"];
              //this_.showDownloadLink(current_slot_id, downloadLink);
            }
          });
          */
        }
        var retval = this_.linktoFromThePage(_this.manifest.uri, 'manifests', current_slot_id, transcribed);
        if (retval == true) { /* true signifies asynchronous ajax process in progress, so do not show renderings */
          return;
        }
      }
      
      /* look for PDF or HTML renderings & expose a link, regardless of whether in FromThePage */
      
      if (this.manifest.jsonLd.rendering && _this.options.showRendering && _this.options.showRendering == true) {
        var rendering = this.manifest.jsonLd.rendering;
        var renderingHTML, renderingPDF;
        if (Array.isArray(rendering)) {
          renderingPDF = rendering;
          rendering = renderingPDF.find(function(r) {
            return r.format === "application/pdf";
          });
          renderingHTML = rendering;
          rendering = renderingHTML.find(function(r) {
            return r.format === "text/html";
          });
        }
        /* show one or the other ... */
        if (rendering.format == 'text/html') {
          renderingHTML = rendering["@id"];
          this_.showDocumentLink(current_slot_id, renderingHTML, 'text/html');
        }
        else if (rendering.format == 'application/pdf') {
          renderingPDF = rendering["@id"];
          this_.showDocumentLink(current_slot_id, renderingPDF, 'application/pdf');
        }
        return;
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
  
  linktoFromThePage: function (ID, type, slot_id, isTranscribed) {
    _this = this;
    if (this.isLocalResource(ID) == false) {
      return false;
    }
    if (ID.includes('duchas')) {
      return false;
    }
    if (manifestsFromThePage[ID] !== undefined) {
      if (manifestsFromThePage[ID] == null) {
        return manifestsFromThePage[ID];
      }
    } 
    else if (manifestsFromThePage[ID] == undefined) {
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
        returnResponse(responseText, isTranscribed);
      },
      error: function (xhr, ajaxOptions, errorMsg) {
        if (xhr.status == 404) {
          //console.log(errorMsg);
          manifestsFromThePage[ID] = null;
        } 
        else if (xhr.status == 401) {
          /* not implemented at FromThePage */
        }
      },
      timeout: configFromThePage[ 'timeoutFromThePage']
    });
    
    return true;
    
    function returnResponse(data, isTranscribed) {
      if (data !== undefined) {
        if (manifestsFromThePage[ID] === undefined || manifestsFromThePage[ID] == false) {
          if (type == 'manifests') {
            manifestsFromThePage[ID] = data[ "@id"];
            if (isTranscribed == false) {
              _this.showTranscriptionLink(slot_id, _this.setLinkTypeFromThePage(manifestsFromThePage[ID], 'read'),'FtP');
            } 
            else {
              _this.showDocumentLink(slot_id, _this.setLinkTypeFromThePage(manifestsFromThePage[ID], 'read'),'FtP');
            }
          } 
          else if (type == 'canvases') {
            var response = data[ "@id"];
            response = data[ "@id"].substr(0, response.indexOf('/canvas/')) + '/manifest';
            manifestsFromThePage[ID] = $.trim(response);
            _this.showTranscriptionLink(slot_id, _this.setLinkTypeFromThePage(manifestsFromThePage[ID], 'read'));
          }
        }
      }
    }
  },
  
  showDownloadLink: function (slot_id, link) {
    $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-tei').attr("href", link);
    if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-tei').hasClass("hidden")) {
      $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-tei').removeClass("hidden");
    }
    return true;
  },
  showDocumentLink: function (slot_id, link, format) {
    $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').attr("href", link);
    if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').hasClass("hidden")) {
      $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').removeClass("hidden");
    }
    if (format) {
      if (format == 'FtP') {
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').attr("href", link);
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').addClass("fa-file-text"); /* default dodger blue */
      }
      if (format == 'application/pdf') {
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').attr("href", link);
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').addClass("fa-file-pdf-o");
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').css({'color':'#ff0000','font-weight:':'bold'}); /* PDF red */
      }
      else if (format == 'text/html') {
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription').attr("href", link);
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').addClass("fa-file-code-o");
        $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').css({'color':'#449d44','font-weight':'bold'}); /* UCD green */
      }
    } 
    else {
      $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcription > i').addClass("fa-file-text"); /* default dodger blue */
    }
    return true;
  },
  showTranscriptionLink: function (slot_id, link) {
    $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').attr("href", link);
    if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').hasClass("hidden")) {
      $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-transcribe').removeClass("hidden");
    }
    return true;
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
    if (uri == false) {
      return;
    }
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
  },
  
  /* update menu buttons from saved settings in local storage */
  setSavedPreferences: function (context) {    
    /* read saved settings from local storage, then update menu and buttons */
    var savedPreferences_buttons = localStorage.getItem('dl_settings_buttons');
    var savedPreferences_userButtons = localStorage.getItem('dl_settings_userButtons');
    //var savedPreferences_plugins = localStorage.getItem('dl_settings_plugins');

    if (savedPreferences_buttons) {
      updateSettings(savedPreferences_buttons);
    }
    if (savedPreferences_userButtons) {
      updateSettings(savedPreferences_userButtons);
    }
    
    function updateSettings(settings) {
      /* updates both menu settings and menu buttons */
      $.each(JSON.parse(settings), function (key, val) {
        var className = 'a.' + key;
        var mainMenuClasses = {
          'a.bookmark': 'a.bookmark-workspace', 'a.changeLayout': 'a.change-layout', 'a.fullScreen': 'a.fullscreen-viewer', 'a.canvasLink': 'a.shareButtons'
        };
        if (mainMenuClasses[className] && mainMenuClasses[className].length) {
          className = mainMenuClasses[className];
        }
        if ($.type(val) == 'boolean') {
          var counter = 0;
          var setLinks = setInterval(function () {
            if ($(className).length) {
              counter++
              if (val == true) {
                $(className).removeClass('noshow');
                $('.window-options-item[name=key]').attr('checked', '');
              } 
              else {
                $(className).addClass('noshow');
                $('.mirador-container #window-options-panel .window-options-item[name="' + key + '"]').removeAttr('checked');
              }
              clearInterval(setLinks);
            } 
            else {
              counter++;
              if (counter > 29) {
                clearInterval(setLinks);
              }
            }
          },
          100);
        } 
        else if ($.type(val) == 'object') {
          var counter = 0;
          var irrelevantKeys =[ 'label', 'plugin'];
          $.each(val, function (objKey, objVal) {
            /* skip irrelevant keys */
            if ($.inArray(objKey, irrelevantKeys) !== -1) {
              return;
            }
            className = 'a.' + objKey;
            var setObjLinks = setInterval(function () {
              if ($(className).length) {
                if (objVal == false) {
                  $('a.shareButtons').addClass('noshow');
                  $('.mirador-container #window-options-panel .window-options-item[name="' + objKey + '"]').removeAttr('checked');
                } 
                else {
                  $(className).removeClass('noshow');
                  $('.mirador-container #window-options-panel .window-options-item[name="' + objKey + '"]').attr('checked','');
                }
                clearInterval(setObjLinks);
              } 
              else {
                counter++;
                if (counter > 80) {
                  clearInterval(setObjLinks);
                }
              }
            },
            100);
          });
        }
      });
    }
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
  "local_domain": "data.ucd.ie", // identifying the local domain prevents lookup of resources from outside that domain
  "timeoutFromThePage": 5000 // maximum tolerable latency for a FromThePage response
}

$(document).ready(function () {
  linktoFromThePage.init();
});
