<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
    <meta name="theme-color" content="#cccccc" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<title>Network Performance Kernel for Progressive Web Applications</title>
	<meta name="description" content="Network Performance Kernel for Progressive Web Applications" />
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="#cccccc">
	<meta name="apple-mobile-web-app-title" content="Network Performance Kernel">
	<meta name="msapplication-TileImage" content="">
	<meta name="msapplication-TileColor" content="#cccccc">
	<link href="" rel="apple-touch-icon">
    <link href="/manifest.json" rel="manifest" />
	<style>
	<!-- Critical rendering path - Above-the-fold & font defintions -->
	<!-- 
						

























	-->
	</style>
</head>
<body>

<h1>Content Body</h1>

<img src="/images/test_pattern.png"/>

<p>Last Kpbs: <span id="kbps_output"></span></p>
<p>TransferSize: <span id="resource_output"></span></p>

<!-- Noscript fallovers go here -->
<noscript>
<link href="" type="text/css" rel="stylesheet" />
</noscript>

<script>
'use strict';

/* NPK constructor */
var __npk = function(debug=false) {

	/* Global declairations */
	this.debug  = debug;

	// Threshold in kpbs for interactive to non interactive
	this.threshold = 20;

	// Do not modify
	this.nonint = -2;
	this.stdint = -1;

	this.bundles = [];
	this.modules = [];

	this.bundle = {};
	this.module = {};

	/* 
	 * Envornment Variables
	 */

	/* setResourceTimingBufferSize 
	 * For better overall production performance reducing this will save memory I suggest no less than 10
     * Note - This is causing problems once the buffer hits because the browser doesn't keep this tidy both in FF and Chrome
	 */
	this.setResourceTimingBufferSize = 100;

	/* Timers */
	this.startLoadTime = 0;
	this.domLoadTime   = 0
};

var __npk__ = new __npk(true);

/* The bundling and module defintions */

// Non interactive definition
__npk__.bundle =  {'threshold'       : __npk__.nonint,
				   'type'            : 'initial',        // DO WE NEED THIS? Initial means we'll download respecitivly of performance (default for noinit)
				   'async'           : false,            // Load objects non-sequential instead of deferred (disabled by default) (Not impelmented yet)
				   'max-media'       : false,            // Determine media max (optional) (Not impelmented yet)
				   'min-media'       : false,            // Determine media min (optional) (Not impelmented yet)
					// Loading our vendors (here the difference is that vendors are loaded first) (Not impelmented yet)
				   'vendor_js'       : ['vendor.js|style=blah|deferred=deferred',
								     	'vendor2.js'],
				   'vendor_css'      : ['vendor.css'],
					// Loading the app here vendors here
				   'scripts'         : ['app.js|style=blah|deferred=true',
									    'app2.js'],
				   'styles'          : ['style.css'],
					// initialisers that will run after all has loaded (optional)
				   'onload'   		 : function() { }, // event callback
				   'onscriptload'    : function() { },       // event callback
				   'onstyleload'     : function() { } };     // event callback
__npk__.bundles.push(__npk__.bundle);

// Interactive defintion
__npk__.bundle  = {'threshold'   : __npk__.stdint, // We can have more than one of these based on resolution and breakpoint
				   'type'        : 'inherit',
				   'breakpoint'  : false,
				   'min-width'   : false,
				   'max-width'   : false,
				   'vendor_js'   : ['vendor.js'],
				   'scripts'     : ['app.js'],
				   'vendor_css'  : ['vendor.css'],
				   'styles'      : ['app.css'] };
__npk__.bundles.push(__npk__.bundle);

// Custom defintion 1
__npk__.bundle  = {'threshold'   : 200, // Set at Kpbs I.E 2kpbs
				   'type'        : 'inherit',
				   'breakpoint'  : false,
				   'min-width'   : false,
				   'max-width'   : false,
				   'vendor_js'   : ['vendor.js'],
				   'scripts'     : ['app.js'],
				   'vendor_css'  : ['vendor.css'],
				   'styles'      : ['app.css'] };
__npk__.bundles.push(__npk__.bundle);

// Custom defintion 2
__npk__.bundle  = {'threshold'   : 500, // Hi def mode at 5kpbs
				   'type'        : 'initial',
				   'vendor_js'   : ['vendor.js'],
				   'scripts'     : ['app.js'],
				   'vendor_css'  : ['vendor.css'],
				   'styles'      : ['app.css'] };
__npk__.bundles.push(__npk__.bundle);

