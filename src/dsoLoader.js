"use strict";

var DSOConfig = function (debug = false) {
  /*
   * Global declarations
   */
  this.debug = debug;

  this.ping = true;
  this.stream = true;

  this.performanceEnabled = false;

  /*
   * Mode Callbacks
   */
  this.onNonInteractiveLoad = function () {}; // Callback
  this.onNonInteractiveLoaded = false; // Changes to true

  this.onInteractiveLoad = function () {}; // Callback
  this.onInteractiveLoadLoaded = false; // Changes to true

  this.onCustomThresholdLoad = function () {}; // Callback
  this.onCustomThresholdLoaded = false; // Changes to true

  /*
   * Threshold in kpbs for interactive to non interactive (15kbps is very slow :))
   */
  this.threshold = 15;

  /*
   * Mode Callbacks
   */
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
  this.domLoadTime = 0;
};

var dsoConfig = new DSOConfig(true);

/* The bundling and module defintions */

// A Non-interactive definition
dsoConfig.bundles = [
  {
    threshold: dsoConfig.nonint,
    label: "optional", // Not sure if its needed but we'll have it for now
    type: "initial", // Initial means we'll download respecitivly of performance (default for noinit)
    method: "promise|element|xhr", // Load method, allowing for different object types to be loaded
    maxMedia: false, // Determine media max (optional) (untested)
    minMedia: false, // Determine media min (optional) (untested)
    useragent: false, // Load based on useragent (optional) (untested)
    // Loading our vendors (here the difference is that vendors are loaded first)
    vendorJs: ['nonInteractiveVendor.js|deferred=deferred|type="text/javascript"'],
    vendorCss: ["nonInteractiveVendor.css"],
    // Loading the app
    scripts: ["nonInteractiveApp.js|deferred=deferred"],
    styles: ["nonInteractiveStyles.css"],
    // initialisers that will run after all has loaded (optional)
    onload: function () {
      // event callback after the whole bundle has loaded
      alert("Non Interactive Loaded");
    },
    onscriptload: function () {}, // event callback after scripts have loaded
    onstyleload: function () {}, // event callback after styles have loaded
  },
  {
    threshold: dsoConfig.stdint, // We can have more than one of these based on resolution and breakpoint
    type: "inherit",
    breakpoint: false,
    minWidth: false,
    maxWidth: false,
    vendorJs: ["interactiveVendor.js"],
    vendorCss: ["interactiveVendor.css"],
    scripts: ["interactiveApp.js"],
    styles: ["interactiveApp.css"],
    onload: function () {
      alert("Interactive Loaded");
    },
  },
  {
    threshold: 200, // Set at Kpbs I.E 200kpbs
    type: "inherit",
    breakpoint: false,
    minWidth: false,
    maxMwidth: false,
    vendorJs: ["customThresholdVendor.js"],
    vendorCss: ["customThresholdVendor.css"],
    scripts: ["customThresholdApp.js"],
    styles: ["customThresholdApp.css"],
    onload: function () {
      alert("Custom Threshold Loaded");
    },
  },
  {
    threshold: 500, // Hi def mode at 500kpbs
    type: "inherit",
    vendorJs: ["richCustomThresholdVendor.js"],
    vendorCss: ["richCustomThresholdVendor.css"],
    scripts: ["richCustomThresholdApp.js"],
    styles: ["richCustomThresholdApp.css"],
    onload: function () {
      alert("Rich Custom Threshold Loaded");
    },
  },
];

// Module defintions
dsoConfig.modules = [
  {
    scripts: ['/build/sw_cache.js|deferred="deferred"|type="text/javascript"'],
    onload: function () {
      /* Serviceworker config or importer goes here */
      return true;
    },
  },
  {
    scripts: ["lazyLoader.js"],
    styles: ["lazyStyle.css"],
    onload: function () {},
  },
];
/* End of bundling and module defintions */

if (dsoConfig.debug) {
  dsoConfig.startLoadTime = new Date().getTime();

  console.log("Debug: true");

  document.addEventListener("DOMContentLoaded", function () {
    dsoConfig.domLoadTime = new Date().getTime();
    console.log(
      "DOMContentLoaded: " +
        (dsoConfig.domLoadTime - dsoConfig.startLoadTime) +
        "ms"
    );
  });
}

