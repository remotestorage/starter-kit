remoteStorage Starter Kit
=========================

This dev kit is the quickest way to get started with remoteStorage app
development. It gives you a local remoteStorage server and a Hello World app as
your starting point.

In order to run the example server, you need
[node.js](http://nodejs.org/download/) with NPM installed.

First, save this starter-kit into a folder on your computer, by downloading
and unpacking https://github.com/remotestorage/starter-kit/archive/master.zip
or by cloning this repository using git.

Then, open a command line terminal, and inside the starter-kit directory, install
the dependencies by running:

    npm install

This starter kit contains three things, baked into one:

  * a remoteStorage server, which you can use as `me@localhost:8001`
  * a launch schreen, which you can open at `http://localhost:8001/`
  * a "hello-world" app, in the `apps/` folder (where the launch screen detects it).

To launch all three, you only need to type one command:

    sudo node starter-kit


### Next steps

* Visit `http://localhost/` and click on the "hello-world" link
* Open the web console (Ctrl-Shft-K in FF, Ctrl-Shft-I in Chrome, F12 in IE)
* see how the hello-world app runs on port 8002, yet the AJAX requests go to your
    storage for `me@localhost:8001`, on port 8001.
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
    it to the launch screen on `http://localhost/`
* Post your reactions and questions on 
    http://community.remotestorage.io/categories/getting-started
