"use strict";

import { DSOConfig } from "./DSOConfig";
import { DSOPing } from "./DSOPing";
import { DSOLoader } from "./DSOLoader";

var dsoConfig = new DSOConfig();

/* The bundling and module defintions */

/**
 * Non Interactive definitions
 */
dsoConfig.bundles = [
  {
    threshold: dsoConfig.nonInt,
    type: "initial", // Initial means we'll download respecitivly of performance (default for noinit)
    maxMedia: false, // Determine media max (optional) (untested)
    minMedia: false, // Determine media min (optional) (untested)
    userAgent: false, // Load based on useragent (optional) (untested)
    // Loading our vendors (here the difference is that vendors are loaded first)
    vendorJs: ["scripts/nonInteractiveVendor.js|deferred=deferred"],
    vendorCss: ["css/nonInteractiveVendor.css"],
    // Loading the app
    scripts: ["scripts/nonInteractiveApp.js|deferred=deferred"],
    styles: ["css/nonInteractiveStyles.css"],
    // initialisers that will run after all has loaded (optional)
    onload: function () {
      // event callback after the whole bundle has loaded
      console.log("Non Interactive Bundle Loaded");
    },
    onthresholdload: function () {
      console.log("Non Interactive Bundle Threshold Loaded");
    },
    onscriptload: function () {}, // event callback after scripts have loaded
    onstyleload: function () {}, // event callback after styles have loaded
  },
  {
    threshold: dsoConfig.stdInt, // We can have more than one of these based on resolution and breakpoint
    type: "inherit",
    minWidth: false,
    maxWidth: false,
    vendorJs: ["scripts/interactiveVendor.js"],
    vendorCss: ["css/interactiveVendor.css"],
    scripts: ["scripts/interactiveApp.js"],
    styles: ["css/interactiveApp.css"],
    onload: function () {
      console.log("Interactive Bundle Loaded");
    },
    onthresholdload: function () {
      console.log("Interactive Bundle Threshold Loaded");
    },
  },
  {
    threshold: 100, // Set at Kpbs I.E 100KBps
    type: "inherit",
    minWidth: false,
    maxMwidth: false,
    vendorJs: ["scripts/customThresholdVendor.js"],
    vendorCss: ["css/customThresholdVendor.css"],
    scripts: ["scripts/customThresholdApp.js"],
    styles: ["css/customThresholdApp.css"],
    onload: function () {
      console.log("Custom Bundle Loaded");
    },
    onthresholdload: function () {
      console.log("Custom Bundle Threshold Loaded");
    },
  },
  {
    threshold: 200, // Hi def mode at 200KBps
    type: "inherit",
    vendorJs: ["scripts/richCustomThresholdVendor.js"],
    vendorCss: ["css/richCustomThresholdVendor.css"],
    scripts: ["scripts/richCustomThresholdApp.js"],
    styles: ["css/richCustomThresholdApp.css"],
    onload: function () {
      console.log("Rich Custom Bundle Loaded");
    },
    onthresholdload: function () {
      console.log("Rich Custom Bundle Threshold Loaded");
    },
  },
];

/**
 * Module defintions
 */
dsoConfig.modules = [
  {
    scripts: ['/scripts/sw.js|deferred="deferred"|type="text/javascript"'],
    onload: function () {
      /* Serviceworker config or importer goes here */
      return true;
    },
    accepted: true,
  },
  {
    scripts: ["lazyLoader.js"],
    styles: ["lazyStyle.css"],
    onload: function () {},
    accepted: true,
  },
];

/*
 * Mode Callbacks
 */
dsoConfig.onNonInteractiveLoad = function () {
  console.log("onNonInteractiveLoad: Loaded");
  document.getElementById("thresholdOutput").innerHTML = "onNonInteractiveLoad";
};

dsoConfig.onInteractiveLoad = function () {
  console.log("onInteractiveLoad: Loaded");
  document.getElementById("thresholdOutput").innerHTML = "onInteractiveLoad";
};

dsoConfig.onCustomThresholdLoad = function () {
  console.log("onCustomThresholdLoad: Loaded");
  document.getElementById("thresholdOutput").innerHTML =
    "onCustomThresholdLoad";
};

/* End of bundling and module defintions */

if (DEBUG) {
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
  DEBUG &&
  typeof dsoConfig.setResourceTimingBufferSize !== undefined &&
  typeof performance.setResourceTimingBufferSize === "function"
) {
  performance.setResourceTimingBufferSize(
    dsoConfig.setResourceTimingBufferSize
  );
}

if (dsoConfig.ping) {
  var dsoPing = new DSOPing();

  dsoPing.ping();
}

var dsoLoader = new DSOLoader(dsoConfig, dsoPing);

/**
 * @name dsoInit
 * @param {boolean} fallover
 * @returns boolean
 */
var dsoInit = function (fallover = false) {
  if (DEBUG) {
    if (fallover) {
      console.log("Running Init ... [Fallover Mode!]");
    } else {
      console.log("Running Init ...");
    }
  }

  if (DEBUG && typeof dsoPing === "object") {
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
   */
  if (DEBUG) {
    console.log("Running Modules ...");
  }

  dsoLoader.createModuleLoadObjects();
  dsoLoader.loadModules();

  /**
   * DSOBundles
   */
  if (DEBUG) {
    console.log("Running Bundles ...");
  }

  dsoLoader.defineBundleAcceptance(fallover);
  dsoLoader.loadBundles();

  /*
   * If fallover is true attempt to ping again and call loadBundles inside a callback
   */
  if (dsoConfig.ping && fallover) {
    dsoPing.ping(function () {
      dsoLoader.defineBundleAcceptance();
      dsoLoader.loadBundles();
    });
  }

  return true;
};

if (dsoConfig.ping) {
  /*
   * Poll until the first ping result comes in, otherwise set fallover to true
   */
  var dsoInitPollFrequency = 1; // The rate at which will poll init
  var dsoInitPollFallover = 1000;
  var dsoInitPollClock = 0;

  var dsoEnablePromises = false;

  var dsoInitPoll = function () {};

  if (
    dsoEnablePromises &&
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
        if (DEBUG && typeof dsoInitPollClock === "number") {
          console.log("Poll clock: " + dsoInitPollClock + " tick(s)");
        }
        dsoInit();
      } else if (dsoInitPollClock > dsoInitPollFallover) {
        dsoInit(true);
      } else {
        dsoInitPoll();
      }
    };
  } else {
    if (DEBUG) {
      console.log("Promises: false");
    }

    dsoInitPoll = function () {
      setTimeout(function () {
        dsoInitPollClock += dsoInitPollFrequency;

        if (dsoPing.pingKbps > 0) {
          if (DEBUG && typeof dsoInitPollClock === "number") {
            console.log("Poll clock: " + dsoInitPollClock + " tick(s)");
          }
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