// Module defintion 1
__npk__.module = {'scripts'       : ['/build/sw_cache.js|deferred|type="text/javascript"', 
									 'module2.js'],
				  'onload'        : function() { 
								  		/* Serviceworker config or importer goes here */
										return true;
									} };
__npk__.modules.push(__npk__.module);

// Module defintion 2
__npk__.module = {'scripts'     : ['script.js', 'module2.js'],
				  'styles'      : ['steyle.css'],
				  'onload'      : function() { } };
__npk__.modules.push(__npk__.module);

/* End of bundling and module defintions */

if(__npk__.debug) {
	__npk__.startLoadTime = (new Date()).getTime();

	console.log('Debug: true');

	document.addEventListener('DOMContentLoaded', function() { 
		__npk__.domLoadTime = (new Date()).getTime(); 
		console.log('DOMContentLoaded: '+(__npk__.domLoadTime-__npk__.startLoadTime)+'ms'); 
	});
}

if(__npk__.setResourceTimingBufferSize && typeof performance.clearResourceTimings === 'function');
	performance.setResourceTimingBufferSize(__npk__.setResourceTimingBufferSize);

/* __npk_ping(); */
var __npk_ping = function() {
	// Every __ping_interval we will perform the ping (default 30secs)
	this.ping_interval = 10000;

	// The network performance of the last ping test (do not modify)
	this.ping_kbps = -1;

	// Ping configuration
	this.ping_url = window.location.protocol+'//'+window.location.hostname+'/ping';

	/* Only used for browsers that do not support transferSize (Safari). 
	 * Tip make sure it matches the size of the ping object further, 
	 * Further a drawback to this method is that there maybe a few octets 
	 * above or below that get sent during transmission that may cause minor inacuracy
	 */
	this.ping_payload_size = 1188; 

	this.ping_buffer      = [];
	this.ping_buffer_kpbs = [];

	this.ping_buffer_inc = 0;
	this.ping_buffer_max = 5;
};

/* __npk_ping.prototype.ping - NPK ping tool to determine network speed
 * We need to watch memory here as the network performance object will continue to increase even though we are redefining 
 * the Image object with the the range for 5 images, further to note, each ping is no more than 1-2kb respecitivly
 * Note: we need to test the backward compatability for ping.
 */
__npk_ping.prototype.ping = function() {
	if(__npk__.debug) {
		console.log('Ping?');
	}
    if(this.ping_buffer_inc>this.ping_buffer_max) {  
		this.ping_buffer_inc = 0; 
	}

	var rand = Math.random().toString(36).substr(2, 10).toLowerCase();

	this.ping_buffer[this.ping_buffer_inc]     = new Image();
    this.ping_buffer[this.ping_buffer_inc].src = this.ping_url+'?='+rand;

	if(typeof performance === 'undefined') {
		var fetchStart = (new Date()).getTime();
	}
	this.ping_buffer[this.ping_buffer_inc].onload = (function() { 
		if(__npk__.debug) {
			console.log('Pong!');
		}
		if(typeof performance === 'undefined') {
			var responseEnd = (new Date()).getTime();

			var transferTime = (responseEnd-fetchStart)/1000;
			var transferSize = this.ping_payload_size;
		} else {
			var entries    = performance.getEntriesByName(this.ping_url+'?='+rand);
			var last_entry = entries[entries.length-1];

			var transferTime = (last_entry.responseEnd-last_entry.fetchStart)/1000;

			if("transferSize" in last_entry) {
				var transferSize = last_entry.transferSize;
			} else {
				var transferSize = this.ping_payload_size;
			}
		}

		// To kpbs a further 1024 for mbps
		this.ping_buffer_kpbs[this.ping_buffer_inc] = ((transferSize*8)/transferTime)/1024;

		// Save to the NPK
        this.ping_kbps = this.ping_buffer_kpbs[this.ping_buffer_inc];

		if(__npk__.debug) {
			console.log(this.ping_kbps);
		}
	}).bind(this);

	this.ping_buffer_inc++;

    setTimeout((function() { this.ping(); }).bind(this), this.ping_interval);

    return true;
};

var __npk_ping__ = new __npk_ping();

/* __npk_ping__.ping(); */
__npk_ping__.ping(); 
/* __npk_ping__.ping(); */

/* npk loading routeens */
var __npk_loader = function() {
	this.body = document.body;

	this.bundle_scripts = [];
	this.bundle_styles  = [];

	this.module_scripts = [];
	this.module_styles  = [];
};

