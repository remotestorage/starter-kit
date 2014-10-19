remoteStorage Starter Kit
=========================

This starter-kit is the quickest way to get started with remoteStorage app
development. It gives you a local remoteStorage server and a Hello World app
as your starting point.

In order to run it, you need
[node.js](http://nodejs.org/download/) installed.

First, save this starter-kit into a folder on your computer, by downloading
and unpacking https://github.com/remotestorage/starter-kit/archive/master.zip
or by cloning this repository using git.

Then, open a command-line terminal, and type:

    cd starter-kit
    npm install
    
to install the dependencies (where `starter-kit` is the folder you unpacked from
the download or with git).

This starter-kit contains three things, baked into one:

  * a remoteStorage server, which you can use as `me@localhost:8001`
  * a launch screen, which you can open at `http://localhost:8002/`
  * some sample app, in the `apps/` folder (where the launch screen preloads from).

To launch all three, you only need to type one command:

    node starter-kit


### Next steps

* Visit `http://localhost:8002/` and click on one of the icons
* Open the web console (Ctrl-Shift-K in FF, Ctrl-Shift-I in Chrome, F12 in IE)
* There are now various server origins interacting:
  * the API of your remoteStorage server is on http://localhost:8000/storage/me/
  * the html page you used with the links to the apps runs on http://localhost:8002/
  * the actual apps run on http://localhost:8003/, http://localhost:8004/, etc.
* see how the AJAX requests go to the remoteStorage API on port 8000, which is different
    from the origin of the app you are viewing. It is a cross-origin AJAX request.
* This is of course useless if it's on the same host, but you can see how this is
    a powerful architecture change if not only the port but also the domain name
    differs between the app and the storage: netizens can host their own data on
    their own server, instead of on the application provider's server. See
    https://unhosted.org/ and http://nobackend.org/ for more info about this revolution.
* Inspect the application code in `apps/hello-world/index.html` using your favorite editor
* Inspect the `remoteStorage.notes` code in `apps/hello-world/notes.js`
* Read the docs on http://remotestorage.io/integrate/
* Hack! :) Copy and rename the `apps/hello-world/` folder to e.g. `apps/my-first-unhosted-app/`
* The starter-kit will detect each folder you create under `apps/` at startup, and add
    it to the launch screen on `http://localhost:8002/` (make sure to restart `node starter-kit`
    each time you edit your app on disk).
* Post your reactions and questions on 
    http://community.remotestorage.io/category/getting-started
* TIP: if you had trouble installing, this [screencast](//www.youtube.com/embed/eGNJRyb5iJs) may help.

### Web authoring

The starter-kit also supports cloning apps from elsewhere, as long as those apps are hosted with CORS,
and have an `assets` array in their manifest. At the bottom of the portal page, you will see a big blue
"INSTALL NEW UNHOSTED WEB APPS" button. Currently, only the 'my favorite drinks' app is available there
for cloning, as a demo, but you could add your own app in two ways:

* by sending a pull request to https://github.com/unhosted/store/blob/master/defaultApps.json
* by specifying a different app channel URL than the default https://apps.unhosted.org/defaultApps.json

Just make sure the manifest contains an 'assets' array, otherwise it will not be clonable. Since you have
full control over your remoteStorage data, you can also edit apps after you cloned them. To see this in
action, type:

````js
remoteStorage.www.storeFile('8003', 'text/html', 'index.html',
    '<html><h2>editing my app!</h2></html>');
````

in the console while on the portal page, and then visit http://localhost:8003/ to see the result. Web authoring
is a new optional feature of the remoteStorage spec, which we have been talking about for several years now (also
in the context of [Read-Write Web](http://www.w3.org/community/rww/), and whose development was funded by NLNet.
The new spec describing it (version 04) will come out in December 2015, and it has been added as an *optional*
feature, meaning not all server implementations and storage providers may support it. Whether or not the currently
connected account supports web authoring can be detected through `remoteStorage.remote.properties`, which will be
supported by remotestorage.js 0.11 and up.
