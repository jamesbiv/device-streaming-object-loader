/**
 * @constructor DSOConfig
 * @param {boolean} debug
 */
export var DSOConfig = function (debug = false) {
  /*
   * Global declarations
   */
  this.debug = debug;

  this.ping = true;
  this.stream = false;

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
   * Threshold in KBps for interactive to non interactive (15KBps is very slow)
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