if (
  typeof dsoConfig.setResourceTimingBufferSize !== undefined &&
  typeof performance.setResourceTimingBufferSize === "function"
);
performance.setResourceTimingBufferSize(dsoConfig.setResourceTimingBufferSize);

/* DSOPing(); */
var DSOPing = function () {
  // Every pingInterval we will perform the ping (default 30secs)
  this.pingInterval = false;

  // The network performance of the last ping test (do not modify)
  this.pingKbps = -1;

  // Ping configuration
  this.ping_url =
    "https://raw.githubusercontent.com/jamesbiv/device-streaming-object-loader/master/src/ping.png";

  /* Only used for browsers that do not support transferSize (Safari).
   * Tip make sure it matches the size of the ping object further,
   * Further a drawback to this method is that there maybe a few octets
   * above or below that get sent during transmission that may cause minor inacuracy
   */
  this.pingPayloadSize = 3008;

  this.pingBuffer = [];
  this.pingBufferKpbs = [];

  this.pingBufferInc = 0;
  this.pingBufferMax = 5;
};

/* DSOPing.prototype.ping - DSO Ping tool to determine network speed
 * We need to watch memory here as the network performance object will continue to increase even though we are redefining
 * the Image object with the the range for 5 images, further to note, each ping is no more than 1-2kb respecitivly
 * Note: we need to test the backward compatability for ping.
 * Note II: Create API reference for ping to be used
 */
DSOPing.prototype.ping = function (callback) {
  if (dsoConfig.debug) {
    console.log("Ping?");
  }

  if (this.pingBufferInc > this.pingBufferMax) {
    this.pingBufferInc = 0;
  }

  var rand = Math.random().toString(36).substr(2, 10).toLowerCase();

  this.pingBuffer[this.pingBufferInc] = new Image();
  this.pingBuffer[this.pingBufferInc].src = this.ping_url + "?=" + rand;

  if (!this.performanceEnabled || typeof performance !== "undefined") {
    var fetchStart = new Date().getTime();
  }

  this.pingBuffer[this.pingBufferInc].onload = function () {
    if (dsoConfig.debug) {
      console.log("Pong!");
    }

    if (!this.performanceEnabled || typeof performance !== "undefined") {
      var responseEnd = new Date().getTime();

      var transferTime = (responseEnd - fetchStart) / 1000;
      var transferSize = this.pingPayloadSize;
    } else {
      var entries = performance.getEntriesByName(this.ping_url + "?=" + rand);
      var lastEntry = entries[entries.length - 1];

      var transferTime = (lastEntry.responseEnd - lastEntry.fetchStart) / 1000;

      if ("transferSize" in lastEntry) {
        var transferSize = lastEntry.transferSize;
      } else {
        var transferSize = this.pingPayloadSize;
      }
    }

    // To kpbs a further 1024 for mbps
    this.pingBufferKpbs[this.pingBufferInc] =
      (transferSize * 8) / transferTime / 1024;

    // Save to the DSO
    this.pingKbps = this.pingBufferKpbs[this.pingBufferInc];

    if (dsoConfig.debug) {
      console.log(this.pingKbps);
    }

    if (typeof callback !== "undefined" && typeof callback === "function") {
      callback();
    }
  }.bind(this);

  this.pingBufferInc++;

  if (this.pingInterval) {
    setTimeout(
      function () {
        this.ping();
      }.bind(this),
      this.pingInterval
    );
  }

  return true;
};

if (dsoConfig.ping) {
  var dsoPing = new DSOPing();
  dsoPing.ping();
}

/* DSO loading routeens */
var DSOLoader = function () {
  this.body = document.body;

  this.bundleScripts = [];
  this.bundleStyles = [];

  this.moduleScripts = [];
  this.moduleStyles = [];

  this.acceptedBundles = [];
  this.unacceptedBundles = [];

  this.viewportWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;

  this.viewportHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;

  this.useragent = navigator.userAgent;

  this.liTally = 0;

  this.archivedScripts = [];
  this.archivedStyles = [];

  /* element type definitions */
  this.elements = {
    script: {
      tag: "script",
      link: "src",
      attributes: { type: "text/javascript" },
    },
    style: {
      tag: "link",
      link: "href",
      attributes: {
        type: "text/css",
        rel: "stylesheet",
        media: "screen, print",
      },
    },
  };
};