__npk_loader.prototype.load_script = function(file, argc, success, error) {
	var script = document.createElement('script');

	if(typeof argc !== 'undefined' && (typeof argc === 'string' || argc instanceof String)) {
		var argv = argc.split('|');
	}

	//script.src  = window.location.protocol+'//'+window.location.hostname+'/'+file;
	script.src  = file;
	script.type = 'text/javascript';
	
	if(typeof argv !== 'undefined' && argv.length>1) {
		for(var i=0; i<argv.length; i++) { 
			var values = argv[i].split('=');
			if(values.length>1) {
				script.setAttribute(values[0], values[1]);
			} else {
				script.setAttribute(values[0], '');
			}
		}
	}

	// Callbacks
	if(typeof success === 'function') {
 		script.onload             = success;
    	script.onreadystatechange = success;
	}
	if(typeof error === 'function') {
 		script.onerror            = error;
	}

	return script;
};

__npk_loader.prototype.load_style = function(file, argc, success, error) {
	var style = document.createElement('link');

	if(typeof argc !== 'undefined' && (typeof argc === 'string' || argc instanceof String)) {
		var argv = argc.split('|');
	}

	//style.href  = window.location.protocol+'//'+window.location.hostname+'/'+file;
	style.href  = file;
	style.type  = 'text/css';
	style.rel   = 'stylesheet';
	style.media = 'screen, print';

	if(typeof argv !== 'undefined' && argv.length>1) {
		for(var i=0; i<argv.length; i++) { 
			var values = argv[i].split('=');
			if(values.length>1) {
				style.setAttribute(values[0], values[1]);
			} else {
				style.setAttribute(values[0], '');
			}
		}
	}

	// Callbacks
	if(typeof success === 'function') {
 		style.onload             = success;
    	style.onreadystatechange = success;
	}
	if(typeof error === 'function') {
 		style.onerror            = error;
	}

	return style;
};

__npk_loader.prototype.createHierarchy = function(input, output_scripts, output_styles, ids) {
	for(var x=0; input.length>x; x++) {
		if(typeof input[x].scripts !== 'undefined') {
			for(var y=0; input[x].scripts.length>y; y++) {
				var string = input[x].scripts[y].split('|');
				var found = false;

				for(var z=0; output_scripts.length>z; z++) {
					if(output_scripts[z].file === string[0]) {
						output_scripts[z][ids].push(x);
						found = true;
					}
				}

				if(found === false) {
					var script = { [ids]: [] };
					// we need to set the default script behavior here
					script[ids].push(x);
					script.file           = string[0];
					script.attributes     = string.slice(1).join('|');
					script.loaded         = false;
					script.error          = false;
									
					output_scripts.push(script); 
				}
			}
		}

		if(typeof input[x].styles !== 'undefined') {
			for(var y=0; input[x].styles.length>y; y++) {
				var string = input[x].styles[y].split('|');
				var found = false;

				for(var z=0; output_styles.length>z; z++) {
					if(output_styles[z].file === string[0]) {
						output_styles[z][ids].push(x);
						found = true;
					}
				}

				if(found === false) {
					var style = { [ids]: [] };
					// we need to set the default style behavior here
					style[ids].push(x);
					style.file           = string[0];
					style.attributes     = string.slice(1).join('|');
					style.loaded         = false;
					style.error          = false;

					output_styles.push(style); 
				}
			}
		}
	}

	return true;
};


__npk_loader.prototype.createModuleHierarchy = function() {
	return this.createHierarchy(__npk__.modules, this.module_scripts, this.module_styles, 'moduleids');
};

__npk_loader.prototype.createBundleHierarchy = function() {
	var kbps = Number((__npk_ping__.ping_kbps).toFixed(2));

	var accepted_bundles = [];
	var unaccepted_bundles = [];

    /* Check Viewport and perhaps user agent (in the future)
     * We need to add two modes for bundles that dont make the acception 
     * A) automatically download after the onload
     * B) Alernativly ask the user 
     */

	for(var x=0; __npk__.bundles.length>x; x++) {
		var accepted = false;

		if(__npk__.bundles[x].threshold === __npk__.nonint) {
			accepted = true;
		} else if(__npk__.bundles[x].threshold === __npk__.stdint && __npk__.threshold <= kbps) {
			accepted = true;
		} else if(__npk__.bundles[x].threshold > 0 && __npk__.bundles[x].threshold <= kbps) {
			accepted = true;
		}

		if(accepted === true) {
			if(__npk__.debug) { 
				console.log('Accepted bundle');
				console.log(__npk__.bundles[x]); 
			}
			if(typeof __npk__.bundles[x].type === 'undefined' || __npk__.bundles[x].type === 'inherit') {
				accepted_bundles.push(__npk__.bundles[x]); 
			} else if(__npk__.bundles[x].type === 'initial') {
				// clear and start allover
 				while(accepted_bundles.length) { accepted_bundles.pop(); }
				accepted_bundles.push(__npk__.bundles[x]); 
			} 
		} else {
			if(__npk__.debug) { 
				console.log('Unaccepted bundle');
				console.log(__npk__.bundles[x]); 
			}
			unaccepted_bundles.push(__npk__.bundles[x]); 
		}	
	}


	return this.createHierarchy(accepted_bundles, this.bundle_scripts, this.bundle_styles, 'bundleids');
};

