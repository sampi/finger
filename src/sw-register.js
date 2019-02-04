if (!navigator.serviceWorker.controller) {
	//Register the ServiceWorker
	navigator.serviceWorker.register('/sw.js', {
		scope: '/'
	});
}
