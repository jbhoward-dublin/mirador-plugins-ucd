/*
 * TO DO:
 *
 * If IIIF jsonLd.seeAlso.format == 'application/tei+xml' then assign value 'none' to manifestsFromThePage hash to suppress link??
 *
 * ---
 *
 * linktoFromThePage.js: Mirador plugin to create userMenu links to the FromThePage (FtP) transcription platform
 *
 * plugin loads manifests and queries the FromThePage iiif/for endpoint for corresponding derivative manifests which include FtP work_id's
 * - a hash (manifestsFromThePage) is created of manifestIDs + related canvas IDs and corresponding FtP URIs (or null valuesif no correspondence found)
 * - links to FtP are created when:
 *   . only a single window is displayed
 *   . the IDs of the loadedManifest or the canvasID that has the focus have a non-null value in the amnifestsFromThePage hash
 *
 * configuration choices
 * - show_status_link: creates a userButton labelled 'status' that links to the xHTML visualisation of the corresponding FtP TEI file
 * - timeoutFromThePage: there can be noticeable latency in response form the FtP endpoint ; set a value for timeout of requests
 * - localisation can be expanded by adding to the i18next 'locales' array
 *
 * Nota bene: plugin also provides bespoke handling of manifests representing documents at the duchas.ie transcription site which have no counterpart
 *   in FromThePage
 *
 *   also note: if a IIIF manifest has been imported more than once into FtP, multiple derivative manifests may exist in the platform so there is risk of
 *   an incorrect match being made ; to avoid this situation the manifestsFromThePage hash can be initialised with the manifest and canvas IDs of the
 *   resources that have more than one manifestation in FtP
 *
 */

var configFromThePage = {
    "show_status_link": true, // provide link to FromThePage's xhtml output
    "show_transcribed_link": false, // if already transcribed, there is a seeAlso link for format property == 'application/tei+xml' ; show if true, not if false
    // this is a UCD practice when a TEI document is available in the UCD repository
    "timeoutFromThePage": 5000 // maximum tolerable latency for a FromThePage response
}

