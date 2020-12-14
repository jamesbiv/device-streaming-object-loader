/**
 * @constructor DSOLoader
 * @param {DSOConfig} dsoConfig
 * @param {DSOPing} dsoPing
 */
export var DSOLoader = function (dsoConfig = undefined, dsoPing = undefined) {
  /*
   * Global declarations
   */
  this.dsoConfig = dsoConfig;
  this.dsoPing = dsoPing;

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

  this.userAgent = navigator.userAgent;

  this.liTally = 0;

  this.archivedObjects = [];

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
 * @name DSOLoader.prototype.createObjectElement
 * @param {string} type
 * @param {object} objectElement
 * @param {string} id
 * @param {function () => void} success
 * @param {function () => void} error
 * @returns object
 */
DSOLoader.prototype = {
  createObjectElement: function (type, objectElement) {
    if (
      typeof this.elements[type] !== "object" ||
      typeof objectElement !== "object"
    ) {
      return null;
    }

    var attributes = this.elements[type].attributes;
    var element = document.createElement(this.elements[type].tag);
    var link = this.elements[type].link;

    element.setAttribute(link, objectElement.file);

    Object.keys(attributes).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });

    if (
      typeof objectElement.attributes === "string" &&
      objectElement.attributes.length > 1
    ) {
      var objectAttributes = objectElement.attributes.split("|");
    }

    if (typeof objectAttributes === "object" && objectAttributes.length > 0) {
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
  },

  /**
   * @name DSOLoader.prototype.createLoadObjects
   * @param {object} input
   * @param {object[]} outputScripts
   * @param {object[]} outputStyles
   * @param {string[]} ids
   * @returns boolean
   */
  createLoadObjects: function (input, outputScripts, outputStyles, ids) {
    // Record only the filename
    outputScripts.forEach((outputScript) => {
      this.archivedObjects.push(outputScript.file);
    });

    outputStyles.forEach((outputStyle) => {
      this.archivedObjects.push(outputStyle.file);
    });

    // Flush both arrays before using
    while (outputScripts.length) {
      outputScripts.pop();
    }

    while (outputStyles.length) {
      outputStyles.pop();
    }

    [
      { name: "vendorJs", type: "scripts" },
      { name: "scripts", type: "scripts" },
      { name: "venderCss", type: "styles" },
      { name: "styles", type: "styles" },
    ].forEach((entryType) => {
      for (var inputEntry = 0; input.length > inputEntry; inputEntry++) {
        if (
          typeof input[inputEntry][entryType.name] === "object" &&
          typeof input[inputEntry].accepted === "boolean" &&
          input[inputEntry][entryType.name].length > 0 &&
          input[inputEntry].accepted
        ) {
          for (
            var entry = 0;
            input[inputEntry][entryType.name].length > entry;
            entry++
          ) {
            var entryString = input[inputEntry][entryType.name][entry].split(
              "|"
            );

            var entryFound = false;

            if (
              typeof this.archivedObjects === "object" &&
              this.archivedObjects.length > 0
            ) {
              for (
                var archivedObjectEntry = 0;
                this.archivedObjects.length > archivedObjectEntry;
                archivedObjectEntry++
              ) {
                if (
                  this.archivedObjects[archivedObjectEntry] == entryString[0]
                ) {
                  entryFound = true;
                }
              }
            }

            // We set the default script behavior here
            if (!entryFound) {
              entryType.type === "scripts"
                ? outputScripts.push({
                    [ids]: [inputEntry],
                    file: entryString[0],
                    attributes: entryString.slice(1).join("|"),
                    loaded: false,
                    error: false,
                  })
                : outputStyles.push({
                    [ids]: [inputEntry],
                    file: entryString[0],
                    attributes: entryString.slice(1).join("|"),
                    loaded: false,
                    error: false,
                  });
            }
          }
        }
      }
    });

    return true;
  },

  /**
   * @name DSOLoader.prototype.createModuleLoadObjects
   * @returns
   */
  createModuleLoadObjects: function () {
    if (DEBUG) {
      console.log(this.dsoConfig.modules);
    }

    return this.createLoadObjects(
      this.dsoConfig.modules,
      this.moduleScripts,
      this.moduleStyles,
      "moduleids"
    );
  },

  /**
   * @name DSOLoader.prototype.defineBundleAcceptance
   * @param {boolean} fallover
   * @param {boolean} stdInt
   * @returns
   * @notes Do not call this again until Loadbundle has finished
   */
  defineBundleAcceptance: function (fallover = false, stdInt = false) {
    // Clear variables before use
    for (
      bundleConfig = 0;
      this.dsoConfig.bundles.length > bundleConfig;
      bundleConfig++
    ) {
      delete this.dsoConfig.bundles[bundleConfig].accepted;
      delete this.dsoConfig.bundles[bundleConfig].unaccepted;
    }

    var kbps =
      typeof this.dsoPing === "object"
        ? Number(this.dsoPing.pingKbps.toFixed(2))
        : -1;

    for (
      var configBundle = 0;
      this.dsoConfig.bundles.length > configBundle;
      configBundle++
    ) {
      if (typeof this.dsoConfig.bundles[configBundle].loaded === "undefined") {
        var pass = true;
        var accepted = false;

        /**
         * Filter out viewports that dont match (untested)
         * We should make it so just one of the following is set but for now we compare for the two togeather
         */
        if (
          this.dsoConfig.bundles[configBundle].minMedia > 0 &&
          this.dsoConfig.bundles[configBundle].maxMedia > 0
        ) {
          if (
            !(
              this.viewportWidth >=
                this.dsoConfig.bundles[configBundle].minMedia &&
              this.viewportWidth <=
                this.dsoConfig.bundles[configBundle].maxMedia
            ) ||
            !(
              this.viewportHeight >=
                this.dsoConfig.bundles[configBundle].minMedia &&
              this.viewportHeight <=
                this.dsoConfig.bundles[configBundle].maxMedia
            )
          ) {
            pass = false;
          }
        }

        /**
         * Filter out user agents that dont match (untested)
         * This feature can be expanded using the globals found under navigator such as platform
         */
        if (
          typeof this.dsoConfig.bundles[configBundle].userAgent === "string"
        ) {
          if (
            !this.dsoConfig.bundles[configBundle].userAgent.test(this.userAgent)
          ) {
            pass = false;
          }
        }

        if (pass) {
          /* Fallover mode will just load the non-interactive bundles */
          if (
            fallover &&
            this.dsoConfig.bundles[configBundle].threshold ===
              this.dsoConfig.nonInt
          ) {
            accepted = true;
            /* Load only interactive modules */
          } else if (
            stdInt &&
            this.dsoConfig.bundles[configBundle].threshold ===
              this.dsoConfig.stdInt &&
            this.dsoConfig.threshold <= kbps
          ) {
            accepted = true;
            /**
             * No ping mode will just load all libries in consecutive order but only as a low priority
             * TODO: We should set this so no ping and no stream loads everything and stream with no ping
             * loads non interactive andthen interactive later
             */
          } else if (typeof this.dsoPing === "undefined") {
            accepted = true;
            /* Otherwise load based on ping priority */
          } else {
            if (
              this.dsoConfig.bundles[configBundle].threshold ===
              this.dsoConfig.nonInt
            ) {
              accepted = true;
            }
            if (
              this.dsoConfig.bundles[configBundle].threshold ===
                this.dsoConfig.stdInt &&
              this.dsoConfig.threshold <= kbps
            ) {
              accepted = true;
            }
            if (
              this.dsoConfig.bundles[configBundle].threshold > 0 &&
              this.dsoConfig.bundles[configBundle].threshold <= kbps
            ) {
              accepted = true;
            }
          }
        }

        if (accepted) {
          if (DEBUG) {
            console.log(this.dsoConfig.bundles[configBundle]);
            console.log("Accepted bundle");
          }
          if (
            typeof this.dsoConfig.bundles[configBundle].type !== "undefined" &&
            this.dsoConfig.bundles[configBundle].type === "inherit"
          ) {
            this.dsoConfig.bundles[configBundle].accepted = true;
          } else if (
            typeof this.dsoConfig.bundles[configBundle].type !== "undefined" &&
            this.dsoConfig.bundles[configBundle].type === "initial"
          ) {
            // clear and start allover
            for (
              let emptyConfigBundle = 0;
              this.dsoConfig.bundles.length > emptyConfigBundle;
              emptyConfigBundle++
            ) {
              delete this.dsoConfig.bundles[emptyConfigBundle].accepted;
            }
            this.dsoConfig.bundles[configBundle].accepted = true;
          }
        } else {
          if (DEBUG) {
            console.log(this.dsoConfig.bundles[configBundle]);
            console.log("Unaccepted bundle");
          }
          this.dsoConfig.bundles[configBundle].unaccepted = true;
        }
      }
    }

    /**
     * If stream is true, let's check the current set of bundles and load the next volly of bundles if needed.
     *
     * Note: This may become a recursive in the future to account for custom thresholds,
     *       after interactive has loaded but for now we stop at just interactive mode
     *       loading as defined in DSOLoader.prototype.loadInteractive()
     */
    if (this.dsoConfig.stream) {
      var interactive = true;
      var bundleLength = 0;

      for (
        var bundleConfig = 0;
        this.dsoConfig.bundles.length > bundleConfig;
        bundleConfig++
      ) {
        if (
          typeof this.dsoConfig.bundles[bundleConfig].accepted === "boolean"
        ) {
          bundleLength++;
          if (
            this.dsoConfig.bundles[bundleConfig].threshold !==
            this.dsoConfig.nonInt
          ) {
            interactive = false;
          }
        }
      }

      if (interactive && bundleLength > 0) {
        for (
          bundleConfig = 0;
          this.dsoConfig.bundles.length > bundleConfig;
          bundleConfig++
        ) {
          if (
            typeof this.dsoConfig.bundles[bundleConfig].accepted === "boolean"
          ) {
            this.dsoConfig.bundles[bundleConfig]._onload = function () {
              this.loadInteractive(bundleLength);
            };
          }
        }
      }
    }

    return this.createLoadObjects(
      this.dsoConfig.bundles,
      this.bundleScripts,
      this.bundleStyles,
      "bundleids"
    );
  },

  /**
   * @name DSOLoader.prototype.loadInteractive
   * @param {boolean} count
   * @returns void
   *
   * @notes We need to create an API reference for this function.
   *
   *        Note: The counter allows for all bundles to be loaded, we should make it so we can
   *              dedicate its own variable to each group but for now we'll just rely on this.liTally
   */
  loadInteractive: function (count = false) {
    var execute = false;

    if (count) {
      this.liTally++;
      if (this.liTally === count) {
        this.liTally = 0;
        execute = true;
      }
    } else {
      execute = true;
    }

    if (execute) {
      /* Note: that simply reloading defineBundleAcceptance which should filter out any of the already loaded bundles
       * What needs to happen here is something different, we need to set a mode that forces only interactive
       * to load leaving only the upper thresholds */
      if (this.defineBundleAcceptance(false, true)) {
        this.loadBundles();
      }
    }
  },

  /**
   * @name DSOLoader.prototype.checkModuleStatus
   * @returns boolean
   */
  checkModuleStatus: function () {
    return this.checkObjectStatus(
      this.dsoConfig.modules,
      this.moduleScripts,
      this.moduleStyles,
      "moduleids"
    );
  },

  /**
   * @name DSOLoader.prototype.checkBundleStatus
   * @returns boolean
   */
  checkBundleStatus: function () {
    return this.checkObjectStatus(
      this.dsoConfig.bundles,
      this.bundleScripts,
      this.bundleStyles,
      "bundleids"
    );
  },

  /**
   * @name DSOLoader.prototype.checkObjectStatus
   * @param {object} object
   * @param {object[]} outputScripts
   * @param {object[]} outputStyles
   * @param {string} ids
   * @returns boolean
   * @description Used to check the callback status of an object being loaded
   */
  checkObjectStatus: function (object, outputScripts, outputStyles, ids) {
    for (var objectEntry = 0; object.length > objectEntry; objectEntry++) {
      var id = objectEntry;

      var scripts = object[objectEntry].scripts;
      var styles = object[objectEntry].styles;

      if (
        typeof scripts === "object" &&
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
              if (
                typeof outputScripts[outputScriptEntry].loaded === "boolean" &&
                outputScripts[outputScriptEntry].loaded
              ) {
                scriptsTally++;
              }
              if (
                typeof outputScripts[outputScriptEntry].error === "boolean" &&
                outputScripts[outputScriptEntry].error
              ) {
                scriptsTallyOffset++;
              }
            }
          }

          // All scripts have loaded
          if (scripts.length - scriptsTallyOffset <= scriptsTally) {
            object[objectEntry].scriptsLoaded = true;

            if (typeof object[objectEntry].onscriptload === "function") {
              object[objectEntry].onscriptload();
            }
            if (typeof object[objectEntry]._onscriptload === "function") {
              object[objectEntry]._onscriptload();
            }
          }
        }
      }

      if (
        typeof styles === "object" &&
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
              if (
                typeof outputStyles[outputStyleEntry].loaded === "boolean" &&
                outputStyles[outputStyleEntry].loaded
              ) {
                stylesTally++;
              }
              if (
                typeof outputStyles[outputStyleEntry].error === "boolean" &&
                outputStyles[outputStyleEntry].error
              ) {
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
          typeof object[objectEntry].scriptsLoaded === "boolean" &&
          typeof object[objectEntry].stylesLoaded === "boolean" &&
          object[objectEntry].scriptsLoaded &&
          object[objectEntry].stylesLoaded
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
    }

    // Group Callbacks
    var objectLoadedTally = 0;
    var objectAcceptedTally = 0;

    var highestThreshold = -3;
    var highestThresholdEntry = undefined;

    for (objectEntry = 0; object.length > objectEntry; objectEntry++) {
      if (
        typeof object[objectEntry].loaded === "boolean" &&
        object[objectEntry].loaded
      ) {
        objectLoadedTally++;
      }
      if (
        typeof object[objectEntry].accepted === "boolean" &&
        object[objectEntry].accepted
      ) {
        objectAcceptedTally++;
      }

      if (
        typeof object[objectEntry].accepted === "boolean" &&
        typeof object[objectEntry].loaded === "boolean" &&
        object[objectEntry].loaded &&
        object[objectEntry].accepted
      ) {
        if (object[objectEntry].threshold > highestThreshold) {
          highestThreshold = object[objectEntry].threshold;
          highestThresholdEntry = objectEntry;
        }
      }
    }

    if (
      objectLoadedTally === objectAcceptedTally &&
      typeof object[highestThresholdEntry].thresholdloaded === "undefined"
    ) {
      object[highestThresholdEntry].thresholdloaded = true;

      if (
        typeof object[highestThresholdEntry] !== "undefined" &&
        typeof object[highestThresholdEntry].onthresholdload === "function"
      ) {
        object[highestThresholdEntry].onthresholdload();
      }

      switch (highestThreshold) {
        case this.dsoConfig.nonInt:
          if (typeof this.dsoConfig.onNonInteractiveLoad === "function") {
            this.dsoConfig.onNonInteractiveLoad();
          }
          this.dsoConfig.onNonInteractiveLoaded = true;
          break;

        case this.dsoConfig.stdInt:
          if (typeof this.dsoConfig.onNonInteractiveLoad === "function") {
            this.dsoConfig.onInteractiveLoad();
          }
          this.dsoConfig.onInteractiveLoadLoaded = true;
          break;

        default:
          if (highestThreshold > 0) {
            if (typeof this.dsoConfig.onCustomThresholdLoad === "function") {
              this.dsoConfig.onCustomThresholdLoad();
            }
            this.dsoConfig.onCustomThresholdLoaded = true;
          }
          break;
      }
    }

    return true;
  },

  /**
   * @name DSOLoader.prototype.loadModules
   * @returns void
   */
  loadModules: function () {
    return this.loadObjects(
      this.moduleScripts,
      this.moduleStyles,
      "dsoModuleScripts",
      "dsoModuleStyles"
    );
  },

  /**
   * @name DSOLoader.prototype.loadBundles
   * @returns void
   */
  loadBundles: function () {
    return this.loadObjects(
      this.bundleScripts,
      this.bundleStyles,
      "dsoBundleScripts",
      "dsoBundleStyles"
    );
  },

  /**
   * @name DSOLoader.prototype.loadObjects
   * @returns void
   * @description Logic behind the load process
   */
  loadObjects: function (outputScripts, outputStyles, scriptsId, stylesId) {
    var scripts = document.createElement("div");
    var styles = document.createElement("div");

    scripts.id = scriptsId;
    styles.id = stylesId;

    for (
      var outputScriptEntry = 0;
      outputScripts.length > outputScriptEntry;
      outputScriptEntry++
    ) {
      var outputScript = outputScripts[outputScriptEntry];
      var script = this.createObjectElement("script", outputScript, "");

      if (script) {
        script.onload = (function (entry) {
          return function () {
            outputScripts[entry].loaded = true;
            this.checkBundleStatus();
          };
        })(outputScriptEntry).bind(this);

        script.onerror = (function (entry) {
          return function () {
            outputScripts[entry].error = true;
            this.checkBundleStatus();
          };
        })(outputScriptEntry).bind(this);

        scripts.appendChild(script);
      }
    }

    for (
      let outputStyleEntry = 0;
      outputStyles.length > outputStyleEntry;
      outputStyleEntry++
    ) {
      var outputStyle = outputStyles[outputStyleEntry];
      var style = this.createObjectElement("style", outputStyle, "");

      if (style) {
        style.onload = (function (entry) {
          return function () {
            outputStyles[entry].loaded = true;
            this.checkBundleStatus();
          };
        })(outputStyleEntry).bind(this);

        style.onerror = (function (entry) {
          return function () {
            outputStyles[entry].error = true;
            this.checkBundleStatus();
          };
        })(outputStyleEntry).bind(this);

        styles.appendChild(style);
      }
    }

    document.body.appendChild(scripts);
    document.body.appendChild(styles);
  },
};