DSOLoader.prototype.loadObjectByElement = function (
  type,
  file,
  argc,
  id,
  success,
  error
) {
  if (typeof this.elements[type] === "undefined" || file === "undefined") {
    return null;
  }

  var attributes = this.elements[type].attributes;
  var element = document.createElement(this.elements[type].tag);
  var link = this.elements[type].link;

  element.setAttribute(link, file);

  if (typeof id === "string" || id instanceof String) {
    //element.setAttribute('id', id);
  }

  Object.keys(attributes).forEach(function (key) {
    element.setAttribute(key, attributes[key]);
  });

  if (
    typeof argc !== "undefined" &&
    (typeof argc === "string" || argc instanceof String)
  ) {
    var argv = argc.split("|");
  }

  if (typeof argv !== "undefined" && argv.length > 1) {
    for (var i = 0; i < argv.length; i++) {
      var values = argv[i].split("=");

      if (values.length > 1) {
        element.setAttribute(values[0], values[1]);
      } else {
        element.setAttribute(values[0], "");
      }
    }
  }

  return element;
};

DSOLoader.prototype.createLoadObjects = function (
  input,
  outputScripts,
  outputStyles,
  ids
) {
  // Record only the filename
  for (var x = 0; outputScripts.length > x; x++) {
    this.archivedScripts.push(outputScripts[x].file);
  }
  for (var x = 0; outputStyles.length > x; x++) {
    this.archivedStyles.push(outputStyles[x].file);
  }

  // Flush both arrays before using
  while (outputScripts.length) {
    outputScripts.pop();
  }
  while (outputStyles.length) {
    outputStyles.pop();
  }

  for (var x = 0; input.length > x; x++) {
    if (
      typeof input[x].scripts !== "undefined" &&
      typeof input[x].accepted !== "undefined" &&
      input[x].accepted === true
    ) {
      for (var y = 0; input[x].scripts.length > y; y++) {
        var string = input[x].scripts[y].split("|");
        var found = false;

        for (var z = 0; outputScripts.length > z; z++) {
          if (outputScripts[z].file === string[0]) {
            outputScripts[z][ids].push(x);
            found = true;
          }
        }

        if (this.archivedScripts.length > 0) {
          for (var z = 0; this.archivedScripts.length > z; z++) {
            if (
              this.archivedScripts[z].toLowerCase() == string[0].toLowerCase()
            ) {
              found = true;
            }
          }
        }

        if (found === false) {
          var script = { [ids]: [] };
          // we need to set the default script behavior here
          script[ids].push(x);
          script.file = string[0];
          script.attributes = string.slice(1).join("|");
          script.loaded = false;
          script.error = false;

          outputScripts.push(script);
        }
      }
    }

    if (
      typeof input[x].styles !== "undefined" &&
      typeof input[x].accepted !== "undefined"
    ) {
      for (var y = 0; input[x].styles.length > y; y++) {
        var string = input[x].styles[y].split("|");
        var found = false;

        for (var z = 0; outputStyles.length > z; z++) {
          if (outputStyles[z].file === string[0]) {
            outputStyles[z][ids].push(x);
            found = true;
          }
        }

        if (this.archivedStyles.length > 0) {
          for (var z = 0; this.archivedStyles.length > z; z++) {
            if (
              this.archivedStyles[z].toLowerCase() == string[0].toLowerCase()
            ) {
              found = true;
            }
          }
        }

        if (found === false) {
          var style = { [ids]: [] };
          // we need to set the default style behavior here
          style[ids].push(x);
          style.file = string[0];
          style.attributes = string.slice(1).join("|");
          style.loaded = false;
          style.error = false;

          outputStyles.push(style);
        }
      }

      // Maybe we delete this one later
      delete input[x].accepted;
    }
  }

  return true;
};

DSOLoader.prototype.createModuleLoadObjects = function () {
  return this.createLoadObjects(
    dsoConfig.modules,
    this.moduleScripts,
    this.moduleStyles,
    "moduleids"
  );
};

