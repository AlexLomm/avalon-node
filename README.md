### To deploy on **Linux**

Install node.js and the projects dependencies. 

Go to the project's root directory:

```bash
cd %/path/to/this/project%
```

Copy the service file and edit it:

```bash
cp linux-service/avalon-nodejs.service.dist linux-service/avalon-nodejs.service
nano config/avalon-nodejs.service
```

Enable the new service and start it:

```bash
mv linux-service/avalon-nodejs.service /lib/systemd/system/avalon-nodejs.service
systemctl enable avalon-nodejs.service
service avalon-nodejs start
```
