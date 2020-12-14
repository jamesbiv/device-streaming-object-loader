<h1>Device Streaming Object Loader (DSO Loader)</h1>

<h2><em>For Progressive Web Applications (PWA)</em></h2>

<h2>Introduction</h2>

In line with Progressive Web Application (PWA) technologies. I present the Device Streaming Object Library (DSO Loader) as an all-in-one resource and performance management environment for dynamic code and resource delivery.

The DSO Loader is designed to be a lightweight service that tracks the networks' link performance in order to provide the most efficient and effective Quality of User Experience (QoUE).

One of the DSO Loader's key functions will be is the ability to determine the current network speed as early as possible in the initial download phase, and signal a slow or fast download rate in KiloBytes per second (KBps) and then offering various strategies to enrich the QoUE.

If the DSO Loader detects a slow KBps download rate, instead of downloading the entire interactive site or experience. The DSO Loader will begin downloading a low or non interactive version of the site, which will have reduced or no user interactive functionality.

Meanwhile, the full responsive interactive online experience can be progressively downloaded in the background based on DSO's configuration. Ideally, if the connection strength is rated well, the interactive experience is directly offered. Further, if frameworks and libraries cross over between both states, these libraries will be shared or what is defined in configuration as 'inherited' libraries.

The areas in which DSO Loader can deliver functional advantages are:

<ul>
<li>Progressively load the full interactive experience while offering the low interactive version during the interim.</li>
<li>Grouped deferred and asynchronous CSS delivery.</li>
<li>Grouped deferred JavaScript module/library delivery.</li>
</ul>

Possible advancements in features could include modularisation, however, the main drawback will be purpose and download footprint when other parts of the DSO Loader which would be better suited. However, some parts that could be considered useful for asynchronously retrieved or even direct modularisation could include the following.

<b>Global performance functions / tool sets</b> - E.G Create a lazy loading algorithm that decides whether to lazy load images based on connection quality rather than viewport.

<b>ServiceWorker event listening and frameworking</b> - The DSO Loader can allow for a global interface for device level interactions. Such features can include, structure based cache management; or push notification handlers and services.</p>

<h2>DSO Loader architecture</h2>

DSO Loader is broken down into the following key areas

<ol type="i">
<li>Network (and processor) performance</li>
<li>Library bundling and configuration</li>
<li>Prioritisation of initialisation<l/i>
<li>Concise and asynchronous object download</li>
</ol>

<h3>i. Network (and processor) performance</h3>

Network and processor performance will be a fairly simple interaction between <a href="https://www.w3.org/TR/resource-timing/#resource-timing" target="_blank">Resource Timing</a> and calculating the download rate of an incoming result or ping test and then using the download rate in KBps to decide an appropriate download strategy.

<h3>ii. Library bundling and configuration</h3>

Being able to choose what Javascript/CSS files are downloaded with what bundle version by a defined download rate.

<em>Note: the threshold will be configurable.</em>

<ol type="a">
<li>low interactive</li>
<li>full interactive</li>
<li>custom download thresholds</li> 
</ol>

<h3>iii. Prioritisation of initialisation</h3>

The following strategies can take place if the download rate of download is not met.

<ol type="a">
<li>Ask to download the full interactive experience in the background</li>
<li>Assume to download the full interactive experience in the background</li>
<li>Once a download is met ask to show the full interactive mode</li>
<li>Ask other custom thresholds to be download</li>
<li>Automatically step custom thresholds once full interactive has loaded or vice-versa</li>
</ol>

<h3>iv. Concise and asynchronous object download</h3>

All object downloads should be handled in a way that allows for maximum download efficiency and reuse. Javascript/CSS libraries will be cross shared and layered allowing for reuse whenever possible.

<h2>Developer notes</h2>

This project is written as native <a href="http://ecma-international.org/ecma-262/5.1/" target="_blank">ES5.1 Compliant</a> JavaScript.

Also, this project is still very much in early stages, as this lib only currently works as a bare-bones solution or as a manual implementation. This will change as soon as the code base reaches maturity and offering it as a practical real world solution becomes feasible.

The eventual outcome of this project will be to maintain compatibility with most popular development environments by operating as a Webpack module or plugin. Further, the aim will be to offer the ability to seamlessly connect with most popular front-end frameworks such as React, Angular and Vue, etc.

<h3>Payload footprint</h3>

In order for the library to be effective the entire initial payload size or the First Byte payload should try to be under about 20KB compiled (approx) uncompressed, which includes the sites' AppShell and the DSO Loader. Please see my <a href="https://jamesbiv.tech/device-streaming-object-loader.pl">blog article</a> discussing in-depth, breaking down benchmarks and the overall <i>efficacy</i> of the footprint strategy and design.

<h3>Initialisation process</h3>
	
<h4>Network processor performance initialisation</h4>

<ul>
	<li>Request a small data object such as an image or file.</li>
	<li>Use the last recorded KBps rate to decide on bundling.</li>
	<li>Continue to download other bundles in the background after the initial download offering (optional).</li>
</ul>

<h4>Request bundling based on KB/s thresholds (async)</h4>

<ul>
	<li>If the KBps threshold is passed then load the relevant bundle in varied experience bands as per DSO Loader's configuration</li>
	<li>If the KBps threshold has falls below minimum level then load low interactive mode</li>
</ul>

<h4>Service Worker initialisation and caching (async) <em>(not implemented as of yet)</em></h4>

<h3>The following API Listeners</h3>

<ul>
<li><b>on Bundle Load</b> - Once A bundle has loaded</li>
<li><b>on Scripts Bundle load</b> - Once the JavaScript part of the bundle has loaded</li>
<li><b>on Styles Bundle load</b> - Once the CSS part of the bundle has loaded</li>
<li><b>on Threshold Load</b> - Once entire threshold has loaded</li>
<li><b>on Experience Load</b> - At what Experience the threshold been has loaded at</li>
</ul>

Please see the <a href="https://github.com/jamesbiv/device-streaming-object-loader/projects">project roadmap</a> for more details on future feature-sets.

<h3>Demo site</h3>

Please see the following <a href="https://jamesbiv.tech/demo/dsoloader/AppShell.html" target=˜_blank˜>demo site</a>.

To see the differences in network speed load  DevTools, visit <em>Networking</em> and switch between: Online, Fast 3G, and Slow 3G.

<!--
<h3>Use case discussion</h3>

Please see the following <a href="https://jamesbiv.tech/device-streaming-object-loader.pl"  target=˜_blank˜>blog article</a> discussing use cases and implementation semantics behind the DSO Loader.
-->

<h3>Project related enquiries</h3>

Feel free to contact me via email <a href="mailto:jamestbiv@gmail.com">jamestbiv@gmail.com</a> for any general related enquiries or discussions.