var linkFromThePage = {
    /*
     * setup user buttons & styles in Mirador, process data
     *
     */
    /* the template for the Transcribe buttons */
    template_transcribe: Handlebars.compile([
    '<li>',
    '<a class="transcribe hidden hidden-xs btn btn-danger btn-xs hidden-sm i18n" style="vertical-align: top!important; background-color: red; font-weight: bold; color: #FFF" target="_blank" data-i18n="transcribe;[title]transcribeTooltip" title="Link to Transcription Site" href>',
    '  transcribe',
    '</a>',
    '</li>'].join('')),
    template_status: Handlebars.compile([
    '<li>',
    '<a class="status hidden hidden-xs btn btn-danger btn-xs hidden-sm i18n" style="vertical-align: top!important; background-color: red; font-weight: bold; color: #FFF" target="_blank" data-i18n="status;[title]statusTooltip" title="View transcription status" href>',
    '  status',
    '</a>',
    '</li>'].join('')),
    newStyle: Handlebars.compile([
    '<style>',
    ' .transcribe { position:relative; }',
    ' .transcribe:before { content: "\\F14C"; font-family: FontAwesome; left:-18px; position:absolute; top:0px; }',
    ' .status { position:relative; }',
    ' .status:before { content: "\\F14C"; font-family: FontAwesome; left:-18px; position:absolute; top:0px; }',
    '</style>'].join('')),
    
    /* injects the userButtons & associated styles into the viewer */
    injectUserButton: function () {
        var transcribeButton = this.template_transcribe();
        var statusButton = this.template_status();
        var newStyle = this.newStyle();
        $("body").append(newStyle);
        var injector = setInterval(appendButton, 200);
        /* wait for Mirador to inject userButtons into the DOM */
        function appendButton() {
            if (! $("a").hasClass("transcribe")) {
                if (configFromThePage[ "show_status_link"] == true) {
                    $("body > #viewer > div.mirador-main-menu-bar > ul.user-buttons").prepend(statusButton);
                }
                $("body > #viewer > div.mirador-main-menu-bar > ul.user-buttons").prepend(transcribeButton);
                setTimeout(function () {
                    clearInterval(injector);
                },
                10000);
            }
        }
        this.addLocalesToViewer();
    },
    
    /* adds  locales to the i18next localisation */
    addLocalesToViewer: function () {
        for (language in this.locales) {
            i18n.addResources(
            language, 'translation',
            this.locales[language]);
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
            'transcribe': 'transcribe',
            'status': 'status'
        }
    },
    
    /*
     * functions
     */
    
    workspaceEventHandler: function () {
        var this_ = this;
        var originalListenForActions = Mirador.Workspace.prototype.listenForActions;
        var origFunc = Mirador.Workspace.prototype.bindEvents;
        Mirador.Workspace.prototype.bindEvents = function () {
            var _this = this;
            
            _this.eventEmitter.subscribe('manifestQueued', function (event, data) {
                //console.log('1: manifest queued');
                hideTranscriptionLink();
            })
            
            _this.eventEmitter.subscribe('manifestReceived', function (event, data) {
                /*
                 */
                //console.log('2: manifest received');
                /*
                 */
                if (data.jsonLd !== undefined) {
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
                            if (configFromThePage['show_transcribed_link'] == true) {
                                manifestsFromThePage[manifestID] = duchasURI;
                            } else {
                                manifestsFromThePage[manifestID] = duchasURI;
                            }
                        } else {
                            manifestsFromThePage[manifestID] = null;
                        }
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
            })
            
            _this.eventEmitter.subscribe('REMOVE_WINDOW', function (event, data) {
                //console.log('3: window removed');
                hideTranscriptionLink();
                if (getNumSlots() == 1) {
                    var currentImgID = getCurrentCanvasID();
                    if (currentImgID.indexOf("duchas:") >= 0) {
                        $("a.transcribe").attr("href", manifestsFromThePage[currentImgID]);
                        $("a.transcribe").removeClass("hidden");
                        return;
                    } else if (manifestsFromThePage[currentImgID] == undefined) {
                        var fromThePageURI = linktoFromThePage(currentImgID, 'canvases');
                        return;
                    } else if (manifestsFromThePage[currentImgID] !== undefined && manifestsFromThePage[currentImgID] !== null) {
                        var fromThePageURI = linktoFromThePage(currentImgID, 'canvases');
                    }
                    return;
                }
            })
            
            _this.eventEmitter.subscribe('REMOVE_NODE', function (event, data) {
                //console.log('4: node removed');
                hideTranscriptionLink();
                if (getNumSlots() < 2) {
                    var currentImgID = getCurrentCanvasID();
                    if (manifestsFromThePage[currentImgID] !== undefined && manifestsFromThePage[currentImgID] !== null) {
                        var fromThePageURI = linktoFromThePage(currentImgID, 'canvases');
                    }
                    return;
                }
            })
            /*
            _this.eventEmitter.subscribe('ADD_SLOT_ITEM', function(event, data) {
            //console.log('5: slot added');
            })
             */
            _this.eventEmitter.subscribe('ADD_WINDOW', function (event, data) {
                //console.log('6: window added');
                
                hideTranscriptionLink();
                if (data.manifest !== undefined) {
                    if (data.manifest.uri !== undefined && data.manifest.uri !== null) {
                        var canvasID = data.canvasID;
                        if (manifestsFromThePage[data.manifest.uri] !== undefined && manifestsFromThePage[data.manifest.uri] !== null) {
                            var fromThePageURI = linktoFromThePage(data.manifest.uri, 'manifests');
                        }
                        return;
                    }
                }
                if (data.canvasID !== undefined && data.canvasID !== null) {
                    /* there appears to be a Mirador bug returning a bad canvasID, also with windowUpdated function (used below)
                     * for example: https://data.ucd.ie/api/img/ivrla:3853/canvas/ivrla:3853
                     * compare manifest: https://data.ucd.ie/api/img/manifests/ivrla:3853
                     * the test below is specific to UCD manifests
                     */
                    var canvasID = data.canvasID;
                    if (getPID(data.canvasID) == canvasID.split('/').pop().split('.').shift()) {
                        /* we've got a problem ... */
                        console.log('Mirador.Workspace ADD_WINDOW event returned bad value for data.canvasID');
                        var tmp = 'https://data.ucd.ie/api/img/manifests/' + getPID(data.canvasID);
                        var currentImgID = getCurrentCanvasID();
                        return;
                    }
                    if (manifestsFromThePage[data.canvasID] !== undefined && manifestsFromThePage[data.canvasID] !== null) {
                        var fromThePageURI = linktoFromThePage(data.canvasID, 'canvases');
                    }
                    return;
                }
            })
            
            _this.eventEmitter.subscribe('SPLIT_RIGHT', function (event, data) {
                //console.log('7: split right');
                hideTranscriptionLink();
            })
            
            _this.eventEmitter.subscribe('SPLIT_LEFT', function (event, data) {
                //console.log('8: split left');
                hideTranscriptionLink();
            })
            
            _this.eventEmitter.subscribe('SPLIT_DOWN', function (event, data) {
                //console.log('9: split down');
                hideTranscriptionLink();
            })
            
            _this.eventEmitter.subscribe('SPLIT_UP', function (event, data) {
                //console.log('10: split up');
                hideTranscriptionLink();
            })
            origFunc.apply(this);
        }
    },
    
    /* ImageView & BookView  */
    addEventHandlersToViewer: function (viewType) {
        var originalListenForActions = Mirador[viewType].prototype.listenForActions;
        var extendedListenForActions = function () {
            originalListenForActions.apply(this, arguments);
            
            this.eventEmitter.subscribe('windowUpdated', function (event, data) {
                /*
                 * console.log('A: window updated');
                 */
                //console.log(data);
                hideTranscriptionLink();
                if (getNumSlots() > 1) {
                    return;
                }
                var currentImgID = getCurrentCanvasID();
                if (getNumSlots() < 2) {
                    
                    if (manifestsFromThePage[currentImgID] !== undefined && manifestsFromThePage[currentImgID] !== null) {
                        if (currentImgID.indexOf("duchas:") >= 0) {
                            $('a.transcribe').attr("href", manifestsFromThePage[currentImgID]);
                            $('a.transcribe').removeClass("hidden");
                        } else {
                            if (manifestsFromThePage[currentImgID] !== false) {
                                var fromThePageURI = linktoFromThePage(currentImgID, 'canvases');
                            }
                            return;
                        }
                        return;
                    } else {
                        if (currentImgID !== undefined && currentImgID != '') {
                            if (manifestsFromThePage[currentImgID] !== null) {
                                if (manifestsFromThePage[currentImgID] !== false) {
                                    var fromThePageURI = linktoFromThePage(currentImgID, 'canvases');
                                }
                                return;
                            }
                        }
                    }
                }
                hideTranscriptionLink();
            }.bind(this));
        }
        Mirador[viewType].prototype.listenForActions = extendedListenForActions;
    },
    
    /* initialise plugin */
    init: function () {
        /* add event handlers to Mirador */
        this.workspaceEventHandler();
        this.addEventHandlersToViewer('ImageView');
        this.addEventHandlersToViewer('BookView');
    }
};

