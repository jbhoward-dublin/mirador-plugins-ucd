var iiifGeoJSON = {
  /* options of the plugin */
  options: {},
  
  /* map configuration */
  mapConfig: {
    "attribution": "UCD Library, University College Dublin", /* attribution to appear at bottom of map visualisation */
    "cluster": true, /* cluster map points */
    "display_fields": null, /* custom list of fields in an expected GeoJSON response, if any */
    "external_map_service": "https://dev01.digital.ucd.ie/maps-geojson/", /* an external service for externally referenced GeoJSON objects demo site at 'https://jbhoward-dublin.github.io/geojson-share-map */
    "logo": "https://digital.ucd.ie/images/logos/ucd_logo_sm.png", /* logo to appear in map display header */
    "map_link_position": "overlay", /* 'overlay' present the map as an overlay with slight transparency in the Mirador slot ; 'tab' open the map in a new tab */
    "title_field": null
  },
  
  /* i18next locales */
  locales: {
    'de': {
      'map-canvas-image': 'Moderne Landcarte ansehen',
      'mapTooltip': 'Moderne Landcarte ansehen',
      'mapcloseTooltip': 'Fenster schliessen'
    },
    'en': {
      'map-canvas-image': 'View map',
      'mapTooltip': 'View map',
      'mapcloseTooltip': 'Close map window'
    },
    'ga': {
      'map-canvas-image': 'Amharc léarscáil',
      'mapTooltip': 'Amharc léarscáil',
      'mapcloseTooltip': 'Dún léarscáil'
    }
  },
  /* template for CSS styles */
  styleTemplate: Mirador.Handlebars.compile([
  '<style>',
  '@media screen and (max-width:596px){ .mirador-icon-canvas-map {display:none!important;} }',
  '.mirador-container .window-manifest-title { font-size: 14px!important; }',
  ' .mapview { position:relative; }',
  ' .mapview:before { content: "\\F278"; font-family: FontAwesome; left:-22px; position:absolute; top:1px; }',
  ' .mapview-override:before { content: none; left:-22px; position:absolute; top:1px; }',
  ' .overlayMap { display: none; position: absolute; right: 0; top: 0; content-box: border-box; border-style: solid; border-width: 3px; border-color: #grey; background-color: rgba(255,255,255,0.9); opacity: 1; z-index:4; width: 80%; overflow-y: hidden; height: 75%; direction: rtl!important; resize: both; overflow: auto; }',
  ' #opacitySlider {width: 30px; position: absolute;top: 202px;right: 12px; margin: auto;transform: translate(-50%, -50%); opacity: 1!important; }',
  ' .rangeslider,',
  ' input[type="range"] {max-width: 400px; }',
  ' .rangeslider__handle {border-radius: 16px;line-height: 22px;text-align: center;font-weight: bold;&:after { background: 0;} }',
  ' .rangeslider,',
  ' .rangeslider__fill {display: block;border-radius: 6px; }',
  ' .rangeslider {background: #6b6b6b;position: relative; }',
  ' .rangeslider--horizontal {height: 4px;width: 100%; }',
  ' .rangeslider--vertical {width: 3px;min-height: 80px;max-height: 33%; }',
  ' .rangeslider--disabled {filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=40);opacity: 0.4; }',
  ' .rangeslider__fill {// background: #4bc67d;position: absolute; }',
  ' .rangeslider--horizontal .rangeslider__fill {top: 0;height: 100%; }',
  ' .rangeslider--vertical .rangeslider__fill {bottom: 0;width: 100%; }',
  ' .rangeslider__handle {background: white;border: 4px solid #a9a9a9;cursor: pointer;display: inline-block;width: 12px;height: 12px;position: absolute;-moz-border-radius: 50%;-webkit-border-radius: 50%;border-radius: 50%;&.js-low {  border-color: #4bc67d;}  &.js-med {  border-color: #f1c40f;}  &.js-high {  border-color: #b94a48;} }',
  ' .rangeslider__handle:after {content: "";display: block;width: 18px;height: 18px;margin: auto;position: absolute;top: 0;right: 0;bottom: 0;left: 0;-moz-border-radius: 50%;-webkit-border-radius: 50%;border-radius: 50%; }',
  ' .rangeslider__handle:active { }',
  ' .rangeslider--horizontal .rangeslider__handle {top: -10px;touch-action: pan-y;-ms-touch-action: pan-y; }',
  ' .rangeslider--vertical .rangeslider__handle {left: -7px;touch-action: pan-x;-ms-touch-action: pan-x; }',
  ' input[type="range"]:focus + .rangeslider .rangeslider__handle {-moz-box-shadow: 0 0 8px rgba(255, 0, 255, 0.9);-webkit-box-shadow: 0 0 8px rgba(255, 0, 255, 0.9);box-shadow: 0 0 8px rgba(255, 0, 255, 0.9); }',
  '</style>'].join('')),
  
  /* template for the map button */
  mapTemplate: Mirador.Handlebars.compile([
  '<a title="{{t "map-canvas-image"}}" class="mirador-btn mirador-icon-canvas-map mapLink hidden" target="_blank" aria-label="{{t "map-canvas-image"}}" style="position: relative!important; padding-right:4px;">',
  '<i class="fa fa-lg fa-fw fa-map-marker" style="color:green;"></i>',
  '</a>'].join('')),
  
  /* initializes the plugin */
  init: function () {
    Mirador.Handlebars.registerHelper('concat', function (target) {
      return 'share-on-' + target;
    });
    Mirador.Handlebars.registerHelper('truncate', function (label, attribution) {
      var text = label.concat(attribution ? ' (' + attribution + ')': '');
      if (text.length > 60) {
        text = text.substring(0, 60).concat('...');
      }
      return text;
    });
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
    /* if removed, main menu settings widget can change the value to false ; button is hidden by default */
    //if (this.options.mapLink && this.options.mapLink == true) {
      $(windowButtons).prepend(this.mapTemplate());
    //}
  },
  
  /* inject style template */
  injectStylesToDom: function () {
    var this_ = this;
    document.body.insertAdjacentHTML('beforeend', this_.styleTemplate());
  },
  
  /* set  local options */
  setPluginOptions: function () {
    var this_ = this;
    var origFunc = Mirador.Viewer.prototype.setupViewer;
    Mirador.Viewer.prototype.setupViewer = function () {
      origFunc.apply(this);
      var windowSettings = this.state.currentConfig.windowSettings;
      if (windowSettings.plugins.mapLink && windowSettings.plugins.mapLink == true) {
        iiifGeoJSON.options[ "mapLink"] = true;
      }
    };
  },
  
  /* injects workspace event handler */
  injectWorkspaceEventHandler: function () {
    var this_ = this;
    var origFunc = Mirador.Workspace.prototype.bindEvents;
    Mirador.Workspace.prototype.bindEvents = function () {
      origFunc.apply(this);
      this.eventEmitter.subscribe('WINDOW_ELEMENT_UPDATED', function (event, data) {
        var windowButtons = data.element.find('.window-manifest-navigation');        
        //$('#window-options-panel:visible').toggle();
        this_.setSavedPreferences();
        this_.injectButtonToMenu(windowButtons);
      });
    };
  },
  
  /* injects window event handler */
  injectWindowEventHandler: function () {
    var this_ = this;
    var origFunc = Mirador.Window.prototype.bindEvents;
    Mirador.Window.prototype.bindEvents = function () {
      origFunc.apply(this);
      _this = this;
      var localDomain = document.location.origin;
      
      /* map */
      
      var canvasID = this.canvasID;
      var current_slot_id;
      if ($('.highlight[data-image-id="' + canvasID + '"]').closest("div.layout-slot").attr('data-layout-slot-id')) {
        current_slot_id = $('.highlight[data-image-id="' + canvasID + '"]').closest("div.layout-slot").attr('data-layout-slot-id');
      } 
      else {
        current_slot_id = $('div.overlay').closest('.layout-slot').attr("data-layout-slot-id");
      }
      
      var mapUrl, mapService, service;
      var jsonLd = this.manifest.jsonLd;
      var canvasArray = jsonLd.sequences[0].canvases;
      mapUrl = this_.getCanvasGeojson(canvasArray, canvasID);
      /* if no canvas-level service look at manifest-level */
      if (mapUrl == undefined) {
        service = this.manifest.jsonLd.service;
        mapUrl = iiifGeoJSON.getManifestGeojson(service, this.manifest.uri);
        (mapUrl == undefined) ? hideMapLink(current_slot_id) : showMapLink(current_slot_id, mapUrl);
      }
      
      /* individual canases can be selected from the manifest-select-menu */
      $('.preview-image').on('click', function (e) {
        var loadCanvasID = $(this).attr('data-image-id');
        mapUrl = this_.getCanvasGeojson(canvasArray, loadCanvasID);
        if (mapUrl == undefined) {
          return;
        }
        getMapDetails();
        return;
      });
      
      this.element.find('.preview-image, .thumbnail-image, .mirador-osd-next, .mirador-osd-previous').on('click', function () {
        getMapDetails();
      });
      
      function getMapDetails() {
        var currentCanvasID = $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] img.highlight').attr('data-image-id');
        var currentMapUrl = this_.getCanvasGeojson(canvasArray, currentCanvasID);
        if (currentMapUrl == undefined && mapUrl == undefined) {
          hideMapLink(current_slot_id);
        } else if (currentMapUrl) {
          this_.showMap(currentMapUrl, current_slot_id, currentCanvasID);
          this_.addOpacityControlToViewer(current_slot_id);
        } else if (mapUrl) {
          this_.showMap(mapUrl, current_slot_id, currentCanvasID);
          this_.addOpacityControlToViewer(current_slot_id);
        }
      }
      
      this.element.find('.mirador-icon-canvas-map').on('click', function (event) {
        if (mapUrl !== undefined || $('.mirador-icon-canvas-map').attr("href") !== undefined) {
          event.preventDefault();
          if (! $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] div.overlayMap').length) {
            $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-map').attr("href", mapUrl);
            this_.showMap(mapUrl, current_slot_id, canvasID);
            this_.addOpacityControlToViewer(current_slot_id);
          }
          /* reload iframe */
          reloadMapOverlay(current_slot_id);
          function reloadMapOverlay(slot_id) {
            document.getElementById('overlayMap').src = document.getElementById('overlayMap').src;
            $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .overlayMap').toggle(500, function () {
              if ($('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] iframe').attr('src').length) {
                $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] iframe').attr('src', $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] iframe').attr('src')).fadeIn(500).removeClass("hidden");
              }
            });
          }
        }
      });
      
      function hideMapLink(slot_id) {
        if (! $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-map').hasClass("hidden")) {
          $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-map').addClass("hidden");
        }
      }
      function showMapLink(slot_id, link) {
        $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-map').attr("href", link);
        if ($('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-map').hasClass("hidden")) {
          $('div.layout-slot[data-layout-slot-id="' + slot_id + '"] .mirador-icon-canvas-map').removeClass("hidden");
        }
      }
    };
  },
  
  getManifestGeojson: function (service, manifestUri) {
    if (service && Array.isArray(service)) {
      /* service as array */
      mapService = service.find(function (s) {
        return service.profile === "http://geojson.org/geojson-spec.html";
      });
    } 
    else if (service && service.profile) {
      /* service as object */
      mapService = service.profile;
      if (mapService == "http://geojson.org/geojson-spec.html" || mapService == 'http://geojson.org/geojson-context.jsonld') {
        var dctype;
        if (service.properties !== undefined) {
          if (service.properties[ "type"] !== undefined) {
            if (service.properties[ "type"] == "dcterms:Box") {
              dctype = 'bbox';
            }
          }
        }
        return this.parseGeoService(service, manifestUri, dctype, 'manifest');
      }
    }
  },
  
  getCanvasGeojson: function (canvasArray, canvasID) {
    for (var i = 0; i < canvasArray.length; i++) {
      var dctype;
      if (canvasArray[i].service !== undefined) {
        var serviceArray = canvasArray[i].service;
        if (serviceArray !== undefined && ! Array.isArray(canvasArray[i].service)) {
          if (serviceArray[ "@context"] !== undefined) {
            if (serviceArray[ "@context"] == 'http://geojson.org/contexts/geojson-base.jsonld' || serviceArray[ "@context"] == 'http://geojson.org/geojson-context.jsonld') {
              dctype = '';
              if (serviceArray.properties[ "type"] !== undefined) {
                if (serviceArray.properties[ "type"] == "dcterms:Box") {
                  dctype = 'bbox';
                }
              }
              if (canvasID == canvasArray[i][ "@id"]) {
                return this.parseGeoService(serviceArray, canvasArray[i][ "@id"], dctype, 'canvas');
              }
              if (canvasID == undefined) {
                var retval = this.parseGeoService(serviceArray, canvasArray[i][ "@id"], dctype, 'canvas');
                if (retval !== undefined && i == 0) {
                  return retval;
                }
              }
            }
          }
        } 
        else if (serviceArray !== undefined && Array.isArray(canvasArray[i].service)) {
          for (var n = 0; n < serviceArray.length; n++) {
            dctype = '';
            if (serviceArray[n] !== undefined && serviceArray[n][ "@context"] !== undefined) {
              if (serviceArray[n][ "@context"] == 'http://geojson.org/contexts/geojson-base.jsonld' || serviceArray[n][ "@context"] == 'http://geojson.org/geojson-context.jsonld') {
                if (serviceArray[n].properties[ "type"] !== undefined) {
                  if (serviceArray[n].properties[ "type"] == "dcterms:Box") {
                    dctype = 'bbox';
                  }
                }
                if (canvasID == canvasArray[i][ "@id"]) {
                  return this.parseGeoService(serviceArray[n], serviceArray[n][ "@id"], dctype, 'canvas');
                }
              }
            }
          }
        }
      }
    }
    return;
  },
  
  /* display a map */
  showMap: function (mapUrl, current_slot_id, canvasID) {
    mapUrl = mapUrl.replace(/&amp;/g, '&');
    if ($('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-map').hasClass("hidden")) {
      $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-map').removeClass("hidden");
    }
    if (this.mapConfig[ "map_link_position"] == 'overlay') {
      /* if iframe div injected previously, remove it */
      if ($('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] div.overlayMap').length) {
        $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] div.overlayMap').remove();
      }
      /* include button overlay to close map */
      var map_iframe = '<div class="overlayMap" id="overlayMap" data-map-uri="' + mapUrl + '"><div class="mapview-over mapview-override" data-slotId="' + current_slot_id + '"style="position: absolute; bottom: 24px; right: 6px; opacity: 0.8; content:none;"><span class="fa-stack fa-lg" data-slotid="' + current_slot_id + '"><i class="fa fa-square-o fa-stack-2x" style="color: #808080; opacity: 0.8;"></i><i class="fa fa-times fa-stack-1x"></i></span></i></div>' +
      '<iframe id="iframeMap" class="iframeMap hidden" width="100%" style="z-index:1;" height="99%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' + mapUrl + '&iframe=true"></iframe></div>';
      
      if ($("div.overlay").length) {
        $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .mirador-icon-canvas-map').attr("href", mapUrl);
        if (current_slot_id !== undefined) {
          $(map_iframe).insertBefore('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] div.overlay');
        }
      }
    }
  },
  
  /* create a URL for the map visualisation service */
  parseGeoService: function (service, ID, dctype, iiifType) {
    var caption = '';
    var mapUrl, serviceID;
    if (service[ "@id"] !== undefined) {
      serviceID = service[ "@id"];
    }
    
    /* *
     * local UCD: set parameters appropriate to UCD Geospatial API methods
     * if there is an expected geojson properties profile, set to expected geojson properties,if any;
     * otherwise comment the switch and following 'else' statement; (all) geojson property names will then appear as labels in map table display
     * */
    
    if (this.mapConfig[ 'title_field'] == undefined || this.mapConfig[ 'title_field'] == '' || this.mapConfig[ 'title_field'] == null) {
      switch (serviceID) {
        case (serviceID.match(/geometryByID\(/) || {}).input:
          caption = '&title_field=name&fields=name,pid,admin_unit,category,theme,centroid,geonamesreference,logainmreference,license';
          break;
        case (serviceID.match(/region\(/) || {}).input:
          caption = '&title_field=title&fields=id,pid,title,collectionid,place,date,theme,geonamesreference,centroid,url,license';
          break;
        case (serviceID.match(/bbox\(/) || {}).input:
          caption = '&title_field=title&fields=title,id,pid,place,date,category,theme,centroid,geonamesreference,url,license';
          break;
        case (serviceID.match(/nearby\(/) || {}).input:
          caption = '&title_field=title&fields=title,id,pid,place,date,category,geonamesreference,theme,centroid,distance,url,license';
          break;
        case (serviceID.match(/geometryByName\(/) || {}).input:
          caption = '&title_field=name&fields=name,id,admin_unit,centroid,geonamesreference,logainmreference,license';
          break;
        case (serviceID.match(/placeByID\(/) || {}).input:
          caption = '&title_field=name&fields=name,rps_authority,rps_id,adminunit,description,address,centroid,wikipediareference,license';
          break;
        case (serviceID.match(/id\(/) || {}).input:
          caption = '&title_field=title&fields=pid,place,date,category,theme,centroid,geonamesreference,url,id,license';
          break;
        case (serviceID.match(/collectionId\(/) || {}).input:
          caption = '&title_field=title&fields=name,pid,admin_unit,category,theme,centroid,geonamesreference,logainmreference,license';
          break;
        default:
          caption = '&title_field=title';
      }
    } 
    else if (this.mapConfig[ 'title_field']) {
      caption = '&title_field=' + this.configMap[ 'title_field'];
    }
    if (this.mapConfig[ 'cluster'] == true) {
      caption = caption + '&cluster=true';
    }
    caption = caption + '&logo=' + encodeURI(this.mapConfig[ 'logo']) + '&attribution=' + this.mapConfig[ 'attribution'].replace(' ', '%20') + '&iframe=true';
    mapUrl = this.mapConfig[ 'external_map_service'] + '?src=' + encodeURIComponent(service[ "@id"].replace('&amp;', '&')) + caption;
    return mapUrl;
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
  },
  
  /* adds the locales to the internationalization module of the viewer */
  addLocalesToViewer: function () {
    for (var language in this.locales) {
      i18next.addResources(
      language, 'translation',
      this.locales[language]);
    }
  },
  
  /* overlay opacity slider control to enable iframe transparency */
  addOpacityControlToViewer: function (slotID) {
    var opacitySlider = '<input style="left:2em;" type="range" min=".6" max="1.0" step=".05" value="1" data-orientation="vertical">';
    $('div.layout-slot[data-layout-slot-id="' + slotID + '"] div.overlayMap').append('<div id="opacitySlider">' + opacitySlider + '</div>');
    $(function () {
      var output = document.querySelectorAll('output')[0];
      $(document).on('input', 'input[type="range"]', function (e) {
        $('div.layout-slot[data-layout-slot-id="' + slotID + '"] div.overlayMap').css("opacity", e.currentTarget.value);
      });
      $('div.layout-slot[data-layout-slot-id="' + slotID + '"] input[type=range]').rangeslider({
        polyfill: false
      });
    });
  }
};

$(document).ready(function () {
  iiifGeoJSON.init();
  $('.mirador-icon-canvas-map').on('click', function (event) {
    event.preventDefault();
  });
  $(document).on('click', function (event) {
    /* close an open map window */
    var target = event.target;
    if ($(target).hasClass("fa-times")) {
      var current_slot_id = $("i.fa-times").closest('span').attr("data-slotid");
      $('div.layout-slot[data-layout-slot-id="' + current_slot_id + '"] .overlayMap').toggle(300);
    }
  });
});
