/**
 * @constructor DSOLoader
 * @param {DSOConfig} dsoConfig
 * @param {DSOPing} dsoPing
 * @param {boolean} debug
 */
export var DSOLoader = function (
  dsoConfig = undefined,
  dsoPing = undefined,
  debug = false
) {
  /*
   * Global declarations
   */
  this.debug = debug;

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
 * @name DSOLoader.prototype.createObjectElement
 * @param {string} type
 * @param {object} objectElement
 * @param {string} id
 * @param {function () => void} success
 * @param {function () => void} error
 * @returns object
 */
DSOLoader.prototype = {
  createObjectElement: function (type, objectElement, id, success, error) {
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

    //if (typeof id === "string") {
    //  element.setAttribute("id", id);
    //}

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
          input[inputEntry].accepted === true
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
    return this.createLoadObjects(
      this.dsoConfig.modules,
      this.moduleScripts,
      this.moduleStyles,
      "moduleids"
    );
  },

  /**verifyLoadedBundles
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
            this.dsoConfig.bundles[configBundle].userAgent.test(
              this.userAgent
            ) === false
          ) {
            pass = false;
          }
        }

        if (pass) {
          /* Fallover mode will just load the non-interactive bundles */
          if (
            fallover === true &&
            this.dsoConfig.bundles[configBundle].threshold ===
              this.dsoConfig.nonInt
          ) {
            accepted = true;
            /* Load only interactive modules */
          } else if (
            stdInt === true &&
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

        if (accepted === true) {
          if (this.debug) {
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
          if (this.debug) {
            console.log(this.dsoConfig.bundles[configBundle]);
            console.log("Unaccepted bundle");
          }
          this.dsoConfig.bundles[configBundle].unaccepted = true;
        }
      }
    }

    /**
     * If stream mode is set let's check the current set of bundles and load the next volly of bundles if needed
     * Note: this may become recursive in the future to account for custom thresholds after interactive but
     * for now we stop at just interactive mode defined under DSOLoader.prototype.loadInteractive() */
    if (this.dsoConfig.stream) {
      var interactive = true;
      var bundleLength = 0;

      for (
        var bundleConfig = 0;
        this.dsoConfig.bundles.length > bundleConfig;
        bundleConfig++
      ) {
        if (
          typeof this.dsoConfig.bundles[bundleConfig].accepted !== "undefined"
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

      if (interactive === true && bundleLength > 0) {
        for (
          bundleConfig = 0;
          this.dsoConfig.bundles.length > bundleConfig;
          bundleConfig++
        ) {
          if (
            typeof this.dsoConfig.bundles[bundleConfig].accepted !== "undefined"
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
   *        Note: The counter allows for all bundles to be loaded, we should make it so we can
   *         dedicate its own variable to each group but for now we'll just rely on this.liTally
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
      /* Note that simply reloading createBundleHierarchy which should filter out any of the already loaded bundles
       * What needs to happen here is something different, we need to set a mode that forces only interactive
       * to load leaving the upper thresholds */
      if (this.defineBundleAcceptance(false, true)) {
        this.loadBundles();
      }
    }
  },

  /**
   * @name DSOLoader.prototype.checkObjectStatus
   * @param {object} object
   * @param {object[]} outputScripts
   * @param {object[]} outputStyles
   * @param {string} ids
   * @returns boolean
   * @description Used to check the callback of an object being loader
   */
  checkObjectStatus: function (object, outputScripts, outputStyles, ids) {
    var nonInteractive = false;
    var stdInteractive = false;
    var customThreshold = false;

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
          typeof object[objectEntry].scriptsLoaded === "boolean" &&
          object[objectEntry].scriptsLoaded &&
          typeof object[objectEntry].stylesLoaded === "boolean" &&
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

      switch (object[objectEntry].threshold) {
        case this.dsoConfig.nonInt:
          if (
            typeof object[objectEntry].loaded === "boolean" &&
            object[objectEntry].loaded
          ) {
            nonInteractive = true;
          } else {
            nonInteractive = false;
          }
          break;

        case this.dsoConfig.stdInt:
          if (
            typeof object[objectEntry].loaded === "boolean" &&
            object[objectEntry].loaded
          ) {
            stdInteractive = true;
          } else {
            stdInteractive = false;
          }
          break;

        default:
          if (
            typeof object[objectEntry].loaded === "boolean" &&
            object[objectEntry].loaded
          ) {
            customThreshold = true;
          } else {
            customThreshold = false;
          }
          break;
      }
    }

    // Group Callbacks
    if (nonInteractive && !this.dsoConfig.onNonInteractiveLoaded) {
      if (typeof this.dsoConfig.onNonInteractiveLoad === "function") {
        this.dsoConfig.onNonInteractiveLoad();
      }
      this.dsoConfig.onNonInteractiveLoaded = true;
    }
    if (stdInteractive && !this.dsoConfig.onInteractiveLoadLoaded) {
      if (typeof this.dsoConfig.onNonInteractiveLoad === "function") {
        this.dsoConfig.onInteractiveLoad();
      }
      this.dsoConfig.onInteractiveLoadLoaded = true;
    }
    if (customThreshold && !this.dsoConfig.onCustomThresholdLoaded) {
      if (typeof this.dsoConfig.onCustomThresholdLoaded === "function") {
        this.dsoConfig.onCustomThresholdLoaded();
      }
      this.dsoConfig.onCustomThresholdLoaded = true;
    }

    return true;
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
   * @name DSOLoader.prototype.loadModules
   * @returns void
   */
  loadModules: function () {
    var scripts = document.createElement("div");
    var styles = document.createElement("div");

    scripts.id = "dsoModuleScripts";
    styles.id = "dsoModuleStyles";

    for (
      var moduleScriptEntry = 0;
      this.moduleScripts.length > moduleScriptEntry;
      moduleScriptEntry++
    ) {
      var moduleScript = this.moduleScripts[moduleScriptEntry];
      var script = this.createObjectElement("script", moduleScript, "");

      if (script) {
        script.onload = script.onreadystatechange = function () {
          moduleScript.load = true;
          this.checkModuleStatus();
        }.bind(this);

        script.onerror = function () {
          moduleScript.error = true;
          this.checkModuleStatus();
        }.bind(this);

        scripts.appendChild(script);
      }
    }

    for (
      moduleScriptEntry = 0;
      this.moduleStyles.length > moduleScriptEntry;
      moduleScriptEntry++
    ) {
      var moduleStyle = this.moduleStyles[moduleScriptEntry];
      var style = this.createObjectElement("style", moduleStyle, "");

      if (style) {
        style.onload = style.onreadystatechange = function () {
          moduleStyle.loaded = true;
          this.checkModuleStatus();
        }.bind(this);

        style.onerror = function () {
          moduleStyle.error = true;
          this.checkModuleStatus();
        }.bind(this);

        styles.appendChild(style);
      }
    }

    document.body.appendChild(scripts);
    document.body.appendChild(styles);
  },

  /**
   * @name DSOLoader.prototype.loadBundles
   * @returns void
   * @description Logic for the load process
   */
  loadBundles: function () {
    var scripts = document.createElement("div");
    var styles = document.createElement("div");

    scripts.id = "dsoBundleScripts";
    styles.id = "dsoBundleStyles";

    for (
      var bundleScriptEntry = 0;
      this.bundleScripts.length > bundleScriptEntry;
      bundleScriptEntry++
    ) {
      var bundleScript = this.bundleScripts[bundleScriptEntry];
      var script = this.createObjectElement("script", bundleScript, "");

      if (script) {
        script.onload = (function (entry) {
          return function () {
            this.bundleScripts[entry].loaded = true;
            this.checkBundleStatus();
          };
        })(bundleScriptEntry).bind(this);

        script.onerror = (function (entry) {
          return function () {
            this.bundleScripts[entry].error = true;
            this.checkBundleStatus();
          };
        })(bundleScriptEntry).bind(this);

        scripts.appendChild(script);
      }
    }

    for (
      let bundleStyleEntry = 0;
      this.bundleStyles.length > bundleStyleEntry;
      bundleStyleEntry++
    ) {
      var bundleStyle = this.bundleStyles[bundleStyleEntry];
      var style = this.createObjectElement("style", bundleStyle, "");

      if (style) {
        style.onload = (function (entry) {
          return function () {
            this.bundleStyles[entry].loaded = true;
            this.checkBundleStatus();
          };
        })(bundleStyleEntry).bind(this);

        style.onerror = (function (entry) {
          return function () {
            this.bundleStyles[entry].error = true;
            this.checkBundleStatus();
          };
        })(bundleStyleEntry).bind(this);

        styles.appendChild(style);
      }
    }

    document.body.appendChild(scripts);
    document.body.appendChild(styles);
  },
};
