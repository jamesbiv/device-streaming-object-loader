<h1>Network Performance Kernel (NPK) for Progressive Web Applications (PWA) </h1>

<h2>Introduction</h2>

In line with Progressive Web Application (PWA) technologies. I present the Network Performance Kernel (NPK) as an all-in-one resource and performance management environment for dynamic code and resource delivery.

NPK is designed to be a lightweight service that tracks the networks' link performance in order to provide the most efficient and effective quality of user experience (QoUE).

One of NPK's key functions will be to as early as possible in the application's initial download phase determine the current mean performance metric of the network speed and then signal a slow or fast download Kpbs rate and offer various strategies to enrich the QoUE.

If the NPK detects a slow Kpbs download rate, instead of downloading the entire interactive experience. NPK will begin downloading the low interactive version of the site which will have reduced or no user interactive functionality. 

Meanwhile, the full responsive and interactive rich online experience is progressively downloaded in the background. Ideally if the connection strength is rated well, the rich experience is directly offered. Further if frameworks and libraries cross over between both states, these libraries will be shared.

The areas in which NPK can deliver functional advantages are

<ul>
	<li>Progressively load the full interactive experience while offering the low interactive version in the interim.</li>
	<li>Grouped deferred and asynchronous CSS delivery.</li>
	<li>Grouped deferred JavaScript module/library delivery.</li>
</ul>

Possible advancements in features could include modularisation, however, the main drawback will be purpose and download footprint when other parts of the NPK would be better suited. However, some parts that could be considered useful for asynchronously retrieved or even direct modularisation would include the following.

<h2>Global performance functions / tool sets</h2>

For example: Create a lazy loading algorithm that decides weather to lazy load images based on connection quality rather than viewport. Or progressively step the download process in the same way as environment delivery.

<h3>ServiceWorker management</h3>

By saving the states of mobile centric data and offering them based on the service worker request handlers NPK can allow for a global way for these systems to interact independently. For example, structure based cache management; or push notification handlers and services.

<h3>NPK Architecture</h3>

NPK is broken down into the following key areas

<ol type="i">
<li>Network (and processor) performance</li>
<li>Library bundling and configuration</li>
<li>Prioritisation of initialisation<l/i>
<li>Advanced recursive download configuration</li>
</ol>

Network and processor performance 

Network and processor performance will be a fairly simple interaction between web standards performance[needs citation] and will simply store the mean states in various states and stages.

Library bundling and configuration

Being able to choose what Javascript/CSS files are downloaded with what bundle version by Download Rate. Note: the threshold will be configurable.

<ol type="a">
<li>low interactive</li>
<li>full interactive</li>
<li>custom download threshold</li> 
</ol>


Further the treatment of each mode if the threshold is not met.

a) Ask to download the full interactive in the background
b) Assume to download the full interactive in the background
c) Once the download is met ask to show the full interactive mode
d) Ask other custom thresholds to be download 
e) Automatically step custom thresholds once full interactive has loaded or vice-versa

Footprint

In order for the NPK to work the footprint needs to stay under about 64k compiled.

Flow
	
Network processor performance initialisation

- Grab the average of all objects downloaded, usually index file, init.js itself, manifest, favicon
- Continue to poll the average as objects download.

Init service worker and start caching (asynch)

Request bundling based on Kb/s thresholds (asynch)

- If the kbps threshold is passed load the relevant bundle in varied experience bands if needed
- If the kbps threshold has falls below minimum load low interactive mode

Listeners

on Experience - CSS/Javascript bundle has loaded
on CSS Bundle load - as above
on JavaScript Bundle load - as above

Other enhancements and ideas

Lazy Load Bundles (scrolling)
eventHandler (onclick) loads

Pseudo Breakdown

NPK Initilization

<code>
var kbps = Network.NetworkPerformanceAverage();

Bundle('lowinteractive' , 'interactive'| 0, 2000kpbs, 
	true | false, 
	Javascript Libs: 'vendor-angular', 'vendor-bootstrap', 'vendor-jquery',
	Javascript Apps: 'app.js', 'module.js'
	Javascript Init: 'init.js'
	Css Libs: 'vendor-boostrap'
	Css App: 'apps.css',
	Css Init: 'css-init.css');
	
ServiceWorkerCache(['app.js', expires], ['app.css', 100]);

ServiceWorkerCacheByType('image/jpeg', nocache);

if(kpbs > lowinteractive) {
 	forecach(interacitvemode) {
		if(kbps >= interactivemode) {
			DefineSelectedMode;
		}
	}
	RunSelectedMode;
}  else {
	RunLowInteractive;
	NotifyLowInteractive; // Inform that upon load full interactive will be available (optional)
} 
</code>
