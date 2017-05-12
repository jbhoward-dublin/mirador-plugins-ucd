var collectionsFtP = new Object();
var text = $.getJSON('/mirador/data/collections_FtP.json').done(function (data) {
  collectionsFtP = data;
});
