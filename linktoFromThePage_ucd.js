/* 
 * configuration choices
 */
 
var config ={
    "show_tei_link": false,
    "show_xhtml_link": true
}

var linkFromThePage = { 
/* 
 * deploying depends on implementation of security certificate at FromThePage.com
 * 
 */
  /* the template for the Transcribe buttons */
  template_transcribe: Handlebars.compile([
    '<li>',
    '<a class="transcribe hidden hidden-xs btn btn-danger btn-xs hidden-sm i18n" style="vertical-align: top!important; background-color: red; font-weight: bold; color: #FFF" target="_blank" data-i18n="transcribe;[title]transcribeTooltip" title="Link to Transcription Site" href>',
    '  Transcribe',
    '</a>',
    '</li>'
  ].join('')),
  template_status: Handlebars.compile([
    '</li>',
    '<li>',
    '<a class="status hidden hidden-xs btn btn-danger btn-xs hidden-sm i18n" style="vertical-align: top!important; background-color: red; font-weight: bold; color: #FFF" target="_blank" data-i18n="status;[title]statusTooltip" title="View transcription status" href>',
    '  Status',
    '</a>',
    '</li>' 
  ].join('')),
  newStyle: Handlebars.compile([
    '<style>',
    ' .transcribe { position:relative; }',
    ' .transcribe:before { content: "\\F14C"; font-family: FontAwesome; left:-18px; position:absolute; top:0px; }',
    ' .status { position:relative; }',
    ' .status:before { content: "\\F14C"; font-family: FontAwesome; left:-18px; position:absolute; top:0px; }',
    '</style>' 
  ].join('')),

  /* injects the userButtons & associated styles into the viewer */
  injectUserButton: function(){ 
    var transcribeButton = this.template_transcribe();
    var statusButton = this.template_status();
    var newStyle = this.newStyle();
    $("body").append(newStyle);
    var injector = setInterval(appendButton,200); /* wait for Mirador to inject userButtons into the DOM */
    function appendButton() {
      if ($(".status").length === 0){
        if (config['show_xhtml_link'] == true) {
           $("body > #viewer > div.mirador-main-menu-bar > ul.user-buttons").prepend(statusButton);
        }
        $("body > #viewer > div.mirador-main-menu-bar > ul.user-buttons").prepend(transcribeButton);
        setTimeout(function() {
          clearInterval(injector);
        }, 10000);
      }
    }
    this.addLocalesToViewer();
  },
  
  /* adds  locales to the i18next localisation */
  addLocalesToViewer: function(){
    for(language in this.locales){
      i18n.addResources(
        language, 'translation',
        this.locales[language]
      );
    }
  },
  
  /* 
   * i18next locales - supplement
  */
  
    locales: {
    'ga': {
      'transcribe': 'trascríobh',
      'status': 'stádas'
    },
    'en': {
      'transcribe': 'Transcribe',
      'status': 'Status'
    }
  },

  /*
   * functions
   */ 

  /*  UCD specific: */
  windowGetJSON: function (ID) {
    if (manifestsFromThePage[ID] !== undefined) {
      return;
    }
    Mirador.MetadataView.prototype.getMetadataDetails = function(jsonLd) {
      var recordID = jsonLd["@id"];
      var duchasURI;
      if (ID = $.trim(jsonLd["@id"])) {
        var manifestID = $.trim(jsonLd["@id"]);
        if (jsonLd.seeAlso) {
          $.each(jsonLd.seeAlso, function(index, item) {
            var label = Mirador.JsonLd.getTextValue(item.label);
            var format = Mirador.JsonLd.getTextValue(item.format);
            var id = Mirador.JsonLd.getTextValue(item["@id"]);
            if (~id.indexOf("http://www.duchas.ie/en/cbes/")) {
               duchasURI = id;
            }
            if (format == 'application/tei+xml') { /* if already described, don't provide a link */
              duchasTranscribed = true;
              manifestsFromThePage[manifestID] = '';
            } else {
              manifestsFromThePage[manifestID] = duchasURI;
            }
          });
        }
        $.each(jsonLd.sequences[0].canvases[0], function(index, item) {
          var label = Mirador.JsonLd.getTextValue(item.label);
          if (index == "@id") { /* add canvas IDs to manifestsFromThePage hash */
            if (duchasTranscribed == true) {
              manifestsFromThePage[item] = '';
            } else {
              manifestsFromThePage[item] = duchasURI;
            }
          }
        });
      }
      return;
    }
  },
  /* end UCD specific */

  workspaceEventHandler: function(){
      var this_ = this;
      var originalListenForActions = Mirador.Workspace.prototype.listenForActions;
      var origFunc = Mirador.Workspace.prototype.bindEvents;
      Mirador.Workspace.prototype.bindEvents = function() {
        var _this= this;
        
        _this.eventEmitter.subscribe('manifestQueued', function(event, data) {
          //console.log('1: manifest queued');
          hideTranscriptionLink(); 
        })
/*
        _this.eventEmitter.subscribe('manifestReceived', function(event, data) {
           //console.log('2: manifest received');
           
        })
*/
        _this.eventEmitter.subscribe('REMOVE_WINDOW', function(event, data) {
           //console.log('3: window removed');
           hideTranscriptionLink();
           if (getNumSlots() == 1) {
             var currentImgID = $(".thumbnail-image.highlight").attr('data-image-id');
             if (currentImgID.indexOf("duchas:") >= 0) {
               $('a.transcribe').attr("href",manifestsFromThePage[currentImgID]);
               $('a.transcribe').removeClass("hidden");
               return;
             }
             else if (manifestsFromThePage[currentImgID] == undefined) {
               var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
               return;
             }
             else if (manifestsFromThePage[currentImgID] !== undefined && manifestsFromThePage[currentImgID] !== "") {
               var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             }
             return;
           }
        })

        _this.eventEmitter.subscribe('REMOVE_NODE', function(event, data) {
           //console.log('4: node removed');
           if (getNumSlots() < 2) {
             var currentImgID = $(".thumbnail-image.highlight").attr('data-image-id');
             var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             return;
           }
        })
        
        _this.eventEmitter.subscribe('ADD_SLOT_ITEM', function(event, data) {
           //console.log('5: slot added');
           hideTranscriptionLink();
        })
        
        _this.eventEmitter.subscribe('ADD_WINDOW', function(event, data) {      // window populated by images 
           //console.log('6: window added');
           hideTranscriptionLink();
           if (data.manifest !== undefined) {
             if (data.manifest.uri !== undefined && data.manifest.uri !== null) {
               var fromThePageURI = linktoFromThePage(data.manifest.uri,'manifests');
               return;
             }
           }
           if (data.canvasID !== undefined && data.canvasID !== null) {
             /* there appears to be a Mirador bug returning a bad canvasID
              * for example: https://data.ucd.ie/api/img/ivrla:3853/canvas/ivrla:3853 
              * compare manifest: https://data.ucd.ie/api/img/manifests/ivrla:3853
              * the test below is specific to UCD manifests
             */
             var canvasID = data.canvasID;
             if (getPID(data.canvasID) == canvasID.split('/').pop().split('.').shift()) {
               /* we've got a problem ... */
               console.log('Mirador.Workspace ADD_WINDOW event returned bad value for data.canvasID');
               var tmp = 'https://data.ucd.ie/api/img/manifests/' + getPID(data.canvasID);
               var fromThePageURI = linktoFromThePage(tmp,'manifests');
               return;
             }
             var fromThePageURI = linktoFromThePage(data.canvasID,'canvases');
             return;
           }
        })

        _this.eventEmitter.subscribe('SPLIT_RIGHT', function(event, data) {
           //console.log('7: split right');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_LEFT', function(event, data) {
           //console.log('8: split left');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_DOWN', function(event, data) {
           //console.log('9: split down');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_UP', function(event, data) {
           //console.log('10: split up');
           hideTranscriptionLink();
        })
        origFunc.apply(this); 
      }
  },

  /* ImageView & BookView  */
  addEventHandlersToViewer: function(viewType){ 
    hideTranscriptionLink();
    var originalListenForActions = Mirador[viewType].prototype.listenForActions;
    var extendedListenForActions = function(){
      originalListenForActions.apply(this, arguments);
      
      this.eventEmitter.subscribe('windowUpdated', function(event, data){
        //console.log('A: window updated');
        var currentImgID = $.trim($(".thumbnail-image.highlight").attr('data-image-id'));
        if (getNumSlots() == 1) {
           if (manifestsFromThePage[currentImgID] !== undefined) {
             if (currentImgID.indexOf("duchas:") >= 0) {
               $('a.transcribe').attr("href",manifestsFromThePage[currentImgID]);
               $('a.transcribe').removeClass("hidden");
             }
             else {
               var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
               return;
             }
             return;
           }
           else {
             var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             return;
           }
           if ( duchasTranscribed == false && ( manifestsFromThePage[currentImgID] !== undefined && manifestsFromThePage[currentImgID] !== "" ) ) {
             var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             $('a.transcribe').attr("href",fromThePageURI);
             $('a.transcribe').removeClass("hidden");
             return;
           }
        }
        else { hideTranscriptionLink(); }
      }.bind(this));
    }
    Mirador[viewType].prototype.listenForActions = extendedListenForActions; 
  },

  /* initialise plugin */
  init: function(){
    /* add event handlers to Mirador */
    this.workspaceEventHandler();
    this.addEventHandlersToViewer('ImageView');
    this.addEventHandlersToViewer('BookView'); 
    //this.addEventHandlersToViewer('ScrollView'); 
  }
};

