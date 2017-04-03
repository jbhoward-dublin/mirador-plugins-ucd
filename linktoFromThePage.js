var linkFromThePage = { 
/* 
 * deploying depends on implementation of security certificate at FromThePage.com
 * 
 */
  /* the template for the navigation buttons */
  template: Handlebars.compile([
    '<li>',
    '<a class="transcribe hidden-xs btn btn-danger btn-xs hidden-sm i18n" style="vertical-align: top!important; background-color: red; font-weight: bold; color: #FFF" target="_blank" data-i18n="transcribe;[title]transcribeTooltip" title="Link to Transcription Site" href>',
    '  Transcribe',
    '</a>',
    '</li>' 
  ].join('')),
  newStyle: Handlebars.compile([
    '<style>',
    ' .transcribe { position:relative; }',
    ' .transcribe:before { content: "\\F14C"; font-family: FontAwesome; left:-18px; position:absolute; top:0px; }',
    '</style>' 
  ].join('')),

  /* injects the userButton & associated style into the viewer */
  injectUserButton: function(){ 
    var transcribeButton = this.template();
    var newStyle = this.newStyle();
    $("body").append(newStyle);
    setTimeout(appendButton,3000);
    function appendButton() {
      if ($(".transcribe").length === 0){
        $("body > #viewer > div.mirador-main-menu-bar > ul.user-buttons").prepend(transcribeButton);
      }
    }
  },

  /*
   * functions
   */ 

  workspaceEventHandler: function(){
      var this_ = this;
      var originalListenForActions = Mirador.Workspace.prototype.listenForActions;
      var origFunc = Mirador.Workspace.prototype.bindEvents;
      Mirador.Workspace.prototype.bindEvents = function() {
        var _this= this;
        
        _this.eventEmitter.subscribe('manifestQueued', function(event, data) {
          console.log('1: manifest queued');
          hideTranscriptionLink(); 
        })

        _this.eventEmitter.subscribe('manifestReceived', function(event, data) {
           console.log('2: manifest received');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('REMOVE_WINDOW', function(event, data) {
           console.log('3: window removed');
           if (getNumSlots() > 1) { hideTranscriptionLink(); }
           if (getNumSlots() == 1) {
             var currentImgID = $(".thumbnail-image.highlight").attr('data-image-id'); 
             var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             return;
           }
        })

        _this.eventEmitter.subscribe('REMOVE_NODE', function(event, data) {
           console.log('4: node removed');
           if (getNumSlots() < 2) {
             var currentImgID = $(".thumbnail-image.highlight").attr('data-image-id');
             var fromThePageURI = linktoFromThePage(currentImgID,'canvases');
             return;
           }
        })
/* 
        _this.eventEmitter.subscribe('ADD_SLOT_ITEM', function(event, data) {
           console.log('5: slot added');
           
        })
*/
        _this.eventEmitter.subscribe('ADD_WINDOW', function(event, data) {      // window populated by images 
           console.log('6: window added');
           hideTranscriptionLink();
           if (data.loadedManifest !== undefined) {
             var fromThePageURI = linktoFromThePage(data.loadedManifest,'manifests');
             return;
           }

           if (data.manifest !== undefined) { 
             if (data.manifest.uri!== undefined) {
               var fromThePageURI = linktoFromThePage(data.manifest.uri,'manifests');
               return;
             }
           }
        })

        _this.eventEmitter.subscribe('SPLIT_RIGHT', function(event, data) {
           console.log('7: split right');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_LEFT', function(event, data) {
           console.log('8: split left');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_DOWN', function(event, data) {
           console.log('9: split down');
           hideTranscriptionLink();
        })

        _this.eventEmitter.subscribe('SPLIT_UP', function(event, data) {
           console.log('10: split up');
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
        console.log('A: window updated');
        if (data.canvasID !== undefined && getNumSlots() < 2) { 
          var fromThePageURI = linktoFromThePage(data.canvasID,'canvases');
          return;
        } else if (getNumSlots() == 1) {
          if (data.loadedManifest !== undefined) {
             var fromThePageURI = linktoFromThePage(data.loadedManifest,'manifests');
             return;
           }
        }
        if (getNumSlots() > 1) { hideTranscriptionLink(); }
      }.bind(this));
    }
    Mirador[viewType].prototype.listenForActions = extendedListenForActions; 
  },

  /* initialise plugin */
  init: function(){
    setTimeout(this.injectUserButton(),1000);
    /* add event handlers to Mirador */
    this.workspaceEventHandler();
    this.addEventHandlersToViewer('ImageView');
    this.addEventHandlersToViewer('BookView'); 
  }
};

/*
 * initialise to avoid problem with duplicate imports in FromThePage
*/

var manifestsFromThePage = {
  "https://data.ucd.ie/api/img/manifests/ivrla:3849": "http://fromthepage.com/iiif/355/manifest" 
};

/*
 * functions
*/

function linktoFromThePage(ID, type) {
  if (typeof type === undefined) {
    type = 'manifests';
  } 
  /* skip if previously queried */
  if (manifestsFromThePage[ID] !== undefined) { return manifestsFromThePage[ID]; }

  /* add protocol declaration if missing ... not appropriate for all sites */
  if (ID.substring(0,2) == '//') { ID = 'https:' + ID; }

  var url = 'http://fromthepage.com/iiif/for/' + ID;

  jQuery.ajax(url, {
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
        ID = null;
        //console.log(errorMsg);
        if (manifestsFromThePage[ID] === undefined) {
          manifestsFromThePage[ID] = '';	/* so we don't have to check again */
          return;
        }
        return;
      }
      else if(xhr.status==401) {
        ID = null;
        //console.log(errorMsg);
        if (manifestsFromThePage[ID] === undefined) {
          manifestsFromThePage[ID] = '';	/* so we don't have to check again */
          alert('This is a private collection in FromThePage. Please login directly to FromThePage for further information.');
          return;
        }
        return;
      }
    },
    timeout: 10000
  });
  return;
}

function updateTranscriptionLink(ID,type) { 
  if (getNumSlots() > 1) { 
    hideTranscriptionLink();
    return;
  }
  if (manifestsFromThePage[ID] !== undefined && manifestsFromThePage[ID] !== null && manifestsFromThePage[ID] !== '') { 
    if (manifestsFromThePage[ID].length && getNumSlots() == 1) {
      var link = setLinkTypeFromThePage(manifestsFromThePage[ID],'read');
      $('a.transcribe').attr("href",link);
      $('a.transcribe').removeClass("hidden");
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
  return;
}

function getNumSlots() {
  return $('img.highlight').length;
}

$(document).ready(function(){
  linkFromThePage.init(); 
  if (getNumSlots() > 1) { hideTranscriptionLink(); }
});