/*
 * initialise to avoid problem with duplicate imports in FromThePage
 */

/* UCD specific: */
var duchasTranscribed = false;

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

/*
 * functions
 */

/* temporary function to deal with presumed Mirador bug */
function getPID(str) {
    /* this is for a temporary fix */
    var val = str.substr(str.indexOf("/img/") + 5);
    val = val.substr(0, val.indexOf('/'));
    return val;
}

function getCurrentCanvasID() {
    return $.trim($(".thumbnail-image.highlight").attr('data-image-id'));
}

function linktoFromThePage(ID, type) {
    if (typeof type === undefined) {
        type = 'manifests';
    }
    if (manifestsFromThePage[ID] !== undefined) {
        if (manifestsFromThePage[ID] == null) {
            return;
        }
    }
    if (manifestsFromThePage[ID] == undefined) {
        manifestsFromThePage[ID] = false;
    }
    /* add protocol declaration if missing ... not appropriate for all sites */
    if (ID.substring(0, 2) == '//') {
        ID = $.trim('https:' + ID);
    }
    
    /* skip if previously queried */
    if (manifestsFromThePage[ID] !== undefined && manifestsFromThePage[ID] !== null && manifestsFromThePage[ID] !== false) {
        updateTranscriptionLink(ID, type);
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
                    updateTranscriptionLink(ID, 'manifests');
                } else if (type == 'canvases') {
                    var response = data[ "@id"];
                    response = data[ "@id"].substr(0, response.indexOf('/canvas/')) + '/manifest';
                    manifestsFromThePage[ID] = $.trim(response);
                    updateTranscriptionLink(ID, 'canvases');
                }
            }
        }
    }
}

