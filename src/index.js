"use strict";

import { DSOConfig } from "./DSOConfig";
import { DSOPing } from "./DSOPing";
import { DSOLoader } from "./DSOLoader";

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
      'scripts/nonInteractiveVendor.js|deferred=deferred',
    ],
    vendorCss: ["css/nonInteractiveVendor.css"],
    // Loading the app
    scripts: ["scripts/nonInteractiveApp.js|deferred=deferred"],
    styles: ["css/nonInteractiveStyles.css"],
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
    vendorJs: ["scripts/interactiveVendor.js"],
    vendorCss: ["css/interactiveVendor.css"],
    scripts: ["scripts/interactiveApp.js"],
    styles: ["css/interactiveApp.css"],
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
    vendorJs: ["scripts/customThresholdVendor.js"],
    vendorCss: ["css/customThresholdVendor.css"],
    scripts: ["scripts/customThresholdApp.js"],
    styles: ["css/customThresholdApp.css"],
    onload: function () {
      alert("Custom Threshold Loaded");
    },
  },
  {
    threshold: 500, // Hi def mode at 500kpbs
    type: "inherit",
    vendorJs: ["scripts/richCustomThresholdVendor.js"],
    vendorCss: ["css/richCustomThresholdVendor.css"],
    scripts: ["scripts/richCustomThresholdApp.js"],
    styles: ["css/richCustomThresholdApp.css"],
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
) {
  performance.setResourceTimingBufferSize(
    dsoConfig.setResourceTimingBufferSize
  );
}

if (dsoConfig.ping) {
  var dsoPing = new DSOPing(dsoConfig.debug);

  dsoPing.ping();
}

var dsoLoader = new DSOLoader(dsoConfig, dsoPing, dsoConfig.debug);

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
    if (fallover) {
      console.log("Running Init ... [Fallover Mode!]");
    } else {
      console.log("Running Init ...");
    }
  }

  if (typeof dsoPing === "object") {
    // Last KBps value
    var kbps = Number(dsoPing.pingKbps.toFixed(2));

    console.log("Current KBps: " + kbps);
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

  dsoLoader.defineBundleAcceptance(fallover);
  dsoLoader.loadBundles();

  // If we are in fallover mode we try to ping one more time but this time we'll use a callback
  if (dsoConfig.ping && fallover) {
    dsoPing.ping(function () {
      dsoLoader.defineBundleAcceptance();
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
    typeof Promise === "function" &&
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

if (dsoConfig.debug && typeof dsoInitPollClock === "number") {
  console.log("Poll clock: " + dsoInitPollClock + " tick(s)");
}
