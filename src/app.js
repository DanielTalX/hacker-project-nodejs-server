const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotnev = require('dotenv');

const ServerSettings = require('./settings/ServerSettingsDev');
const sessionManagementConfig = require('./config/sessionsManagementConfig');
const responseHeaderConfig = require('./config/responseHeaderConfig');
const staticResourcesConfig = require('./config/staticResourcesConfig');
const headerCheckConfig = require('./config/headerCheckConfig');
const routes = require('./config/apiRoutesConfig');
const { initialize } = require('./mock-data/initializationTasks');

dotnev.config();

const app = express();
app.disable('x-powered-by');

// middleware
sessionManagementConfig(app);
responseHeaderConfig(app);
staticResourcesConfig(app);

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json({
    limit: ServerSettings.bodyLimit
}));

// parse cookies - we need this because "cookie" is true in csrfProtection
app.use(cookieParser());
app.use(headerCheckConfig());

// api routes /api/cs v1
app.use('/api/cs', routes);

// send files - in order to run dist
app.use(express.static(path.resolve(ServerSettings.directoryUrl)));
app.get('*', (req, res) => {
    res.sendFile(path.join(ServerSettings.indexHtmlUrl));
});

initialize()
    .then(function () {
        const listener = app.listen(ServerSettings.port, function () {
            console.log('Started server on port ' + listener.address().port);
            console.log(`App running on http://localhost:${ServerSettings.port}`)
        });
    })
    .catch(function (err) {
        console.log(err);
    });

