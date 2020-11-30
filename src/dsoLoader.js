"use strict";

/**
 * @constructor DSOConfig
 * @param {boolean} debug
 */
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
  this.onnonInteractiveLoad = function () {}; // Callback
  this.onnonInteractiveLoaded = false; // Changes to true

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
  this.nonInt = -2;
  this.stdInt = -1;

  this.bundles = [];
  this.modules = [];

  this.bundle = {};
  this.module = {};

  /*
   * Envornment Variables
   */

  /**
   * setResourceTimingBufferSize
   * For better overall production performance reducing this will save memory I suggest no less than 10
   * Note: This is causing problems once the buffer hits because the browser doesn't keep this tidy both
   * in FF and Chrome
   */
  this.setResourceTimingBufferSize = 100;

  /* Timers */
  this.startLoadTime = 0;
  this.domLoadTime = 0;
};

var dsoConfig = new DSOConfig(true);

/* The bundling and module defintions */

/**
 * Non Interactive definitions
 */
dsoConfig.bundles = [
  {
    threshold: dsoConfig.nonInt,
    label: "optional", // Not sure if its needed but we'll have it for now
    type: "initial", // Initial means we'll download respecitivly of performance (default for noinit)
    method: "promise|element|xhr", // Load method, allowing for different object types to be loaded
    maxMedia: false, // Determine media max (optional) (untested)
    minMedia: false, // Determine media min (optional) (untested)
    useragent: false, // Load based on useragent (optional) (untested)
    // Loading our vendors (here the difference is that vendors are loaded first)
    vendorJs: [
      'nonInteractiveVendor.js|deferred=deferred|type="text/javascript"',
    ],
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
    threshold: dsoConfig.stdInt, // We can have more than one of these based on resolution and breakpoint
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

/**
 * Module defintions
 */
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

/**
 * @constructor DSOPing()
 */
var DSOPing = function () {
  // Every pingInterval we will perform the ping (default 30secs)
  this.pingInterval = false;

  // The network performance of the last ping test (do not modify)
  this.pingKbps = -1;

  // Ping configuration
  this.pingUrl =
    "https://raw.githubusercontent.com/jamesbiv/device-streaming-object-loader/master/src/ping.png";

  /**
   * Only used for browsers that do not support transferSize (Safari).
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

/**
 * @name DSOPing.prototype.ping
 * @param {function() => void} callback
 * @description DSO Ping tool to determine network speed
 * @returns boolean
 *
 * @notes We need to watch memory here as the network performance object will continue to increase even
 *        though we are redefining the Image object with the the range for 5 images, further to note,
 *        each ping is no more than 1-2kb respecitivly
 *
 *        Note: We need to test the backward compatability for ping.
 *        Note II: Create API an reference for ping to be used
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
  this.pingBuffer[this.pingBufferInc].src = this.pingUrl + "?=" + rand;

  if (!this.performanceEnabled || typeof performance !== "undefined") {
    var fetchStart = new Date().getTime();
  }

  this.pingBuffer[this.pingBufferInc].onload = function () {
    if (dsoConfig.debug) {
      console.log("Pong!");
    }
    var transferTime;
    var transferSize;

    if (!this.performanceEnabled || typeof performance !== "undefined") {
      var responseEnd = new Date().getTime();

      transferTime = (responseEnd - fetchStart) / 1000;
      transferSize = this.pingPayloadSize;
    } else {
      var entries = performance.getEntriesByName(this.pingUrl + "?=" + rand);
      var lastEntry = entries[entries.length - 1];

      transferTime = (lastEntry.responseEnd - lastEntry.fetchStart) / 1000;

      if ("transferSize" in lastEntry) {
        transferSize = lastEntry.transferSize;
      } else {
        transferSize = this.pingPayloadSize;
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

/**
 * @name DSOLoader.prototype.loadObjectByElement
 * @param {string} type
 * @param {} objectElement
 * @param {string} id
 * @param {function () => void} success
 * @param {function () => void} error
 * @returns
 */
DSOLoader.prototype.loadObjectByElement = function (
  type,
  objectElement,
  id,
  success,
  error
) {
  if (
    typeof this.elements[type] === "undefined" ||
    typeof objectElement === "undefined"
  ) {
    return null;
  }

  var attributes = this.elements[type].attributes;
  var element = document.createElement(this.elements[type].tag);
  var link = this.elements[type].link;

  element.setAttribute(link, objectElement.file);

  if (typeof id === "string" || id instanceof String) {
    //element.setAttribute('id', id);
  }

  Object.keys(attributes).forEach(function (key) {
    element.setAttribute(key, attributes[key]);
  });

  if (
    typeof objectElement.attributes !== "undefined" &&
    (typeof objectElement.attributes === "string" ||
      objectElement.attributes instanceof String)
  ) {
    var objectAttributes = objectElement.attributes.split("|");
  }

  if (typeof objectAttributes !== "undefined" && objectAttributes.length > 1) {
    for (
      var objectAttribute = 0;
      objectAttribute < objectAttributes.length;
      objectAttribute++
    ) {
      var values = objectAttributes[objectAttribute].split("=");

      values.length > 1
        ? element.setAttribute(values[0], values[1])
        : element.setAttribute(values[0], "");
    }
  }

  return element;
};

/**
 * @name DSOLoader.prototype.createLoadObjects
 * @param {*} input
 * @param {object[]} outputScripts
 * @param {object[]} outputStyles
 * @param {string[]} ids
 * @returns boolean
 */
DSOLoader.prototype.createLoadObjects = function (
  input,
  outputScripts,
  outputStyles,
  ids
) {
  // Record only the filename
  for (
    var outputScriptEntry = 0;
    outputScripts.length > outputScriptEntry;
    outputScriptEntry++
  ) {
    this.archivedScripts.push(outputScripts[outputScriptEntry].file);
  }
  for (
    outputScriptEntry = 0;
    outputStyles.length > outputScriptEntry;
    outputScriptEntry++
  ) {
    this.archivedStyles.push(outputStyles[outputScriptEntry].file);
  }

  // Flush both arrays before using
  while (outputScripts.length) {
    outputScripts.pop();
  }
  while (outputStyles.length) {
    outputStyles.pop();
  }

  for (var inputEntry = 0; input.length > inputEntry; inputEntry++) {
    if (
      typeof input[inputEntry].scripts !== "undefined" &&
      typeof input[inputEntry].accepted !== "undefined" &&
      input[inputEntry].accepted === true
    ) {
      for (
        var inputScriptEntry = 0;
        input[inputEntry].scripts.length > inputScriptEntry;
        inputScriptEntry++
      ) {
        var scriptString = input[inputEntry].scripts[inputScriptEntry].split(
          "|"
        );
        var scriptFound = false;

        for (
          outputScriptEntry = 0;
          outputScripts.length > outputScriptEntry;
          outputScriptEntry++
        ) {
          if (outputScripts[outputScriptEntry].file === scriptString[0]) {
            outputScripts[outputScriptEntry][ids].push(x);
            scriptFound = true;
          }
        }

        if (this.archivedScripts.length > 0) {
          for (
            var archivedScriptEntry = 0;
            this.archivedScripts.length > archivedScriptEntry;
            archivedScriptEntry++
          ) {
            if (
              this.archivedScripts[archivedScriptEntry].toLowerCase() ==
              scriptString[0].toLowerCase()
            ) {
              scriptFound = true;
            }
          }
        }

        // We set the default script behavior here
        if (scriptFound === false) {
          var script = { [ids]: [] };
          script[ids].push(inputEntry);
          script.file = scriptString[0];
          script.attributes = scriptString.slice(1).join("|");
          script.loaded = false;
          script.error = false;

          outputScripts.push(script);
        }
      }
    }

    if (
      typeof input[inputEntry].styles !== "undefined" &&
      typeof input[inputEntry].accepted !== "undefined"
    ) {
      for (
        var inputStyleEntry = 0;
        input[inputEntry].styles.length > inputStyleEntry;
        inputStyleEntry++
      ) {
        var styleString = input[inputEntry].styles[inputStyleEntry].split("|");
        var styleFound = false;

        for (
          var outputStyleEntry = 0;
          outputStyles.length > outputStyleEntry;
          outputStyleEntry++
        ) {
          if (outputStyles[outputStyleEntry].file === styleString[0]) {
            outputStyles[outputStyleEntry][ids].push(inputEntry);
            styleFound = true;
          }
        }

        if (this.archivedStyles.length > 0) {
          for (
            var archivedStyleEntry = 0;
            this.archivedStyles.length > archivedStyleEntry;
            archivedStyleEntry++
          ) {
            if (
              this.archivedStyles[archivedStyleEntry].toLowerCase() ==
              styleString[0].toLowerCase()
            ) {
              styleFound = true;
            }
          }
        }

        // We set the default style behavior here
        if (styleFound === false) {
          var style = { [ids]: [] };
          style[ids].push(inputEntry);
          style.file = styleString[0];
          style.attributes = styleString.slice(1).join("|");
          style.loaded = false;
          style.error = false;

          outputStyles.push(style);
        }
      }

      // Maybe we delete this one later
      delete input[inputEntry].accepted;
    }
  }

  return true;
};

/**
 * @name DSOLoader.prototype.createModuleLoadObjects
 * @returns
 */
DSOLoader.prototype.createModuleLoadObjects = function () {
  return this.createLoadObjects(
    dsoConfig.modules,
    this.moduleScripts,
    this.moduleStyles,
    "moduleids"
  );
};

/**
 * @name DSOLoader.prototype.createBundleLoadObjects
 * @param {boolean} fallover
 * @param {boolean} stdInt
 * @returns
 * @notes Do not call this again until Loadbundle has finished
 */
DSOLoader.prototype.createBundleLoadObjects = function (
  fallover = false,
  stdInt = false
) {
  // Clear variables before use
  for (
    bundleConfig = 0;
    dsoConfig.bundles.length > bundleConfig;
    bundleConfig++
  ) {
    delete dsoConfig.bundles[bundleConfig].accepted;
    delete dsoConfig.bundles[bundleConfig].unaccepted;
  }

  var kbps =
    typeof dsoPing !== "undefined" ? Number(dsoPing.pingKbps.toFixed(2)) : -1;

  for (
    var configBundle = 0;
    dsoConfig.bundles.length > configBundle;
    configBundle++
  ) {
    if (typeof dsoConfig.bundles[configBundle].loaded === "undefined") {
      var pass = true;
      var accepted = false;

      /* Filter out viewports that dont match (untested)
       * We should make it so just one of the following is set but for now we compare for the two togeather
       */
      if (
        dsoConfig.bundles[configBundle].minMedia > 0 &&
        dsoConfig.bundles[configBundle].maxMedia > 0
      ) {
        if (
          !(
            this.viewportWidth >= dsoConfig.bundles[configBundle].minMedia &&
            this.viewportWidth <= dsoConfig.bundles[configBundle].maxMedia
          ) ||
          !(
            this.viewportHeight >= dsoConfig.bundles[configBundle].minMedia &&
            this.viewportHeight <= dsoConfig.bundles[configBundle].maxMedia
          )
        ) {
          pass = false;
        }
      }

      /**
       * Filter out useragents that dont match (untested)
       * This feature can be expanded using the globals found under navigator such as platform
       */
      if (typeof dsoConfig.bundles[configBundle].useragent === "string") {
        if (
          dsoConfig.bundles[configBundle].useragent.test(this.useragent) ===
          false
        ) {
          pass = false;
        }
      }

      if (pass) {
        /* Fallover mode will just load the non-interactive bundles */
        if (
          fallover === true &&
          dsoConfig.bundles[configBundle].threshold === dsoConfig.nonInt
        ) {
          accepted = true;
          /* Load only interactive modules */
        } else if (
          stdInt === true &&
          dsoConfig.bundles[configBundle].threshold === dsoConfig.stdInt &&
          dsoConfig.threshold <= kbps
        ) {
          accepted = true;
          /**
           * No ping mode will just load all libries in consecutive order but only as a low priority
           * TODO: We should set this so no ping and no stream loads everything and stream with no ping
           * loads non interactive andthen interactive later
           */
        } else if (typeof dsoPing === "undefined") {
          accepted = true;
          /* Otherwise load based on ping priority */
        } else {
          if (dsoConfig.bundles[configBundle].threshold === dsoConfig.nonInt) {
            accepted = true;
          }
          if (
            dsoConfig.bundles[configBundle].threshold === dsoConfig.stdInt &&
            dsoConfig.threshold <= kbps
          ) {
            accepted = true;
          }
          if (
            dsoConfig.bundles[configBundle].threshold > 0 &&
            dsoConfig.bundles[configBundle].threshold <= kbps
          ) {
            accepted = true;
          }
        }
      }

      if (accepted === true) {
        if (dsoConfig.debug) {
          console.log(dsoConfig.bundles[configBundle]);
          console.log("Accepted bundle");
        }
        if (
          typeof dsoConfig.bundles[configBundle].type !== "undefined" &&
          dsoConfig.bundles[configBundle].type === "inherit"
        ) {
          dsoConfig.bundles[configBundle].accepted = true;
        } else if (
          typeof dsoConfig.bundles[configBundle].type !== "undefined" &&
          dsoConfig.bundles[configBundle].type === "initial"
        ) {
          // clear and start allover
          for (
            let emptyConfigBundle = 0;
            dsoConfig.bundles.length > emptyConfigBundle;
            emptyConfigBundle++
          ) {
            delete dsoConfig.bundles[emptyConfigBundle].accepted;
          }
          dsoConfig.bundles[configBundle].accepted = true;
        }
      } else {
        if (dsoConfig.debug) {
          console.log(dsoConfig.bundles[configBundle]);
          console.log("Unaccepted bundle");
        }
        dsoConfig.bundles[configBundle].unaccepted = true;
      }
    }
  }

  /**
   * If stream mode is set let's check the current set of bundles and load the next volly of bundles if needed
   * Note: this may become recursive in the future to account for custom thresholds after interactive but
   * for now we stop at just interactive mode defined under DSOLoader.prototype.loadInteractive() */
  if (dsoConfig.stream) {
    var interactive = true;
    var bundleLength = 0;

    for (
      var bundleConfig = 0;
      dsoConfig.bundles.length > bundleConfig;
      bundleConfig++
    ) {
      if (typeof dsoConfig.bundles[bundleConfig].accepted !== "undefined") {
        bundleLength++;

        if (dsoConfig.bundles[bundleConfig].threshold !== dsoConfig.nonInt) {
          interactive = false;
        }
      }
    }

    if (interactive === true && bundleLength > 0) {
      for (
        bundleConfig = 0;
        dsoConfig.bundles.length > bundleConfig;
        bundleConfig++
      ) {
        if (typeof dsoConfig.bundles[bundleConfig].accepted !== "undefined") {
          dsoConfig.bundles[bundleConfig]._onload = function () {
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

/**
 * @name DSOLoader.prototype.loadInteractive
 * @param {boolean} count
 * @returns
 *
 * @notes We need to create an API reference for this function.
 *        Note: The counter allows for all bundles to be loaded, we should make it so we can
 *         dedicate its own variable to each group but for now we'll just rely on dsoLoader.liTally
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
 * @name DSOLoader.prototype.checkObjectStatus
 * @param {*} object
 * @param {*} outputScripts
 * @param {*} outputStyles
 * @param {*} ids
 * @returns boolean
 * @description Used to check the callback of an object being loader
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

  for (var objectEntry = 0; object.length > objectEntry; objectEntry++) {
    var id = objectEntry;

    var scripts = object[objectEntry].scripts;
    var styles = object[objectEntry].styles;

    if (
      typeof scripts !== "undefined" &&
      typeof object[objectEntry].scriptsLoaded === "undefined"
    ) {
      var scriptsTally = 0;
      var scriptsTallyOffset = 0;
      for (
        var outputScriptEntry = 0;
        outputScripts.length > outputScriptEntry;
        outputScriptEntry++
      ) {
        for (
          var scriptIdEntry = 0;
          outputScripts[outputScriptEntry][ids].length > scriptIdEntry;
          scriptIdEntry++
        ) {
          if (outputScripts[outputScriptEntry][ids][scriptIdEntry] === id) {
            if (outputScripts[outputScriptEntry].loaded === true) {
              scriptsTally++;
            }
            if (outputScripts[outputScriptEntry].error === true) {
              scriptsTallyOffset++;
            }
          }
        }

        // All scripts have loaded
        if (scripts.length - scriptsTallyOffset <= scriptsTally) {
          object[objectEntry].scriptsLoaded = true;

          if (
            typeof object[objectEntry].onscriptload !== "undefined" &&
            typeof object[objectEntry].onscriptload === "function"
          ) {
            object[objectEntry].onscriptload();
          }
          if (
            typeof object[objectEntry]._onscriptload !== "undefined" &&
            typeof object[objectEntry]._onscriptload === "function"
          ) {
            object[objectEntry]._onscriptload();
          }
        }
      }
    }

    if (
      typeof styles !== "undefined" &&
      typeof object[objectEntry].stylesLoaded === "undefined"
    ) {
      var stylesTally = 0;
      var stylesTallyOffset = 0;

      for (
        var outputStyleEntry = 0;
        outputStyles.length > outputStyleEntry;
        outputStyleEntry++
      ) {
        for (
          var styleIdEntry = 0;
          outputStyles[outputStyleEntry][ids].length > styleIdEntry;
          styleIdEntry++
        ) {
          if (outputStyles[outputStyleEntry][ids][styleIdEntry] === id) {
            if (outputStyles[outputStyleEntry].loaded === true) {
              stylesTally++;
            }
            if (outputStyles[outputStyleEntry].error === true) {
              stylesTallyOffset++;
            }
          }
        }

        // All styles have loaded
        if (styles.length - stylesTallyOffset <= stylesTally) {
          object[objectEntry].stylesLoaded = true;

          if (typeof object[objectEntry].onstyleload === "function") {
            object[objectEntry].onstyleload();
          }
          if (typeof object[objectEntry]._onstyleload === "function") {
            object[objectEntry]._onstyleload();
          }
        }
      }
    }

    // All scripts and styles have loaded
    if (typeof object[objectEntry].loaded === "undefined") {
      if (
        typeof object[objectEntry].scriptsLoaded !== "undefined" &&
        object[objectEntry].scriptsLoaded == true &&
        typeof object[objectEntry].stylesLoaded !== "undefined" &&
        object[objectEntry].stylesLoaded == true
      ) {
        object[objectEntry].loaded = true;

        if (typeof object[objectEntry].onload === "function") {
          object[objectEntry].onload();
        }

        if (typeof object[objectEntry]._onload === "function") {
          object[objectEntry]._onload();
        }
      }
    }

    switch (object[objectEntry].threshold) {
      case dsoConfig.nonInt:
        if (
          typeof object[objectEntry].loaded !== "undefined" &&
          object[objectEntry].loaded == true
        ) {
          nonInteractive = true;
        } else {
          nonInteractive = false;
        }
        break;

      case dsoConfig.stdInt:
        if (
          typeof object[objectEntry].loaded !== "undefined" &&
          object[objectEntry].loaded == true
        ) {
          stdInteractive = true;
        } else {
          stdInteractive = false;
        }
        break;

      default:
        if (
          typeof object[objectEntry].loaded !== "undefined" &&
          object[objectEntry].loaded == true
        ) {
          customThreshold = true;
        } else {
          customThreshold = false;
        }
        break;
    }
  }

  // Group Callbacks
  if (nonInteractive === true && dsoConfig.onnonInteractiveLoaded !== true) {
    if (typeof dsoConfig.onnonInteractiveLoad === "function") {
      dsoConfig.onnonInteractiveLoad();
    }
    dsoConfig.onnonInteractiveLoaded = true;
  }
  if (stdInteractive === true && dsoConfig.onInteractiveLoadLoaded !== true) {
    if (typeof dsoConfig.onnonInteractiveLoad === "function") {
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

/**
 * @name DSOLoader.prototype.checkModuleStatus
 * @returns
 */
DSOLoader.prototype.checkModuleStatus = function () {
  return this.checkObjectStatus(
    dsoConfig.modules,
    this.moduleScripts,
    this.moduleStyles,
    "moduleids"
  );
};

/**
 * @name DSOLoader.prototype.checkBundleStatus
 * @returns
 */
DSOLoader.prototype.checkBundleStatus = function () {
  return this.checkObjectStatus(
    dsoConfig.bundles,
    this.bundleScripts,
    this.bundleStyles,
    "bundleids"
  );
};

/**
 * @name DSOLoader.prototype.checkBundleStatus
 * @returns
 */
DSOLoader.prototype.loadModules = function () {
  var scripts = document.createElement("div");
  var styles = document.createElement("div");

  scripts.id = "moduleScripts";
  styles.id = "moduleStyles";

  for (
    var moduleScriptEntry = 0;
    this.moduleScripts.length > moduleScriptEntry;
    moduleScriptEntry++
  ) {
    var moduleScript = this.moduleScripts[moduleScriptEntry];
    var script = this.loadObjectByElement("script", moduleScript, "");

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

  for (
    moduleScriptEntry = 0;
    this.moduleStyles.length > moduleScriptEntry;
    moduleScriptEntry++
  ) {
    var moduleStyle = this.moduleStyles[moduleScriptEntry];
    var style = this.loadObjectByElement("style", moduleStyle, "");

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

/**
 * @name DSOLoader.prototype.loadBundles
 * @returns
 * @description Logic for the load process
 */
DSOLoader.prototype.loadBundles = function () {
  var scripts = document.createElement("div");
  var styles = document.createElement("div");

  scripts.id = "bundleScripts";
  styles.id = "bundleStyles";

  for (
    var bundleScriptEntry = 0;
    this.bundleScripts.length > bundleScriptEntry;
    bundleScriptEntry++
  ) {
    var bundleScript = this.bundleScripts[bundleScriptEntry];
    var script = this.loadObjectByElement("script", bundleScript, "");

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

  for (
    bundleScriptEntry = 0;
    this.bundleStyles.length > bundleScriptEntry;
    bundleScriptEntry++
  ) {
    var bundleStyle = this.bundleStyles[bundleScriptEntry];
    var style = this.loadObjectByElement("style", bundleStyle, "");

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

/**
 * @name dsoModules
 * @returns boolean
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

/**
 * @name dsoInit
 * @param {boolean} fallover
 * @returns boolean
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

  /**
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

  var dsoInitPoll = function () {};

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

    dsoInitPoll = async function () {
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

    dsoInitPoll = function () {
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
