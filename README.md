starter kit
===========

the quickest way to get started with a local remoteStorage server and a Hello World app as your starting point:


````shell
    npm install
    sudo node starter-kit
````

and then visit http://localhost/

notes:
- because the dev kit runs WebFinger on port 80, you need to run as root

next steps:
- you will see the storage running on port 80 and the apps on one port each, starting at 8001.
- look at this with your developer console open.
- `cd apps/; cp -r minimal-example my-app; cd my-app/` and edit away!
- read the docs on http://remotestorage.io/integrate/