/*
 * initialise to avoid problem with duplicate imports in FromThePage
*/

/* UCD specific: */
var duchasTranscribed = false;

var manifestsFromThePage = {
  "https://data.ucd.ie/api/img/manifests/ivrla:3849": "http://fromthepage.com/iiif/355/manifest",
  "https://data.ucd.ie/api/img/ivrla:3849/canvas/ivrla:3850": "http://fromthepage.com/iiif/355/manifest",
  "https://data.ucd.ie/api/img/manifests/ivrla:3827": "http://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3828": "http://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3829": "http://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3830": "http://fromthepage.com/iiif/340/manifest",
  "https://data.ucd.ie/api/img/ivrla:3827/canvas/ivrla:3831": "http://fromthepage.com/iiif/340/manifest"
};

/*
 * functions
*/

/* temporary function to deal with presumed Mirador bug */
function getPID(str) { /* this is for a temporary fix */
  var val = str.substr(str.indexOf("/img/") + 5);
  val = val.substr(0, val.indexOf('/'));
  return val;
}

function linktoDuchas(ID) {
  linkFromThePage.windowGetJSON();
  return;
}

function linktoFromThePage(ID, type) {
  if (typeof type === undefined) {
    type = 'manifests';
  }

  /* add protocol declaration if missing ... not appropriate for all sites */
  if (ID.substring(0,2) == '//') { ID = $.trim('https:' + ID); }
  
  /* skip if previously queried */
  if (manifestsFromThePage[ID] !== undefined || manifestsFromThePage[ID] == '') {
    updateTranscriptionLink(ID,type);
    return manifestsFromThePage[ID];
  }

  if (ID.indexOf("duchas:") >= 0) {
    linkFromThePage.windowGetJSON(ID);
  }
  
  var url = 'http://fromthepage.com/iiif/for/' + ID;

  $.ajax(url, {
    success: function(responseText) {
      if (responseText !== undefined) { 
        if (manifestsFromThePage[ID] === undefined) {
          if (type == 'manifests') {
            manifestsFromThePage[ID] = responseText["@id"]; 
            updateTranscriptionLink(ID,'manifests');
          }
          else if (type == 'canvases') {
            var response = responseText["@id"];
            response = response.substr(0, response.indexOf('/canvas/')) + '/manifest';
            manifestsFromThePage[ID] = $.trim(response);
            updateTranscriptionLink(ID,'canvases');
          }
        }
      }
    },
    error:function (xhr, ajaxOptions, errorMsg){
      if(xhr.status==404) {
        //console.log(errorMsg);
        manifestsFromThePage[ID] = "";	/* so we don't have to check again */
      }
      else if(xhr.status==401) {
        //console.log(errorMsg);
        manifestsFromThePage[ID] = "";	/* so we don't have to check again */
        alert('This is a private collection in FromThePage. Please login directly to FromThePage for further information.');
      }
    },
    timeout: 10000
  });
}

