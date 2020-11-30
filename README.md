<h1>Device Streaming Object Loader (DSO Loader)</h1>

<h2>For Progressive Web Applications (PWA)</h2>

<i>Previously named Network Performance Kernel (NPK)</i>

<h2>Introduction</h2>

In line with Progressive Web Application (PWA) technologies. I present the Device Streaming Object Library (DSO Loader) as an all-in-one resource and performance management environment for dynamic code and resource delivery.

DSO Loader is designed to be a lightweight service that tracks the networks' link performance in order to provide the most efficient and effective Quality of User Experience (QoUE).

One of the DSO Loader's key functions will be to as early as possible in the application's initial download phase is determine the current network speed and signal a slow or fast download rate in KiloBytes per second (KBps) and then offer various strategies to enrich the QoUE.

If the DSO Loader detects a slow KBps download rate, instead of downloading the entire interactive experience. DSO Loader will begin downloading the low interactive version of the site which will have reduced or no user interactive functionality. 

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

<h2>DSO Loader architecture</h2>

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

<h2>Developer notes</h2>

Since, this project is still very much in its early stages, this lib only currently works as a bare-bones solution or as a manual implemation. This is will change as soon as the code base reaches maturity, where offering it as a practical real world solution becomes feesible.

The eventual outcome of this project will be to maintain compatability with most popular development environments by operating as a Webpack module or plugin. Further, the aim will be to offer the ability to seemly connect with most popular front-end frameworks such as React, Angular and Vue, etc. 

<h3>Code structure semantics</h3>

The DSO Loader has been built in native ES5, the reason why is because I wanted to maintain as much granular control over the code base as possible. Meanwhile, being as compatabile as possible at the time. I.E being able to support as many legacy devices and platforms without causing errors or exceptions while at the same time being able to control the footprint size as I develop.

The idea of building DSO in Typescript and transpiling it down has always been something worth considering, however, I find working directly with ES5 allows me to keep an eye on payload size, which for the DSO Loader will be cruical.

<h3>Payload footprint</h3>

In order for the library to be affective the entire inital payload size or the First Byte payload should try to be under about 20k compiled (approx), which includes the sites AppShell and the DSO Loader. Please see my <a href="">blog article</a> discussing in depth, breaking down benchmarks and the overall <i>efficacy</i> of the footprint strategy and design.

<h3>Initialisation process</h3>
	
Network processor performance initialisation

<ul>
	<li>Request a small data object such as a image or file.</li>
	<li>Use the last recorded KBps rate to decide on bundling.</li>
	<li>Contine to download other bundles in the background after the inital download offering.</li>
</ul>

Request bundling based on KB/s thresholds (async)

Service Worker intialisation and caching (async)

<ul>
	<li>If the KBps threshold is passed then load the relevant bundle in varied experience bands as per DSO Loader's configuration</li>
	<li>If the KBps threshold has falls below minimum level then load low interactive mode</li>
</ul>

<h3>Listeners</h3>

<b>on Experience</b> - CSS/Javascript bundle has loaded<br />
<b>on CSS Bundle load</b> - as above<br />
<b>on JavaScript Bundle load</b> - as above

<h3>Other enhancements and ideas</h3>

Lazy Load Bundles (scrolling)<br />
eventHandler (onclick) loads

<h3>Demo site</h3>

Please see the following <a href="">demo site</a>.

<h3>Use case discussion</h3>

Please see the following <a href="">blog article</a> discussing use cases and implmentation semantics behind the DSO Loader.

<h3>Project related enquires</h3>

Feel free to contact me via email <a href="mailto:jamestbiv@gmail.com">jamestbiv@gmail.com</a> for any general related enquries or discussions.