__npk_loader.prototype.checkObjectStatus = function(object, output_scripts, output_styles, ids) { 
	for(var x=0; object.length>x; x++) {
		var id = x;

		var scripts  = object[x].scripts;
		var styles   = object[x].styles;

		if(typeof scripts !== 'undefined' && typeof object[x].scripts_loaded === 'undefined') {
			for(var y=0; output_scripts.length>y; y++) { 
				var scripts_tally = 0;
				var scripts_tally_offset = 0;

				for(var z=0; output_scripts[y][ids].length>z; z++) {
					if(output_scripts[y][ids][z]===id) { 
						if(output_scripts[y].loaded === true) { 
							scripts_tally++;
						} 
						if(output_scripts[y].error === true) { 
							scripts_tally_offset++;
						} 
					}
				}


				// All scripts have loaded
				if((scripts.length-scripts_tally_offset)<=scripts_tally) { 
					object[x].scripts_loaded = true;

					if(typeof object[x].onscriptload !== 'undefined' && 
			   		   typeof object[x].onscriptload === 'function') {
						object[x].onscriptload();
					}
				}
			}
		}

		if(typeof styles !== 'undefined' && typeof object[x].styles_loaded === 'undefined') {
			for(var y=0; output_styles.length>y; y++) {
				var styles_tally  = 0;
				var styles_tally_offset = 0;

				for(var z=0; output_styles[y][ids].length>z; z++) {
					if(output_styles[y][ids][z]===id) { 
						if(output_styles[y].loaded === true) { 
							styles_tally++;
						} 
						if(output_styles[y].error === true) { 
							styles_tally_offset++;
						} 
					}
				}

				// All styles have loaded
				if((styles.length-styles_tally_offset)<=styles_tally) {
					object[x].styles_loaded = true;

					if(typeof object[x].onstyleload !== 'undefined' && 
			   		   typeof object[x].onstyleload === 'function') {
						object[x].onstyleload();
					}
				}
			}
		}

		// All scripts and styles have loaded 
		if(typeof object[x].loaded === 'undefined') {
			if((typeof scripts === 'undefined' || typeof object[x].scripts_loaded !== 'undefined') && 
			   (typeof styles  === 'undefined' || typeof object[x].styles_loaded  !== 'undefined')) {
				object[x].loaded = true;

				if(typeof object[x].onload !== 'undefined' && 
				   typeof object[x].onload === 'function') {
					object[x].onload();
				}
			}
		}
	}

	return true;
};

__npk_loader.prototype.checkModuleStatus = function() {
	return this.checkObjectStatus(__npk__.modules, this.module_scripts, this.module_styles, 'moduleids');
};

__npk_loader.prototype.checkBundleStatus = function() { 
	return this.checkObjectStatus(__npk__.bundles, this.bundle_scripts, this.bundle_styles, 'bundleids');
};

__npk_loader.prototype.loadModules = function() {
	var scripts  = document.createElement("div");
	var styles   = document.createElement("div");

	scripts.id = 'module_scripts';
	styles.id  = 'module_styles';

	var successs = function(t) { t.module_scripts[x].loaded=true; t.checkModuleStatus(); }
	var error = function(t) { t.module_scripts[x].error=true; };

	for(var x=0; this.module_scripts.length>x; x++) { 
		if(typeof this.module_scripts[x] !== 'undefined') {	
			var script = this.load_script(this.module_scripts[x].file, this.module_scripts[x].attributes, 
										  successs(this),
										  error(this));

			scripts.appendChild(script);
		}
	}

	for(var x=0; this.module_styles.length>x; x++) {
		if(typeof this.module_styles[x] !== 'undefined') {
			var style = this.load_style(this.module_styles[x].file, this.module_styles[x].attributes, 
										successs(this),
										error(this));

			styles.appendChild(style);
		}
	}

	document.body.appendChild(scripts);
	document.body.appendChild(styles);

	if(__npk__.debug) {
		console.log('Module loader output');
		console.log(scripts);
		console.log(styles);
	}
};

