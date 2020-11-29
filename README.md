<h1>Device Streaming Object Loader (DSO Loader)</h1>

<h2>For Progressive Web Applications (PWA)</h2>

<i>Previously named Network Performance Kernel (NPK)</i>

<h2>Introduction</h2>

In line with Progressive Web Application (PWA) technologies. I present the Device Streaming Object Library (DSO Loader) as an all-in-one resource and performance management environment for dynamic code and resource delivery.

DSO Loader is designed to be a lightweight service that tracks the networks' link performance in order to provide the most efficient and effective quality of user experience (QoUE).

One of the DSO Loader's key functions will be to as early as possible in the application's initial download phase is determine the current network speed and signal a slow or fast download rate in Kilobytes per second (Kbps) and then offer various strategies to enrich the QoUE.

If the DSO Loader detects a slow Kpbs download rate, instead of downloading the entire interactive experience. DSO Loader will begin downloading the low interactive version of the site which will have reduced or no user interactive functionality. 

Meanwhile, the full responsive and interactive rich online experience is progressively downloaded in the background. Ideally if the connection strength is rated well, the rich experience is directly offered. Further if frameworks and libraries cross over between both states, these libraries will be shared.

The areas in which DSO Loader can deliver functional advantages are

<ul>
<li>Progressively load the full interactive experience while offering the low interactive version in the interim.</li>
<li>Grouped deferred and asynchronous CSS delivery.</li>
<li>Grouped deferred JavaScript module/library delivery.</li>
</ul>

Possible advancements in features could include modularisation, however, the main drawback will be purpose and download footprint when other parts of the DSO Loader would be better suited. However, some parts that could be considered useful for asynchronously retrieved or even direct modularisation would include the following.

<b>Global performance functions / tool sets</b> - E.G Create a lazy loading algorithm that decides whether to lazy load images based on connection quality rather than viewport.

<b>ServiceWorker event listing and frameworking</b> - The DSO Loader can allow for a global interface for device level interactions. Such features can include, structure based cache management; or push notification handlers and services.</p>

<h2>DSO Loader Architecture</h2>

DSO Loader is broken down into the following key areas

<ol type="i">
<li>Network (and processor) performance</li>
<li>Library bundling and configuration</li>
<li>Prioritisation of initialisation<l/i>
<li>Concise and asynchronous object download</li>
</ol>

<h3>i. Network (and processor) performance</h3>

Network and processor performance will be a fairly simple interaction between <a href="https://www.w3.org/TR/resource-timing/#resource-timing">Resource Timing</a> and calculating the download rate of an incoming result or ping test and then using the download rate in Kbps to decide an appropriate download strategy.

<h3>ii. Library bundling and configuration</h3>

Being able to choose what Javascript/CSS files are downloaded with what bundle version by a defined download rate. 

<em>Note: the threshold will be configurable.</em>

<ol type="a">
<li>low interactive</li>
<li>full interactive</li>
<li>custom download threshold</li> 
</ol>

<h3>iii. Prioritisation of initialisation</h3>

The following strategies can take place if the the rate of download is not met. 

<ol type="a">
<li>Ask to download the full interactive in the background</li>
<li>Assume to download the full interactive in the background</li>
<li>Once the download is met ask to show the full interactive mode</li>
<li>Ask other custom thresholds to be download</li>
<li>Automatically step custom thresholds once full interactive has loaded or vice-versa</li>
</ol>

<h3>iv. Concise and asynchronous object download</h3>

All object downloads should be handled in a way that allows for maximum download efficiency and reuse. Javascript/CSS libraries will be cross shared and layered allowing for reuse whenever possible.

<h2>Developer Notes</h2>

<h3>Footprint</h3>

In order for the library to work the footprint needs to stay under about 50k compiled (approx).

<h3>Initialisation Process</h3>
	
Network processor performance initialisation

<ul>
	<li>Request a small data object such as a image or file.</li>
	<li>Use the last recorded Kpbs rate to decide on bundling.</li>
	<li>Contine to download other bundles in the background after the inital download offering.</li>
</ul>

Init service worker and start caching (asynch)

Request bundling based on Kb/s thresholds (asynch)

<ul>
	<li>If the kbps threshold is passed load the relevant bundle in varied experience bands if needed</li>
	<li>If the kbps threshold has falls below minimum load low interactive mode</li>
</ul>

<h3>Listeners</h3>

<b>on Experience</b> - CSS/Javascript bundle has loaded<br />
<b>on CSS Bundle load</b> - as above<br />
<b>on JavaScript Bundle load</b> - as above

<h3>Other enhancements and ideas</h3>

Lazy Load Bundles (scrolling)<br />
eventHandler (onclick) loads