/* Note: do not call this again until Loadbundle has finished */
DSOLoader.prototype.createBundleLoadObjects = function (
  fallover = false,
  stdint = false
) {
  // Clear variables before use
  for (var x = 0; dsoConfig.bundles.length > x; x++) {
    delete dsoConfig.bundles[x].accepted;
    delete dsoConfig.bundles[x].unaccepted;
  }

  if (typeof dsoPing !== "undefined") {
    var kbps = Number(dsoPing.pingKbps.toFixed(2));
  } else {
    var kbps = -1;
  }

  for (var x = 0; dsoConfig.bundles.length > x; x++) {
    if (typeof dsoConfig.bundles[x].loaded === "undefined") {
      var pass = true;
      var accepted = false;

      /* Filter out viewports that dont match (untested)
       * We should make it so just one of the following is set but for now we compare for the two togeather
       */
      if (
        dsoConfig.bundles[x].minMedia > 0 &&
        dsoConfig.bundles[x].maxMedia > 0
      ) {
        if (
          !(
            this.viewportWidth >= dsoConfig.bundles[x].minMedia &&
            this.viewportWidth <= dsoConfig.bundles[x].maxMedia
          ) ||
          !(
            this.viewportHeight >= dsoConfig.bundles[x].minMedia &&
            this.viewportHeight <= dsoConfig.bundles[x].maxMedia
          )
        ) {
          pass = false;
        }
      }

      /* Filter out useragents that dont match (untested)
       * This feature can be expanded using the globals found under navigator such as platform
       */
      if (typeof dsoConfig.bundles[x].useragent === "string") {
        if (dsoConfig.bundles[x].useragent.test(this.useragent) === false) {
          pass = false;
        }
      }

      if (pass) {
        /* Fallover mode will just load the non-interactive bundles */
        if (
          fallover === true &&
          dsoConfig.bundles[x].threshold === dsoConfig.nonint
        ) {
          accepted = true;
          /* Load only interactive modules */
        } else if (
          stdint === true &&
          dsoConfig.bundles[x].threshold === dsoConfig.stdint &&
          dsoConfig.threshold <= kbps
        ) {
          accepted = true;
          /* No ping mode will just load all libries in consecutive order but only as a low priority
           * TODO: We should set this so no ping and no stream loads everything and stream with no ping
           * loads non interactive andthen interactive later
           */
        } else if (typeof dsoPing === "undefined") {
          accepted = true;
          /* Otherwise load based on ping priority */
        } else {
          if (dsoConfig.bundles[x].threshold === dsoConfig.nonint) {
            accepted = true;
          } else if (
            dsoConfig.bundles[x].threshold === dsoConfig.stdint &&
            dsoConfig.threshold <= kbps
          ) {
            accepted = true;
          } else if (
            dsoConfig.bundles[x].threshold > 0 &&
            dsoConfig.bundles[x].threshold <= kbps
          ) {
            accepted = true;
          }
        }
      }

      if (accepted === true) {
        if (dsoConfig.debug) {
          console.log(dsoConfig.bundles[x]);
          console.log("Accepted bundle");
        }
        if (
          typeof dsoConfig.bundles[x].type !== "undefined" &&
          dsoConfig.bundles[x].type === "inherit"
        ) {
          dsoConfig.bundles[x].accepted = true;
        } else if (
          typeof dsoConfig.bundles[x].type !== "undefined" &&
          dsoConfig.bundles[x].type === "initial"
        ) {
          // clear and start allover
          for (var y = 0; dsoConfig.bundles.length > y; y++) {
            delete dsoConfig.bundles[y].accepted;
          }
          dsoConfig.bundles[x].accepted = true;
        }
      } else {
        if (dsoConfig.debug) {
          console.log(dsoConfig.bundles[x]);
          console.log("Unaccepted bundle");
        }
        dsoConfig.bundles[x].unaccepted = true;
      }
    }
  }

  /* If stream mode is set let's check the current set of bundles and load the next volly of bundles if needed
   * Note: this may become recursive in the future to account for custom thresholds after interactive but
   * for now we stop at just interactive mode defined under DSOLoader.prototype.loadInteractive() */
  if (dsoConfig.stream) {
    var interactive = true;
    var bundleLength = 0;

    for (var x = 0; dsoConfig.bundles.length > x; x++) {
      if (typeof dsoConfig.bundles[x].accepted !== "undefined") {
        bundleLength++;

        if (dsoConfig.bundles[x].threshold !== dsoConfig.nonint) {
          interactive = false;
        }
      }
    }

    if (interactive === true && bundleLength > 0) {
      for (var x = 0; dsoConfig.bundles.length > x; x++) {
        if (typeof dsoConfig.bundles[x].accepted !== "undefined") {
          dsoConfig.bundles[x]._onload = function () {
            dsoLoader.loadInteractive(bundleLength);
          };
        }
      }
    }
  }

  return this.createLoadObjects(
    dsoConfig.bundles,
    this.bundleScripts,
    this.bundleStyles,
    "bundleids"
  );
};

