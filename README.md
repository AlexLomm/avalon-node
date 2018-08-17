##### to deploy on **Linux**
* go to project's root directory
```bash
cd %/path/to/this/project%
```

* copy service file from .dist and edit
```bash
cp linux-service/avalon-nodejs.service.dist linux-service/avalon-nodejs.service
nano config/avalon-nodejs.service
```

* enable new service and start
```bash
mv linux-service/avalon-nodejs.service /lib/systemd/system/avalon-nodejs.service
systemctl enable avalon-nodejs.service
service avalon-nodejs start
```