function updateTranscriptionLink(ID, type) {
    if (getNumSlots() > 1) {
        hideTranscriptionLink();
        return;
    }
    
    if (type == 'canvases') {
        /* value should match that of the currentImgID */
        var currentImgID = getCurrentCanvasID();
        ID = currentImgID;
    }
    
    if (manifestsFromThePage[ID] == null || manifestsFromThePage[ID] == false) {
        return;
    }
    
    if (manifestsFromThePage[ID] !== undefined && manifestsFromThePage[ID] !== "") {
        
        /* need to start with highlighted image in the current window, then process only canvasIDs in the current slot */
        
        var targetURI = manifestsFromThePage[ID];
        /* update hash assigning targetURI at FromThePage to all canvases identified in the manifest */
        $('img.highlight').closest("div.layout-slot").find('img[data-image-id]').each(function () {
            if ($(this).attr("data-image-id") !== undefined) {
                var canvasID = $(this).attr("data-image-id");
                if (manifestsFromThePage[canvasID] == undefined && manifestsFromThePage[canvasID] !== null) {
                    if (targetURI == null) {
                        manifestsFromThePage[canvasID] = null;
                    } else {
                        manifestsFromThePage[canvasID] = targetURI;
                    }
                }
            }
        });
        
        var link = setLinkTypeFromThePage(manifestsFromThePage[ID], 'read');
        if (link.substr(link.indexOf("work_id") + 8).length) {
            $('a.transcribe').attr("href", link);
            $('a.transcribe').removeClass("hidden");
            /* one can configure an option to link to HTML that shows formatted transcription & status */
            if ($('a.status') && configFromThePage[ 'show_status_link'] == true && ! manifestsFromThePage[ID].includes("duchas")) {
                $('a.status').attr("href", setLinkTypeFromThePage(manifestsFromThePage[ID], 'xhtml'));
                $('a.status').removeClass("hidden");
            }
        }
    }
}

function setLinkTypeFromThePage(uri, activity) {
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
}

function hideTranscriptionLink() {
    if (! $("a.transcribe").is(".hidden")) {
        $("a.transcribe").addClass("hidden");
        $("a.transcribe").attr("href", "");
    }
    if (! $("a.status").is(".hidden")) {
        $("a.status").addClass("hidden");
        $("a.status").attr("href", "");
    }
    return;
}

function getNumSlots() {
    return $('div.panel-thumbnail-view img.highlight').length;
}

$(document).ready(function () {
    if (! $('a').hasClass("transcribe")) {
        linkFromThePage.injectUserButton();
    }
    linkFromThePage.init();
    if (getNumSlots() > 1) {
        hideTranscriptionLink();
    }
});
