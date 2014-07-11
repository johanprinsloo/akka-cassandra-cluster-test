(function() {


    // Storing common selections
    var allEndpoints = $('li.endpoint'),
        allEndpointsLength = allEndpoints.length,
        allMethodLists = $('ul.methods'),
        allMethodListsLength = allMethodLists.length;


    function listMethods(context) {
        var methodsList = $('ul.methods', context || null);

        for (var i = 0, len = methodsList.length; i < len; i++) {
            $(methodsList[i]).slideDown();
        }
    }

    // Toggle show/hide of method details, form, and results
    $('li.method > div.title').click(function() {
        $('form', this.parentNode).slideToggle();
    })

    $('li.method > a > div.title').click(function() {
         window.location.hash = $(this.parentElement).attr("name")
        $('form', this.parentNode.parentNode).slideToggle();
    })
    
    // Toggle an endpoint
    $('li.endpoint > h3.title span.name').click(function() {
        $('ul.methods', this.parentNode.parentNode).slideToggle();
        $(this.parentNode.parentNode).toggleClass('expanded')
    })

    // Toggle all endpoints
    $('#toggle-endpoints').click(function(event) {
        event.preventDefault();

        // Check for collapsed endpoints (hidden methods)
        var endpoints = $('ul.methods:not(:visible)'),
            endpointsLength = endpoints.length;

        if (endpointsLength > 0) {
            // Some endpoints are collapsed, expand them.
            for (var x = 0; x < endpointsLength; x++) {
                var methodsList = $(endpoints[x]);
                methodsList.slideDown();
                methodsList.parent().toggleClass('expanded', true)

            }
        } else {
            // All endpoints are expanded, collapse them
            var endpoints = $('ul.methods'),
                endpointsLength = endpoints.length;

            for (var x = 0; x < endpointsLength; x++) {
                var methodsList = $(endpoints[x]);
                methodsList.slideUp();
                methodsList.parent().toggleClass('expanded', false)
            }
        }

    })

    // Toggle all methods
    $('#toggle-methods').click(function(event) {
        event.preventDefault();

        var methodForms = $('ul.methods form:not(:visible)'), // Any hidden method forms
            methodFormsLength = methodForms.length;

        // Check if any method is not visible. If so, expand all methods.
        if (methodFormsLength > 0) {
            var methodLists = $('ul.methods:not(:visible)'), // Any hidden methods
            methodListsLength = methodLists.length;

            // First make sure all the hidden endpoints are expanded.
            for (var x = 0; x < methodListsLength; x++) {
                $(methodLists[x]).slideDown();
            }

            // Now make sure all the hidden methods are expanded.
            for (var y = 0; y < methodFormsLength; y++) {
                $(methodForms[y]).slideDown();
            }

        } else {
            // Hide all visible method forms
            var visibleMethodForms = $('ul.methods form:visible'),
                visibleMethodFormsLength = visibleMethodForms.length;

            for (var i = 0; i < visibleMethodFormsLength; i++) {
                $(visibleMethodForms[i]).slideUp();
            }
        }

        for (var z = 0; z < allEndpointsLength; z++) {
            $(allEndpoints[z]).toggleClass('expanded', true);
        }
    })

    // List methods for a particular endpoint.
    // Hide all forms if visible
    $('li.list-methods a').click(function(event) {
        event.preventDefault();

        // Make sure endpoint is expanded
        var endpoint = $(this).closest('li.endpoint'),
            methods = $('li.method form', endpoint);

        listMethods(endpoint);

        // Make sure all method forms are collapsed
        var visibleMethods = $.grep(methods, function(method) {
            return $(method).is(':visible')
        })

        $(visibleMethods).each(function(i, method) {
            $(method).slideUp();
        })

        $(endpoint).toggleClass('expanded', true);

    })

    // Expand methods for a particular endpoint.
    // Show all forms and list all methods
    $('li.expand-methods a').click(function(event) {
        event.preventDefault();

        // Make sure endpoint is expanded
        var endpoint = $(this).closest('li.endpoint'),
            methods = $('li.method form', endpoint);

        listMethods(endpoint);

        // Make sure all method forms are expanded
        var hiddenMethods = $.grep(methods, function(method) {
            return $(method).not(':visible')
        })

        $(hiddenMethods).each(function(i, method) {
            $(method).slideDown();
        })

        $(endpoint).toggleClass('expanded', true);

    });

    // Toggle headers section
    $('div.headers h4').click(function(event) {
        event.preventDefault();

        $(this.parentNode).toggleClass('expanded');

        $('div.fields', this.parentNode).slideToggle();
    });

    /*
        Try it! button. Submits the method params, apikey and secret if any, and apiName
    */
    
    $('li.method form').submit(function(event) {
        var self = this;

        event.preventDefault();

        var params,apiKey,apiSecret,apiName,methodURL,httpMethod;

        //pre-process the form parameters
        //API key form
        params = $(this).serializeArray();
        apiKey = { name: 'apiKey', value: $('input[name=key]').val() };
        apiSecret = { name: 'apiSecret', value: $('input[name=secret]').val() };
        apiName = { name: 'apiName', value: $('input[name=apiName]').val() };

        //API form
        var m_params = {};  // all form parameters
        var u_params = {};  // API parameters - either URI or API+?
        var p_params = {};  // put doc parameters
        var s_parameter     //single value
        var r_doc

        for (var i = 0; i < params.length; ++i)
            if (params[i] !== undefined) {
                m_params[ params[i].name ] = params[i].value;
                if (~params[i].name.indexOf('params[')) {
                    var newname = params[i].name
                    newname = newname.replace('params[', '')
                    newname = newname.replace(']', '')
                    u_params[newname] = params[i].value;
                }
                else if(~params[i].name.indexOf('putdoc[')) {
                    p_params[ params[i].name.replace('putdoc[','').replace(']','') ] = params[i].value
                }
                else if(~params[i].name.indexOf('putval[')) {
                    s_parameter =  "\"" + params[i].value + "\""
                }
                else if(~params[i].name.indexOf('rawjson[')) {
                    r_doc =  params[i].value
                }
            }

        methodURL = m_params.methodUri;
        httpMethod = m_params.httpMethod.toUpperCase();
        var outCall = (httpMethod=='PUT' || httpMethod=='POST');

        // Setup results container
        var resultUI = $('.result', self);
        if (resultUI.length === 0) {
            resultUI = $(document.createElement('div')).attr('class', 'result');
            resultUI.insertAfter($('.liveformpoint', self))
        }

        var uiinit = false

        if ($('pre.response', resultUI).length === 0) {
            uiinit = true
            // Clear results link
            var clearLink = $(document.createElement('a'))
                .text('Clear results')
                .addClass('clear-results')
                .attr('href', '#')
                .click(function(e) {
                    e.preventDefault();

                    var thislink = this;
                    $('.result', self)
                        .slideUp(function() {
                            $(this).remove();
                            $(thislink).remove();
                        });
                })
                .insertAfter($('input[type=submit]', self));

            // Call that was made, add pre elements
            resultUI.append($(document.createElement('h4')).text('Call'));
            resultUI.append($(document.createElement('pre')).addClass('call'));

            //optional DOC body
            if(outCall) {
              resultUI.append($(document.createElement('h4')).text(httpMethod + ' Document'));
              resultUI.append($(document.createElement('pre')).addClass('putdoc'));
            }

            // Header
            resultUI.append($(document.createElement('h4')).text('Response Headers'));
            resultUI.append($(document.createElement('pre')).addClass('headers'));

            // Response code
            resultUI.append($(document.createElement('h4')).text('Response Code'));
            resultUI.append($(document.createElement('pre')).addClass('code'));

            // Response
            resultUI.append($(document.createElement('h4'))
                .text('Response Body')
                .append($(document.createElement('a'))
                .text('Select body')
                .addClass('select-all')
                .attr('href', '#')
                .click(function(e) {
                    e.preventDefault();
                    selectElementText($(this.parentNode).siblings('.response')[0]);
                })
            )
            );

            resultUI.append($(document.createElement('pre'))
                .addClass('response prettyprint'));
        }

        // Replace placeholders in the methodURL with matching params
        for (var param in u_params) {
            if (u_params.hasOwnProperty(param)) {
                if (u_params[param] !== '') {
                    // URL params are prepended with ":"
                    var regx = new RegExp(':' + param);

                    // If the param is actually a part of the URL, put it in the URL and remove the param
                    if (!!regx.test(methodURL)) {
                        methodURL = methodURL.replace(regx, u_params[param]);
                        delete u_params[param]
                    }
                } else {
                    var regy = new RegExp( '(:' + param + ')' );   //var regy = new RegExp( param + '=:' + param );
                    if (!!regy.test(methodURL)) {
                      methodURL = methodURL.replace(regy, '');  // remove the parameter from the URL
                    }
                    delete u_params[param]; // Delete blank params
                }
            }
        }

      //clean up the url after mangling
      methodURL = methodURL.replace(/&+/, "&");  //repeated amps
      methodURL = methodURL.replace('?&', '?');
      methodURL = methodURL.replace(/&+$/, "");  //trailing amps
      methodURL = methodURL.replace(/\?+$/, "");  //trailing question
      methodURL = methodURL.replace(/([^:])(\/\/+)/g, '$1/')  //double slashes


        var paramString,invocationUrl;

        paramString = JSON.stringify(u_params);

        invocationUrl =  methodURL;
        if(paramString.length > 0) invocationUrl = invocationUrl + '?' + paramString;

        var url = methodURL;

        var representationOfDesiredState = ''
        if(r_doc){
          representationOfDesiredState = r_doc
        } else {
          var pdoc0 = JSON.stringify(p_params)
          var pdoc1 = pdoc0.replace(/\"{/g,'{')
          var pdoc2 = pdoc1.replace(/}\"/g,'}')
          representationOfDesiredState = pdoc2;
        }

        if(s_parameter) representationOfDesiredState = s_parameter; //single value put

        var client = new XMLHttpRequest();
        client.open(httpMethod, url, false, apiKey.value, apiSecret.value);  //false == synchronous
        client.setRequestHeader('Accept', '');
        client.setRequestHeader("Accept", "application/json");
        client.send(representationOfDesiredState);

        var responseheaders = client.getAllResponseHeaders()
        var respcontent = client.getResponseHeader('Content-Type') || 'application/json'
        var locheader = client.getResponseHeader('Location')
        var md5header = client.getResponseHeader('Content-MD5')

        var responseContentType = respcontent //"application/json; charset=utf-8"; // result.headers['content-type'];
        // Format output according to content-type
        var response = formatData(client.responseText, responseContentType)
        var rheaders = formatData(responseheaders, 'text/html')

        $('pre.response', resultUI)
            .toggleClass('error', false)
            .text(response);

        if(outCall) {
            var putdoc = formatData( representationOfDesiredState,'application/json')
            $('pre.putdoc', resultUI)
                .text(representationOfDesiredState);
        }

        $('pre.call', resultUI)
            .text(methodURL);

        $('pre.code', resultUI)
            .text(client.status + ' : ' + client.statusText)

        if (responseheaders) {
            $('pre.headers', resultUI)
                .text(rheaders);
        }

        if(locheader) {
          //REST headers
          if(uiinit) {
              resultUI.append($(document.createElement('h4')).text('Important Response Headers'));
              resultUI.append($(document.createElement('pre')).addClass('restheaders'));
          }

          if(locheader) {
            var headerstr = "Location: " + locheader
            if(md5header) headerstr = headerstr + "\n" + "Content-MD5: " + md5header
                           
            $('pre.restheaders', resultUI)
                .text(headerstr);}

        } else {
          $('pre.restheaders', resultUI)
        }


        prettyPrint();

    })

    var anchorName = document.location.hash.substring(1)
    $('a[name="' + anchorName + '"]').each( function(){
        console.log("hit " + anchorName + " in " + $(this.parentElement).attr("name"))
        $('form', this.parentNode).slideDown('slow')
    });

    $(window).bind('hashchange', function () { //detect hash change
        var hash = window.location.hash.substring(1);

        $('a[name="' + hash + '"]').each( function(){
            $('form', this.parentNode).slideDown()
        });
    });

})();

var formatData = function(data, contentType) {
    if (!contentType || typeof contentType != 'string') {
        return data;
    }

    switch (true) {
        case /application\/javascript/.test(contentType):
        case /application\/json/.test(contentType):
            // If result is JSON in string format, objectify it so we can format it.
            if (typeof data == 'string') {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    //console.log('Response said it was JSON, but it\'s not. :(');
                }
            }

            data = JSON.stringify(data, null, '    ');

            break;
        case /application\/xml/.test(contentType):
        case /text\/xml/.test(contentType):
        case /html/.test(contentType):
            data = formatXML(data);

            break;
    }

    return data;
}

