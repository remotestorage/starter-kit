devkit
======

the quickest way to get started with a local remoteStorage server and a Hello World app as your starting point:


````shell
    npm install
    sudo node server.js
````

and then visit https://localhost/

notes:
- because WebFinger only works over port 443, we cannot let you run on a high port like 8000 or something like that.
- the cert is self-signed, you will need to accept it as an exception, twice (once on port 443, once on port 4431).
