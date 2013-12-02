remoteStorage Starter Kit
=========================

This dev kit is the quickest way to get started with remoteStorage app
development. It gives you a local remoteStorage server and a Hello World app as
your starting point.

In order to run the example server, you need
[node.js](http://nodejs.org/download/) with NPM installed.

First, install the dependencies with:

    npm install

This starter kit contains three things, baked into one:

  * a remoteStorage server, which you can use as `me@localhost`
  * a launch schreen, which you can open at `http://localhost/`
  * a "hello-world" app, in the `apps/` directory (where the launch screen detects it).

To launch all three, you only need to type one command:

    sudo node starter-kit


### Next steps

* Visit `http://localhost/` and click on the "hello-world" link
* Open the web console (Ctrl-Shft-K in FF, Ctrl-Shft-I in Chrome, F12 in IE)
* see how the hello-world app runs on port 8001, yet the AJAX requests go to your storage
    for `me@localhost`, on port 80.
* Inspect the application code in `apps/hello-world/index.html` using your favorite editor
* Inspect the `remoteStorage.notes` code in `apps/hello-world/notes.js`
* Read the docs on http://remotestorage.io/integrate/
* Copy and rename the `apps/hello-world/` directory to e.g. `apps/my-first-unhosted-app/`
* The starter-kit will detect each directory you create under `apps/` at startup, and add
    it to the launch screen on `http://localhost/`
* Post your reactions and questions on 
    http://community.remotestorage.io/categories/getting-started
