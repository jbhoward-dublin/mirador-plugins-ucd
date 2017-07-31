var collectionsFtP = new Object();
/* change path to suit: */
var text = $.getJSON('/mirador/local/data/collections_FtP.json').done(function (data) {
  collectionsFtP = data;
});
