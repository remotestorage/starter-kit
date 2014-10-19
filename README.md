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
  * a launch screen, which you can open at `http://localhost:8001/`
  * a "hello-world" app, in the `apps/` folder (where the launch screen detects it).

To launch all three, you only need to type one command:

    node starter-kit


### Next steps

* Visit `http://localhost:8001/` and click on the "hello-world" link
* Open the web console (Ctrl-Shift-K in FF, Ctrl-Shift-I in Chrome, F12 in IE)
* There are now various server origins interacting:
  * the API of your remoteStorage server is on http://localhost:8000/storage/me/
  * the html page you used with the links to the apps runs on http://localhost:8001/
  * the actual apps run on http://localhost:8002/, http://localhost:8003/, etc.
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
    it to the launch screen on `http://localhost:8001/`
* Post your reactions and questions on 
    http://community.remotestorage.io/category/getting-started
* TIP: if you had trouble installing, this [screencast](//www.youtube.com/embed/eGNJRyb5iJs) may help.

