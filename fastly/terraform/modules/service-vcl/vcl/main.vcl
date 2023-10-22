# The Fastly VCL boilerplate.
include "breadcrumbs.vcl";

sub vcl_recv {
	#FASTLY RECV

	# Give every request a unique ID.
	if (!req.http.X-Request-Id) {
		set req.http.X-Request-Id = digest.hash_sha256(now randomstr(64) req.http.host req.url req.http.Fastly-Client-IP server.identity);
	}

	# Enable API key authentication for URL purge requests
	if ( req.method == "FASTLYPURGE" ) {
		set req.http.Fastly-Purge-Requires-Auth = "1";
	}

	# Sets the alt-svc header on the client response.
	# When a client connection is using a version of HTTP older than HTTP/3,
	# invoking this function triggers Fastly to advertise HTTP/3 support,
	# on the eventual client response, allowing the client to switch to HTTP/3 for future requests.
	h3.alt_svc();

	if (req.http.Fastly-Debug) {
		call breadcrumb_recv;
	}

	if (req.restarts == 0) {
		set req.backend = F_compute_at_edge;
	} else {
		set req.backend = F_fly;
	}

	if (req.method != "HEAD" && req.method != "GET" && req.method != "FASTLYPURGE") {
		return (pass);
	}

	return (lookup);
}

sub vcl_hash {
	if (req.http.Fastly-Debug) {
		call breadcrumb_hash;
	}
}

sub vcl_hit {
#FASTLY hit
/*
	if (!obj.cacheable) {
		return(pass);
	} */
	return (deliver);
}

sub vcl_miss {
	#FASTLY miss
	if (req.http.Fastly-Debug) {
		call breadcrumb_miss;
	}
	return (fetch);
}

sub vcl_pass {
	if (req.http.Fastly-Debug) {
		call breadcrumb_pass;
	}
}

sub vcl_fetch {
	# Serve stale objects on a backend error.
	if (http_status_matches(beresp.status, "500,502,503,504")) {
		if (stale.exists) {
			return(deliver_stale);
		}

		if (req.restarts < 1 && (req.method == "GET" || req.method == "HEAD")) {
			restart;
		}
	}

	#FASTLY fetch

	if (req.restarts > 0) {
		set beresp.http.Fastly-Restarts = req.restarts;
	}


	if (req.http.Fastly-Debug) {
		call breadcrumb_fetch;
	}
	return (deliver);
}

sub vcl_deliver {
#FASTLY deliver

	if (req.http.Fastly-Debug) {
		call breadcrumb_deliver;
	}

	add resp.http.Server-Timing = fastly_info.state {", fastly;desc="Edge time";dur="} time.elapsed.msec;

	if (req.http.Fastly-Debug) {
		set resp.http.Debug-Backend = req.req.backend;
		set resp.http.Debug-Host = req.http.Host;
		set resp.http.Debug-Fastly-Restarts = req.restarts;
		set resp.http.Debug-Orig-URL = req.http.Orig-URL;
		set resp.http.Debug-VCL-Route = req.http.X-VCL-Route;
	} else {
		unset resp.http.Server;
		unset resp.http.Via;
		unset resp.http.X-Cache;
		unset resp.http.X-Cache-Hits;
		unset resp.http.X-Served-By;
		unset resp.http.X-Timer;
		unset resp.http.Fastly-Restarts;
		unset resp.http.X-PreFetch-Pass;
		unset resp.http.X-PreFetch-Miss;
		unset resp.http.X-PostFetch;
	}
	return (deliver);
}

sub vcl_error {
	#FASTLY error

	if (http_status_matches(obj.status, "500,502,503,504")) {
		if (stale.exists) {
			return(deliver_stale);
		} else if (req.restarts == 0) {
			restart;
		}
		return(deliver);
	}
}

sub vcl_pass {
#FASTLY pass
}

sub vcl_log {
#FASTLY log
}