/* DSOLoader.prototype.loadInteractive - We need to create an API reference for this function.
 * Note: The counter allows for all bundles to be loaded, we should make it so we can
 * dedicate its own variable to each group but for now we'll just rely on dsoLoader.liTally
 */
DSOLoader.prototype.loadInteractive = function (count = false) {
  var execute = false;

  if (count) {
    dsoLoader.liTally++;
    if (dsoLoader.liTally === count) {
      dsoLoader.liTally = 0;
      execute = true;
    }
  } else {
    execute = true;
  }

  if (execute) {
    /* Note that simply reloading createBundleHierarchy which should filter out any of the already loaded bundles
     * What needs to happen here is something different, we need to set a mode that forces only interactive
     * to load leaving the upper thresholds */
    if (dsoLoader.createBundleLoadObjects(false, true)) {
      dsoLoader.loadBundles();
    }
  }
};

/**
 * DSOLoader.prototype.checkObjectStatus
 * Used to check the callback of an object being loader
 */
DSOLoader.prototype.checkObjectStatus = function (
  object,
  outputScripts,
  outputStyles,
  ids
) {
  var nonInteractive = false;
  var stdInteractive = false;
  var customThreshold = false;

  for (var x = 0; object.length > x; x++) {
    var id = x;

    var scripts = object[x].scripts;
    var styles = object[x].styles;

    if (
      typeof scripts !== "undefined" &&
      typeof object[x].scriptsLoaded === "undefined"
    ) {
      var scriptsTally = 0;
      var scriptsTallyOffset = 0;
      for (var y = 0; outputScripts.length > y; y++) {
        for (var z = 0; outputScripts[y][ids].length > z; z++) {
          if (outputScripts[y][ids][z] === id) {
            if (outputScripts[y].loaded === true) {
              scriptsTally++;
            }
            if (outputScripts[y].error === true) {
              scriptsTallyOffset++;
            }
          }
        }

        // All scripts have loaded
        if (scripts.length - scriptsTallyOffset <= scriptsTally) {
          object[x].scriptsLoaded = true;

          if (
            typeof object[x].onscriptload !== "undefined" &&
            typeof object[x].onscriptload === "function"
          ) {
            object[x].onscriptload();
          }
          if (
            typeof object[x]._onscriptload !== "undefined" &&
            typeof object[x]._onscriptload === "function"
          ) {
            object[x]._onscriptload();
          }
        }
      }
    }

    if (
      typeof styles !== "undefined" &&
      typeof object[x].stylesLoaded === "undefined"
    ) {
      var stylesTally = 0;
      var stylesTallyOffset = 0;

      for (var y = 0; outputStyles.length > y; y++) {
        for (var z = 0; outputStyles[y][ids].length > z; z++) {
          if (outputStyles[y][ids][z] === id) {
            if (outputStyles[y].loaded === true) {
              stylesTally++;
            }
            if (outputStyles[y].error === true) {
              stylesTallyOffset++;
            }
          }
        }

        // All styles have loaded
        if (styles.length - stylesTallyOffset <= stylesTally) {
          object[x].stylesLoaded = true;

          if (typeof object[x].onstyleload === "function") {
            object[x].onstyleload();
          }
          if (typeof object[x]._onstyleload === "function") {
            object[x]._onstyleload();
          }
        }
      }
    }

    // All scripts and styles have loaded
    if (typeof object[x].loaded === "undefined") {
      if (
        typeof object[x].scriptsLoaded !== "undefined" &&
        object[x].scriptsLoaded == true &&
        typeof object[x].stylesLoaded !== "undefined" &&
        object[x].stylesLoaded == true
      ) {
        object[x].loaded = true;

        if (typeof object[x].onload === "function") {
          object[x].onload();
        }
        if (typeof object[x]._onload === "function") {
          object[x]._onload();
        }
      }
    }

    switch (object[x].threshold) {
      case dsoConfig.nonint:
        if (
          typeof object[x].loaded !== "undefined" &&
          object[x].loaded == true
        ) {
          nonInteractive = true;
        } else {
          nonInteractive = false;
        }
        break;

      case dsoConfig.stdint:
        if (
          typeof object[x].loaded !== "undefined" &&
          object[x].loaded == true
        ) {
          stdInteractive = true;
        } else {
          stdInteractive = false;
        }
        break;

      default:
        if (
          typeof object[x].loaded !== "undefined" &&
          object[x].loaded == true
        ) {
          customThreshold = true;
        } else {
          customThreshold = false;
        }
        break;
    }
  }

  // Group Callbacks
  if (nonInteractive === true && dsoConfig.onNonInteractiveLoaded !== true) {
    if (typeof dsoConfig.onNonInteractiveLoad === "function") {
      dsoConfig.onNonInteractiveLoad();
    }
    dsoConfig.onNonInteractiveLoaded = true;
  }
  if (stdInteractive === true && dsoConfig.onInteractiveLoadLoaded !== true) {
    if (typeof dsoConfig.onNonInteractiveLoad === "function") {
      dsoConfig.onInteractiveLoad();
    }
    dsoConfig.onInteractiveLoadLoaded = true;
  }
  if (customThreshold === true && dsoConfig.onCustomThresholdLoaded !== true) {
    if (typeof dsoConfig.onCustomThresholdLoaded === "function") {
      dsoConfig.onCustomThresholdLoaded();
    }
    dsoConfig.onCustomThresholdLoaded = true;
  }

  return true;
};