// Logic for the load process
__npk_loader.prototype.loadBundles = function() {
	var kbps = Number((__npk_ping__.ping_kbps).toFixed(2));
 
	var scripts  = document.createElement("div");
	var styles   = document.createElement("div");

	scripts.id = 'bundle_scripts';
	styles.id  = 'bundle_styles';

	var success = function(t) { t.bundle_scripts[x].loaded=true; t.checkBundleStatus(); }
	var error = function(t) { t.bundle_scripts[x].error=true; }

	for(var x=0; this.bundle_scripts.length>x; x++) { 
		if(typeof this.bundle_scripts[x] !== 'undefined') {	
			var script = this.load_script(this.bundle_scripts[x].file, this.bundle_scripts[x].attributes, 
										  success(this),
										  error(this));

			scripts.appendChild(script);
		}
	}

	for(var x=0; this.bundle_styles.length>x; x++) {
		if(typeof this.bundle_styles[x] !== 'undefined') {
			var style = this.load_style(this.bundle_styles[x].file, this.bundle_styles[x].attributes, 
										success(this),
										error(this));

			styles.appendChild(style);
		}
	}

	document.body.appendChild(scripts);
	document.body.appendChild(styles);

	if(__npk__.debug) {
		console.log('Bundle loader output');
		console.log(scripts);
		console.log(styles);
	}
};

var __npk_loader__ = new __npk_loader();

/*
 * __npk_init_modules 
 */
var __npk_init_modules = function() {
	if(__npk__.debug) {
		console.log('Running Modules ...');
	}

	/* __npk_loader__.createModuleHierarchy() */
	__npk_loader__.createModuleHierarchy();
	/* __npk_loader__.createModuleHierarchy() */

	/* __npk_loader__.loadModules() */
	__npk_loader__.loadModules();
	/* __npk_loader__.loadModules() */
	
    return true;
};

/*
 * __npk_init - NPK init
 */
var __npk_init = function(fallover=false) { 
	// Last kbps value
	var kbps = Number((__npk_ping__.ping_kbps).toFixed(2));

	if(__npk__.debug) {
		if(fallover === true) {
			console.log('Running Init ... [Fallover Mode!]');
		} else {
			console.log('Running Init ...');
		}

		console.log('Current Kpbs: '+kbps);
		console.log('Performance Output');
		console.log(performance);
		console.log(performance.getEntriesByType("resource"));
	}

	document.getElementById("kbps_output").innerHTML = kbps;
	document.getElementById("resource_output").innerHTML = __npk_ping__.ping_payload_size;

	/* __npk_init_modules(); */
	__npk_init_modules(); 
	/* __npk_init_modules(); */

	/* __npk_loader__.createBundleHierarchy()  */
	__npk_loader__.createBundleHierarchy();
	/*__npk_loader__.createBundleHierarchy() */

	/* __npk_loader__.loadBundles() */
	__npk_loader__.loadBundles(fallover);
	/* __npk_loader__.loadBundles() */

	return true;
}; 
/* __npk_init(); */

/* We create the fallover to anticipate the non interactive threshold vs the ping size to create the init
 * Fallover logic (not used in favor for the following line)
 * __npk_init_poll_clock>__npk_init_poll_fallover
 * __npk_init_poll_clock>=((__npk_ping__.ping_payload_size*8)/(__npk_init_poll_clock/1000))/1024
 */

// Run when the first ping result comes in, otherwise fallover
var __npk_init_poll_freq     = 50; // The rate at which will poll init

var __npk_init_poll_fallover = 2000;
var __npk_init_poll_clock    = 0; 

if(typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1){
var __npk_sleep = function(time) { return new Promise(resolve => { setTimeout(() => { resolve(); }, time); }); } // Sleep function
var __npk_init_poll = async function() { __npk_init_poll_clock += __npk_init_poll_freq; await __npk_sleep(__npk_init_poll_freq); if(__npk_ping__.ping_kbps>0) { __npk_init(); } else if(__npk_init_poll_clock>=((__npk_ping__.ping_payload_size*8)/(__npk_init_poll_clock/1000))/1024) { __npk_init(true); } else { __npk_init_poll(); } };
} else {
if(__npk__.debug) { console.log("Promises: false"); }
var __npk_init_poll = function() { setTimeout(function() { __npk_init_poll_clock += __npk_init_poll_freq; if(__npk__.ping_kbps>0) { __npk_init(); } else if(__npk_init_poll_clock>=((__npk_ping__.ping_payload_size*8)/(__npk_init_poll_clock/1000))/1024) { __npk_init(true); } else { __npk_init_poll(); } }, __npk_init_poll_freq); };
}
__npk_init_poll();

</script>

</body>
</html>
