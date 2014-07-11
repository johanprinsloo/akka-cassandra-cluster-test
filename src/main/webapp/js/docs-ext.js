(function() {

	var loopforStatus = false;
	
	$( "#startdatepicker" ).datepicker();
	$( "#enddatepicker" ).datepicker();
	
	$( "#startdatepicker" ).datepicker({ showButtonPanel: true });
	$( "#enddatepicker" ).datepicker("option", "selectOtherMonths", true );
	
    function toggleMyWindowVar1()
    {
    	 $('form', this.parentNode).slideToggle();
    }
    
    // Toggle show/hide of method details, form, and results
    $('li.outputelem > div.title').click(function() {
    	toggleMyWindowVar1();
    });

    function kickOffStatusCheckProcessing()
    {
    	found = false;
    	//find all rows where status == pending
    	$('ul.outputresponselist li.data').each(
    			function(idx, item)
		    	{
		    		if ($('span.status', item).text() != 'Complete')
		    		{
		    			found = true;
		    			
		    			// get its queryid
		    			var queryid = $('span.invisibleQueryid', item).text();
		    			// compose a urlString
		    			var url = 'api/billquery/' + queryid + '/status';
		    			var httpMethod = 'GET'
		    				
		    		    apiKey = { name: 'apiKey', value: $('input[name=key]').val() };
		    	        apiSecret = { name: 'apiSecret', value: $('input[name=secret]').val() };
		    	        apiName = { name: 'apiName', value: $('input[name=apiName]').val() };
		    	        
		    	        
		    	        var client = new XMLHttpRequest();
		    	        
		    	        client.open(httpMethod, url, false, apiKey.value, apiSecret.value);  //false == synchronous
		    	        
		    	        client.send(null);
		    	        
		    	        // make ajax call
		    	        var responseheaders = client.getAllResponseHeaders()
		    	        var respcontent = client.getResponseHeader('Content-Type') || 'text/plain'
		    	        var statusheader = client.getResponseHeader('Status')
		    	        var queryheader = client.getResponseHeader('Query')
		    	        
		    	        var statusString = "" + statusheader;

		    	        if (statusString.match(/Progress.*/)) {
		    	        	var progressVal = statusString.match(/Progress(.*)/)
		    	        	
		    	        	$('span.status', item).text(progressVal != null && progressVal.length > 1 ? progressVal[1] : statusString);
		    	        	$('span.status', item).removeClass('highlightPending')
		    	        	$('span.status', item).addClass('highlightProgress')
		    	        }
		    	        else if (statusString.match(/Complete/))
		    	        {
		    	        	 $('span.status', item).text(statusString);
		    	        	 $('span.status', item).removeClass('highlightPending')
		    	        	 $('span.status', item).removeClass('highlightProgress')
		    	        	 $('span.status', item).addClass('highlightComplete')
		    	        }
		    	        
		    		}
		    	}
    	);
    	
    	// cancel the timer .. no need to run it;
    	if (! found)
    	{
    		clearInterval(intervalId); 
    		intervalId = 0;
    	}
    }
    
    
    function toggleMyWindowVar2(elem)
    {
        window.location.hash = $(elem.parentElement).attr("name");
        var liElem = elem.parentNode.parentNode;
        var queryStatus = $('span.status', liElem).text();
        
        if (queryStatus == 'Complete')  // we can extend this for query in progress;
        								// if we can get access to logs to spew on the client
        {
            if (divResultElem.css('display') == 'block')
            {
            	divResultElem.slideToggle();
            	return;
            }
            
	        var resultPreTag = $('pre.result', divResultElem)
	        var resultText = resultPreTag.text();
	        if (resultText.length == 0) {
	        	
	            var queryid = $('span.invisibleQueryid', liElem).text();
	            
				var url = 'api/billquery/' + queryid+ '/result';
				var httpMethod = 'GET'
					
			    apiKey = { name: 'apiKey', value: $('input[name=key]').val() };
		        apiSecret = { name: 'apiSecret', value: $('input[name=secret]').val() };
		        apiName = { name: 'apiName', value: $('input[name=apiName]').val() };
		        
		        
		        var client = new XMLHttpRequest();
		        
		        client.open(httpMethod, url, false, apiKey.value, apiSecret.value);  //false == synchronous
		        
		        client.send(null);
		    
		        var responseContentType = client.getResponseHeader('Content-Type') || 'text/plain'
		        resultText = formatData(client.responseText, responseContentType)
	        
		        resultPreTag.text(resultText);
	        }
	        divResultElem.slideToggle();
        }
        else {
        	alert('Results are available for viewing after the query finishes execution')
        }
    }
    
    $('li.outputelem > a > div.title').click(function() {
    	event.preventDefault();
    	toggleMyWindowVar2(this);
    });
    
    
    $('li.inputform form').submit(function(event) {
    	event.preventDefault();
    	params = $(this).serializeArray();
    	
    	// 0) provide date control for two date fields
       //  3) on return from sync call, fill up new array  -- return call must give me submission time, queryid, query_status
       //  4) use the information returned to create a new data row
       
        //API form
        //API form
        var m_params = {};  // all form parameters
        var u_params = {};  // API parameters - either URI or API+?
        var p_params = {};  // put doc parameters

        for (var i = 0; i < params.length; ++i)
            if (params[i] !== undefined) {
                m_params[ params[i].name ] = params[i].value;
                if (~params[i].name.indexOf('params[')) {
                    var newname = params[i].name;
                    newname = newname.replace('params[', '');
                    newname = newname.replace(']', '');
                    u_params[newname] = params[i].value;
                }
                else if(~params[i].name.indexOf('putdoc[')) {
                    p_params[ params[i].name.replace('putdoc[','').replace(']','') ] = params[i].value;
                }
            }
        
        // 1) validate form inputs
        var validateStr = formValidateInputs(u_params);
        if (validateStr.length != 0)
        {
        	alert(validateStr);
        	return;
        }
        
        // 2) submit the form request to backend
        formRequestSubmit($(this));
        
    });
    
    function getConvertedDate(date, timezone)
    {
    	var utcSecsSince1970 = date.getTime() + date.getTimezoneOffset() * 60000;
		return new Date(utcSecsSince1970);
    }
    
    // add a row to result set for recently submitted successful query
    function addResultRow(params, response)
    {
    	liElem = $(document.createElement('li')).attr('class', 'outputelem put data');
    
    	var colheaders = ['date_submitted'
    	                  , 'entity'
    	                  , 'datamod'
    	                  , 'start'
    	                  , 'end'
    	                  , 'status'
    	                  , 'queryid'];
    	
    	aElem = "<a name=\"a3\"><div class=\"title\"> ";
    	
    	for (i=0; i < colheaders.length; i++)
    	{
    		if (colheaders[i] == 'date_submitted')
    		{
    			var utcDate = new Date();
    			var month = utcDate.getMonth() + 1;
    			if (month < 10){
    				month = "0" + month;
    			}
    			
    			var day = utcDate.getDate();
    			if (day < 10){
    				day = "0" + day;
    			}
    			
    			var year = utcDate.getFullYear();
    			val = (month + "/" + day + "/" + year);
    			
    			var hours = utcDate.getHours();
    			var minutes = utcDate.getMinutes();
    			if (minutes < 10){
    			minutes = "0" + minutes;
    			}
    			var seconds = utcDate.getSeconds();
    			if (seconds < 10){
    				seconds = "0" + seconds;
    			}
    			val += ' ' + hours + ":" + minutes + ":" + seconds + ' ';
    			
    			if(hours > 11){
    				val += "PM";
    			} else {
    				val += "AM";
    			}
    			aElem += '<span class="' + colheaders[i] + '">' + val + '</span>'; 
    		}
    		else if (colheaders[i] == 'status')
    		{
    			val = 'Pending';
    			aElem += '<span class="status queryStatus highlight' + val + '">' + val + '</span>';
    		}
    		else if (colheaders[i] == 'queryid')
    		{
    			val = response;
    			aElem += '<span class="invisibleQueryid">' + val + '</span>';
    		}
    		else {
    			name = colheaders[i];
    			val = eval('params.' + name);
    			aElem += '<span class="' + colheaders[i] + '">' + val + '</span>'; 
    		}
    	}
   
    	aElem += "</div></a>";
    	
    	aElem = $(aElem)
    			.click(function(e) {
                    e.preventDefault();
                    toggleMyWindowVar2($('.title', this)[0]);
                });
    
    	liElem.append(aElem);
    
    
    	divResultElem = $("<div class=\"hidden result\" style=\"display:none;\"><pre class=\"result\"></pre></div>");
    
    	liElem.append(divResultElem);
    
    	$('.outputresponselist li:first').after(liElem);

    	//var listOfItems = $('.outputresponselist div.title span.status:contains("Pending")');
    	//alert('length is ' + $(listOfItems).length);

    }
    
    // validate input form paarmeters
    function formValidateInputs(params)
    {
    	var returnStr = "";
    	
    	// are there any specific requirements for entity/meterid fields
    	
        for (var key in params) {
        	if (key == 'start') {
        		if (!isValidDate(params[key], 'start'))
        			returnStr += "Start Date must be specified\n";
        	}
        	else if (key == 'end') {
        		if (!isValidDate(params[key], 'end'))
        			returnStr += "End Date is required field in mm/dd/yyyy format\n";
        	}
        	else if (key == 'entity')
        	{
        		if (params[key].length == 0)
        		returnStr += "Entity value must be specified\n";
        	}
        	else if (key == 'datamod')
        	{
        		if (!isValidAdjustment(params[key]))
        			returnStr += "Mod must be described as [peak|usage][+|-]nn\n";
        	}
        }
        
        // check if end date is before start date
        var start_date = params['start'];
        var end_date  = params['end'];
        if (trim(end_date).length != 0)
        {
        	var startVal = Date.parse(start_date);
        	var endVal = Date.parse(end_date);
        	if (startVal > endVal)
        		returnStr += "End date can not be before Start date\n";
        }
        return returnStr;
    }
    
    // Removes leading whitespaces
    function LTrim( value ) {
    	
    	var re = /\s*((\S+\s*)*)/;
    	return value.replace(re, "$1");
    	
    }

    // Removes ending whitespaces
    function RTrim( value ) {
    	
    	var re = /((\s*\S+)*)\s*/;
    	return value.replace(re, "$1");
    	
    }

    // Removes leading and ending whitespaces
    function trim( value ) {
    	
    	return LTrim(RTrim(value));
    	
    }
     
    function isValidAdjustment(s)
    {
     	if ( (s.search(/^usage[\+|\-]\d{1,2}/g) != 0) && (s.search(/^peak[\+|\-]\d{1,2}/g) != 0))
   	     return false;
    	
    	return true;
    }
    
    function isValidDate(s, type)
    {  
    	// end date can be blank
    	 if (trim(s).length == 0 && type == 'end')
    		 return true;
    	 
    	  // make sure it is in the expected format
    	  if (s.search(/^\d{1,2}\/\d{1,2}\/\d{4}/g) != 0)
    	     return false;
    	 
    	  // remove other separators that are not valid with the Date class   
    	  s = s.replace(/[\-|\.|_]/g, "/");
    	 
    	  // convert it into a date instance
    	  var dt = new Date(Date.parse(s));    
    	 
    	  // check the components of the date
    	  // since Date instance automatically rolls over each component
    	  var arrDateParts = s.split("/");
    	     return (
    	         dt.getMonth() == arrDateParts[0]-1 &&
    	         dt.getDate() == arrDateParts[1] &&
    	         dt.getFullYear() == arrDateParts[2]
    	     );
    }

    
    function checkPendingStatus()
    {
    	// it may be better if we could retrieve multiple statuses for multiple queryids in one go..
    	// this function should  be called from success/tag of form submit ajax call -- if it is not already active
    	// global loopForStatus variable controls that
    	while (loopforStatus)
    	{
	    	var listOfItems = $('.outputresponselist div.title span.status:contains("Pending")');
	    	if ($(listOfItems).length == 0)
	    	{
	    		loopforStatus = false; 
	    		continue;
	    	}
	    	$(listOfItems).each(function(index){
	    		// send ajax request for status update using queryid field on the parentElement's child span.queryid which is hidden span
	    		// use the status returned by server to update the span.status field with correct class and text content specification.
	    		alert (index + $(this).text());
	    	});
    	}
    }
    
    // submit the form
    function formRequestSubmit (inputForm) {
        var self = this;

        var params,apiKey,apiSecret,apiName,methodURL,httpMethod;

        //pre-process the form parameters
        //API key form
        params = $(inputForm).serializeArray();
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
        
        // Replace placeholders in the methodURL with matching params
        var t_params = jQuery.extend({}, u_params);
        for (var param in u_params) {
            if (u_params.hasOwnProperty(param)) {
                if (u_params[param] !== '') {
                    // URL params are prepended with ":"
                    var regx = new RegExp(':' + param);

                    // If the param is actually a part of the URL, put it in the URL and remove the param
                    if (!!regx.test(methodURL)) {
                        methodURL = methodURL.replace(regx, u_params[param]);
                        delete u_params[param];
                    }
                } else {
                    delete u_params[param]; // Delete blank params
                }
            }
        }

        var url = methodURL;

//        var q_params = {};
//        for (var key in p_params) {
//        	q_params[key] = p_params[key];
//        }
//
//        q_params['start'] = Date.parse(q_params['start']);
//        q_params['end'] = Date.parse(q_params['end']);
//        q_params['entity'] = Number(q_params['entity']);
//
//
//        var queryStr ='';
//        for (var key in q_params) {
//        	queryStr += ((queryStr != '' ? '&' : '') + key + '=' + q_params[key] );
//        }
//
//        if(queryStr.length > 0) url = url + '?' + queryStr;
        
        var client = new XMLHttpRequest();
        client.open(httpMethod, url, false, apiKey.value, apiSecret.value);  //false == synchronous
//        client.onreadystatechange=function() {
//        	  if (client.readyState==4) {
//        	   alert('ho ho' + client.responseText)
//        	  }
//        }
        client.send(null);
        
        // make ajax call
        var responseheaders = client.getAllResponseHeaders()
        var respcontent = client.getResponseHeader('Content-Type') || 'text/plain'
        var locheader = client.getResponseHeader('Location')

        var queryid = '';
        var res = locheader.split('/')
        if (res != null && res.length > 1)
            queryid = res[3]
        
        if (client.status == 201 && queryid.length > 0) 
        {
        
        	//var responseContentType = respcontent //"application/json; charset=utf-8"; // result.headers['content-type'];
        
        	// Format output according to content-type -- for future use
        	// var response = formatData(client.responseText, responseContentType)
        	addResultRow(t_params, queryid);
        	
        	// 1) clear the form ??
        	
        	// 2) trigger looping of query rows .. if not already running .. where status is 'pending'
    		if (intervalId == 0) {
    			intervalId = setInterval(kickOffStatusCheckProcessing, 1000);
    		}
        }
        else {
        	// error returned by the client request
        	alert ('show error returned by the backend -- TODO');
        }
        
        //prettyPrint();
    }

})();