DSOLoader.prototype.checkModuleStatus = function () {
  return this.checkObjectStatus(
    dsoConfig.modules,
    this.moduleScripts,
    this.moduleStyles,
    "moduleids"
  );
};

DSOLoader.prototype.checkBundleStatus = function () {
  return this.checkObjectStatus(
    dsoConfig.bundles,
    this.bundleScripts,
    this.bundleStyles,
    "bundleids"
  );
};

DSOLoader.prototype.loadModules = function () {
  var scripts = document.createElement("div");
  var styles = document.createElement("div");

  scripts.id = "moduleScripts";
  styles.id = "moduleStyles";

  for (var x = 0; this.moduleScripts.length > x; x++) {
    var moduleScript = this.moduleScripts[x];
    var script = this.loadObjectByElement(
      "script",
      moduleScript.file,
      moduleScript.attributes,
      ""
    );

    if (script) {
      script.onload = script.onreadystatechange = function () {
        moduleScript.load = true;
        dsoLoader.checkModuleStatus();
      };
      script.onerror = function () {
        moduleScript.error = true;
        dsoLoader.checkModuleStatus();
      };

      scripts.appendChild(script);
    }
  }

  for (var x = 0; this.moduleStyles.length > x; x++) {
    var moduleStyle = this.moduleStyles[x];
    var style = this.loadObjectByElement(
      "style",
      moduleStyle.file,
      moduleStyle.attributes,
      ""
    );

    if (style) {
      style.onload = style.onreadystatechange = function () {
        moduleStyle.loaded = true;
        dsoLoader.checkModuleStatus();
      };
      style.onerror = function () {
        moduleStyle.error = true;
        dsoLoader.checkModuleStatus();
      };

      styles.appendChild(style);
    }
  }

  document.body.appendChild(scripts);
  document.body.appendChild(styles);
};