function updateTranscriptionLink(ID,type) { 
  if (getNumSlots() > 1) { 
    hideTranscriptionLink();
    return;
  }
  if (manifestsFromThePage[ID] !== undefined && manifestsFromThePage[ID] !== null && manifestsFromThePage[ID] !== "") { 
    if (getNumSlots() == 1) {
      var link = setLinkTypeFromThePage(manifestsFromThePage[ID],'read');
      $('a.transcribe').attr("href",link);
      $('a.transcribe').removeClass("hidden");
      /* one can provide an option of a link to HTML that shows formatted transcription & status */
      $('a.status').attr("href",setLinkTypeFromThePage(manifestsFromThePage[ID],'xhtml'));
      $('a.status').removeClass("hidden");
    }
  }
}

function setLinkTypeFromThePage(uri,activity) {
  var val = uri.substr(uri.indexOf("/iiif/") + 6);
  val = val.substr(0, val.indexOf('/'));
  var uri;
  switch (activity) {
    case 'about':
      uri = 'http://fromthepage.com/work/show?work_id=' + val;
      break;
    case 'edit':
      uri = 'http://fromthepage.com/work/edit?work_id=' + val;
      break;
    case 'read':
      uri = 'http://fromthepage.com/display/read_work?work_id=' + val;
      break;
    case 'show':
      uri = 'http://fromthepage.com/display/show?work_id=' + val;
      break;
    case 'xhtml':
      uri = 'http://fromthepage.com/export/show?work_id=' + val;
      break;
    default:
      uri = 'http://fromthepage.com/display/read_work?work_id=' + val;
  }
  return uri;
}

function hideTranscriptionLink() {
  if (! $("a.transcribe").is(".hidden") ) { 
    $("a.transcribe").addClass("hidden");
    $("a.transcribe").attr("href","");
  }
  if (! $("a.status").is(".hidden") ) { 
    $("a.status").addClass("hidden");
    $("a.status").attr("href","");
  }
  return;
}

function getNumSlots() {
  return $('div.panel-thumbnail-view img.highlight').length;
}

$(document).ready(function(){
  if ( $('a.transcribe').length == 0) {
    linkFromThePage.injectUserButton();
  }
  linkFromThePage.init(); 
  if (getNumSlots() > 1) { hideTranscriptionLink(); }
});
