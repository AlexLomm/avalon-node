### To deploy on **Linux**

Install node.js and the projects dependencies. 

1. Go to the project's root directory:
    ```bash
    cd %/path/to/this/project%
    ```

2. Copy your `public.pem` and `private.pem` keys into the `./config/jwt/` folder.

3. Copy the service file and edit it:

    ```bash
    cp linux-service/avalon-nodejs.service.dist linux-service/avalon-nodejs.service
    nano config/avalon-nodejs.service
    ```

4. Enable the new service and start it:

    ```bash
    mv linux-service/avalon-nodejs.service /lib/systemd/system/avalon-nodejs.service
    systemctl enable avalon-nodejs.service
    service avalon-nodejs start
    ```