// Logic for the load process
DSOLoader.prototype.loadBundles = function () {
  var scripts = document.createElement("div");
  var styles = document.createElement("div");

  scripts.id = "bundleScripts";
  styles.id = "bundleStyles";

  for (var x = 0; this.bundleScripts.length > x; x++) {
    var bundleScript = this.bundleScripts[x];
    var script = this.loadObjectByElement(
      "script",
      bundleScript.file,
      bundleScript.attributes,
      ""
    );

    if (script) {
      script.onload = script.onreadystatechange = function () {
        bundleScript.loaded = true;
        dsoLoader.checkBundleStatus();
      };

      script.onerror = function () {
        bundleScript.error = true;
        dsoLoader.checkBundleStatus();
      };

      scripts.appendChild(script);
    }
  }

  for (var x = 0; this.bundleStyles.length > x; x++) {
    var bundleStyle = this.bundleStyles[x];
    var style = this.loadObjectByElement(
      "style",
      bundleStyle.file,
      bundleStyle.attributes,
      ""
    );

    if (style) {
      style.onload = style.onreadystatechange = function () {
        bundleStyle.loaded = true;
        dsoLoader.checkBundleStatus();
      };
      style.onerror = function () {
        bundleStyle.error = true;
        dsoLoader.checkBundleStatus();
      };

      styles.appendChild(style);
    }
  }

  document.body.appendChild(scripts);
  document.body.appendChild(styles);
};

var dsoLoader = new DSOLoader();

/*
 * dsoModules
 */
var dsoModules = function () {
  if (dsoConfig.debug) {
    console.log("Running Modules ...");
  }

  /* dsoLoader.createModuleLoadObjects() */
  dsoLoader.createModuleLoadObjects();

  /* dsoLoader.loadModules() */
  dsoLoader.loadModules();

  return true;
};

/*
 * dsoInit - DSO init
 */
var dsoInit = function (fallover = false) {
  if (dsoConfig.debug) {
    if (fallover === true) {
      console.log("Running Init ... [Fallover Mode!]");
    } else {
      console.log("Running Init ...");
    }
  }

  if (typeof dsoPing !== "undefined") {
    // Last kbps value
    var kbps = Number(dsoPing.pingKbps.toFixed(2));

    console.log("Current Kpbs: " + kbps);
    console.log("Performance Output");
    console.log(performance);
    console.log(performance.getEntriesByType("resource"));

    document.getElementById("kbpsOutput").innerHTML = kbps;
    document.getElementById("mbpsOutput").innerHTML = parseFloat(
      Math.round((kbps / 1000) * 100) / 100
    ).toFixed(2);
    document.getElementById("resourceOutput").innerHTML =
      dsoPing.pingPayloadSize;
  }

  /*
   * DSOModules
   * Maybe we can put this in the main thread, I found performance improvements keeping it here for now though
   */
  dsoModules();

  dsoLoader.createBundleLoadObjects(fallover);
  dsoLoader.loadBundles();

  // If we are in fallover mode we try to ping one more time but this time we'll use a callback
  if (dsoConfig.ping && fallover === true) {
    dsoPing.ping(function () {
      dsoLoader.createBundleLoadObjects();
      dsoLoader.loadBundles();
    });
  }

  return true;
};

if (dsoConfig.ping) {
  // Run when the first ping result comes in, otherwise fallover
  var dsoInitPollFrequency = 1; // The rate at which will poll init
  var dsoInitPollFallover = 1000;
  var dsoInitPollClock = 0;

  if (
    typeof Promise !== "undefined" &&
    Promise.toString().indexOf("[native code]") !== -1
  ) {
    // Sleep function
    var dsoSleep = function (time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, time);
      });
    };

    var dsoInitPoll = async function () {
      dsoInitPollClock += dsoInitPollFrequency;
      await dsoSleep(dsoInitPollFrequency);

      if (dsoPing.pingKbps > 0) {
        dsoInit();
      } else if (dsoInitPollClock > dsoInitPollFallover) {
        dsoInit(true);
      } else {
        dsoInitPoll();
      }
    };
  } else {
    if (dsoConfig.debug) {
      console.log("Promises: false");
    }
    var dsoInitPoll = function () {
      setTimeout(function () {
        dsoInitPollClock += dsoInitPollFrequency;

        if (dsoConfig.pingKbps > 0) {
          dsoInit();
        } else if (dsoInitPollClock > dsoInitPollFallover) {
          dsoInit(true);
        } else {
          dsoInitPoll();
        }
      }, dsoInitPollFrequency);
    };
  }
  dsoInitPoll();
} else {
  dsoInit();
}

if (dsoConfig.debug && typeof dsoInitPollClock) {
  console.log("Poll clock: " + dsoInitPollClock);
}
