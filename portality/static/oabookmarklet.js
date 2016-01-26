jQuery(document).ready(function() {

$.getScript("https://openaccessbutton.org/static/oabutton.js", function() {
    
    var detectAuthorEmail = function() {
        var nodes, node, matches, i;
    
        // match email address in mailto link
        // from http://stackoverflow.com/a/201447/145899
        var mailto_re = /^mailto:(\S+@\S+\.\S+)/;
    
        // look for meta[name=citation_author_email][content]
        // test on http://dx.doi.org/10.1007/978-3-642-02879-3_7
        nodes = document.getElementsByTagName("meta");
        for (i = 0; i < nodes.length; i++) {
          node = nodes[i];
    
          if (node.getAttribute("name") == "citation_author_email") {
            return node.getAttribute("content");
          }
        }
    
        // look for links that start with "mailto:".
        // can't guarantee this is the author - might be an editor or support email.
        // test on http://dx.doi.org/10.1371/journal.pone.0052814
        nodes = document.getElementsByTagName("a");
        for (i = 0; i < nodes.length; i++) {
          node = nodes[i];
    
          if (matches = mailto_re.exec(node.getAttribute("href"))) {
            return matches[1].replace(/\?.*/, ""); // remove any query string
          }
        }
    
        return '';
    };

    
    var detectDOI = function() {
        var nodes, node, childNode, matches, i, j;
    
        // match DOI: test on http://t.co/eIJciunBRJ
        var doi_re = /\b10\.\d{4,}(?:\.\d+)*\/\S+\b/;
    
        // look for meta[name=citation_doi][content]
        nodes = document.getElementsByTagName("meta");
        for (i = 0; i < nodes.length; i++) {
          node = nodes[i];
    
          if (node.getAttribute("name") == "citation_doi") {
            return node.getAttribute("content").replace(/^doi:/, "");
          }
        }
    
        // look in all text nodes for a DOI
        nodes = document.getElementsByTagName("*");
        for (i = 0; i < nodes.length; i++) {
          node = nodes[i];
    
          if (!node.hasChildNodes()) {
            continue;
          }
    
          if (node.nodeName == "SCRIPT") {
            continue;
          }
    
          for (j = 0; j < node.childNodes.length; j++) {
            childNode = node.childNodes[j];
    
            // only text nodes
            if (childNode.nodeType !== 3) {
              continue;
            }
    
            if (matches = doi_re.exec(childNode.nodeValue)) {
              return matches[0];
            }
          }
        }
    
        return '';
    };

    
    var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
      };
    })();


    var founddoi = detectDOI();
    
    var obd = '<div id="oabookmarkletcontainer">' +
        '<h2 id="oabookmarkletheader">Open Access Button</h2>' +
        '<div id="oabookmarklet">' +
        '<textarea class="form-control" id="oabookmarkletstory" placeholder="' +
        'Tell your story - why were you blocked? What were you trying to do at the time?" style="height:200px;width:265px;"></textarea>' +
        '<input type="checkbox" id="oabookmarkletwishlist"> add this to your wishlist' +
        '<a class="btn btn-block btn-action" href="#" id="oabookmarkletblock" style="font-size:1.1em;width:275px;"">share your open access story</a>';
    if ( founddoi ) {
        obd += '<p><a target="_blank" href="http://scholar.google.com/scholar?q=' + encodeURIComponent(founddoi) + '">Search on Google Scholar</a></p>';
    }
    obd += '</div>';
    obd += '<div id="oabookmarkletstatus"></div>' +
        '<div id="oabookmarkletbottom"><p><a href="javascript:(function(){$(\'#oabookmarkletcontainer\').remove();})();" class="btn btn-action">close</a></p>' +
    '</div></div>';
    $('body').append(obd);

    // TODO: the bookmarklet needs to know which user API KEY should actually be used
    // the last bookmarklet appeared to write this directly into the code of the bookmarklet 
    // code that the user downloaded, so perhaps we just do the same too, so when the user 
    // saves the bookmarklet from the site their API KEY is written into a var that gets passed in here
    // I (MM) will look into this further
    oab = new oabutton({
        api: 'https://openaccessbutton.org/api',
        api_key: oabuid
    });

    /*oab.status({
        data: {url: window.location.href},
        success: function(data) {
            // TODO: if the status query returns useful info this should be displayed
            // neatly on the oabutton bookmarklet panel
            $('#oabookmarkletstatus').html('<pre></p>' + JSON.stringify(data,"","    ") + '</p></pre>');
        }
    });*/
    
    var oabookmarkletblock = function(event) {
        event.preventDefault();
        // TODO: if the tp type is blocked rather than wishlist the data object 
        // below that is posted to the backend should be populated with extra data
        // so where the process above that builds the bookmarklet panel scrapes author 
        // title etc from the page, or asks the user to provide it, the values in those 
        // fields at the time the block button is pressed triggering this call
        var rid = guid();
        oab['blocked']({
            data: {
                url: window.location.href,
                story: $('#oabookmarkletstory').val(),
                doi: founddoi,
                authoremails: detectAuthorEmail(),
                id: rid
            }
        });
        $('#oabookmarkletlinks').remove();
        $('#oabookmarklet').append('<div id="oabookmarkletlinks"><p><br>Your story has been registered. View it to find more useful information.<br> \
        <a target="_blank" class="btn btn-action btn-block" href="https://openaccessbutton.org/story/' + rid + '">View your story</a></p></div>');
        if ( $('#oabookmarkletwishlist').is(':checked') ) {
            oab['wishlist']({
                data: {
                    url: window.location.href
                }
            });
            $('#oabookmarkletlinks').append("<p>This item has been added to your wishlist. We'll let you know as soon as a copy is available.");
            $('#oabookmarkletlinks').append('<a target="_blank" class="btn btn-action btn-block" href="https://openaccessbutton.org/account/' + oabuid + '">View your wishlist</a></p>');
        }
    }
    $('#oabookmarkletblock').bind('click',oabookmarkletblock);

});

});