function spaces(len) {
    var s = '',
    indent = len * 4;

    for (var i = 0; i < indent;i++) {
        s += " ";
    }

    return s;
}

function formatXML(str) {
    var xml = '';

    // add newlines
    str = str.replace(/(>)(<)(\/*)/g,"$1\r$2$3");

    // add indents
    var pad = 0,
        indent,
        node;

    // split the string
    var strArr = str.split("\r");

    // check the various tag states
    for (var i = 0, len = strArr.length; i < len; i++) {
        indent = 0;
        node = strArr[i];

        if (node.match(/.+<\/\w[^>]*>$/)) { //open and closing in the same line
            indent = 0;
        } else if (node.match(/^<\/\w/) && pad > 0) { // closing tag
            pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) { //opening tag
            indent = 1;
        } else {
            indent = 0;
        }

        xml += spaces(pad) + node + "\r";
        pad += indent;
    }

    return xml;

}

// Cause the browser to "select" all the text in an element
function selectElementText(el, win) {
    el.focus();
    win = win || window;
    var doc = win.document, sel, range;
    if (win.getSelection && doc.createRange) {
        sel = win.getSelection();
        range = doc.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}

// node Query String Utilities

function charCode(c) {
  return c.charCodeAt(0);
}


// a safe fast alternative to decodeURIComponent
unescapeBuffer = function(s, decodeSpaces) {
  var out = new Buffer(s.length);
  var state = 'CHAR'; // states: CHAR, HEX0, HEX1
  var n, m, hexchar;

  for (var inIndex = 0, outIndex = 0; inIndex <= s.length; inIndex++) {
    var c = s.charCodeAt(inIndex);
    switch (state) {
      case 'CHAR':
        switch (c) {
          case charCode('%'):
            n = 0;
            m = 0;
            state = 'HEX0';
            break;
          case charCode('+'):
            if (decodeSpaces) c = charCode(' ');
            // pass thru
          default:
            out[outIndex++] = c;
            break;
        }
        break;

      case 'HEX0':
        state = 'HEX1';
        hexchar = c;
        if (charCode('0') <= c && c <= charCode('9')) {
          n = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          n = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          n = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = c;
          state = 'CHAR';
          break;
        }
        break;

      case 'HEX1':
        state = 'CHAR';
        if (charCode('0') <= c && c <= charCode('9')) {
          m = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          m = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          m = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = hexchar;
          out[outIndex++] = c;
          break;
        }
        out[outIndex++] = 16 * n + m;
        break;
    }
  }
  return out.slice(0, outIndex - 1);
};

unescape = function(s, decodeSpaces) {
  return unescapeBuffer(s, decodeSpaces).toString();
};


escape = function(str) {
  return encodeURIComponent(str);
};
//
//var stringifyPrimitive = function(v) {
//  switch (typeof v) {
//    case 'string':
//      return v;
//
//    case 'boolean':
//      return v ? 'true' : 'false';
//
//    case 'number':
//      return isFinite(v) ? v : '';
//
//    default:
//      return '';
//  }
//};
//
//
//stringify = encode = function(obj, sep, eq, name) {
//  sep = sep || '&';
//  eq = eq || '=';
//  obj = (obj === null) ? undefined : obj;
//
//  switch (typeof obj) {
//    case 'object':
//      return Object.keys(obj).map(function(k) {
//        if (Array.isArray(obj[k])) {
//          return obj[k].map(function(v) {
//            return escape(stringifyPrimitive(k)) +
//                   eq +
//                   escape(stringifyPrimitive(v));
//          }).join(sep);
//        } else {
//          return escape(stringifyPrimitive(k)) +
//                 eq +
//                 escape(stringifyPrimitive(obj[k]));
//        }
//      }).join(sep);
//
//    default:
//      if (!name) return '';
//      return escape(stringifyPrimitive(name)) + eq +
//             escape(stringifyPrimitive(obj));
//  }
//};

// Parse a key=val string.
parse = decode = function(qs, sep, eq) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  qs.split(sep).forEach(function(kvp) {
    var x = kvp.split(eq);
    var k = unescape(x[0], true);
    var v = unescape(x.slice(1).join(eq), true);

    if (!(k in obj)) {
      obj[k] = v;
    } else if (!Array.isArray(obj[k])) {
      obj[k] = [obj[k], v];
    } else {
      obj[k].push(v);
    }
  });

  return obj;
};

// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});


