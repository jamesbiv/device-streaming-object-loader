/**
 * @constructor DSOPing
 * @param {boolean} debug
 */
export var DSOPing = function (debug = false) {
  /*
   * Global declarations
   */
  this.debug = debug;

  // For debugging purposes
  this.performanceEnabled = true;
  this.xhrEnabled = true;

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
 *        each ping is no more than 1-2KB respecitivly
 *
 *        Note: We need to test the backward compatability for ping.
 *        Note II: Create API an reference for ping to be used
 */
DSOPing.prototype = {
  ping: function (callback) {
    if (this.debug) {
      console.log("Ping?");
    }

    if (this.pingBufferInc > this.pingBufferMax) {
      this.pingBufferInc = 0;
    }

    var rand = Math.random().toString(36).substr(2, 10).toLowerCase();

    if (this.xhrEnabled) {
      this.pingBuffer[this.pingBufferInc] = new XMLHttpRequest();
      this.pingBuffer[this.pingBufferInc].open(
        "GET",
        this.pingUrl + "?=" + rand,
        true
      );
      this.pingBuffer[this.pingBufferInc].send();
    } else {
      this.pingBuffer[this.pingBufferInc] = new Image();
      this.pingBuffer[this.pingBufferInc].src = this.pingUrl + "?=" + rand;
    }

    if (!this.performanceEnabled || typeof performance !== "object") {
      var fetchStart = new Date().getTime();
    }

    this.pingBuffer[this.pingBufferInc].onload = function (event) {
      if (this.debug) {
        console.log("Pong!");
      }

      var transferSize = event.total;
      var transferTime;

      if (!this.performanceEnabled || typeof performance !== "object") {
        var responseEnd = new Date().getTime();

        transferTime = (responseEnd - fetchStart) / 1000;
        transferSize = transferSize || this.pingPayloadSize;
      } else {
        var entries = performance.getEntriesByName(this.pingUrl + "?=" + rand);
        var lastEntry = entries[entries.length - 1];

        transferTime = (lastEntry.responseEnd - lastEntry.fetchStart) / 1000;

        if (
          typeof lastEntry.transferSize === "number" &&
          lastEntry.transferSize > 0
        ) {
          transferSize = transferSize || lastEntry.transferSize;
        } else {
          transferSize = transferSize || this.pingPayloadSize;
        }
      }

      // To KBps a further 1024 for MBps
      this.pingBufferKpbs[this.pingBufferInc] =
        (transferSize * 8) / transferTime / 1024;

      // Save to the DSO
      this.pingKbps = this.pingBufferKpbs[this.pingBufferInc];

      if (this.debug) {
        console.log(this.pingKbps);
      }

      if (typeof callback === "function") {
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
  },
};
