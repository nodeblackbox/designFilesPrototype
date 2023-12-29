#!/bin/bash

# Define the functionalities
functionalities=("admin" "affiliate" "api" "auth" "blog" "contact" "courses" "gallery" "home" "plans" "shop" "user")

# Create files for each functionality
for func in "${functionalities[@]}"
do
    # Create Controller
    echo -e "// $func""Controller.js\n\nexports.getAll = (req, res) => {\n\t// Logic to get all $func entries\n};\n\nexports.add = (req, res) => {\n\t// Logic to add a new $func entry\n};\n\nexports.viewDetail = (req, res) => {\n\t// Logic to view detailed $func entry\n};" > "controllers/$func""Controller.js"

    # Create Model
    echo -e "// $func""Model.js\nconst db = require('../config/dbConfig.js');\n\nexports.fetchAll = () => {\n\t// Logic to interact with DB and get all $func entries\n};\n\nexports.insert = (postData) => {\n\t// Logic to insert a new $func entry into the DB\n};\n\nexports.getDetail = (postId) => {\n\t// Logic to fetch detailed $func entry from DB\n};" > "models/$func""Model.js"

    # Create Routes
    echo -e "// $func""Routes.js\nconst express = require('express');\nconst router = express.Router();\nconst ${func}Controller = require('../controllers/$func""Controller');\n\nrouter.get('/$func', ${func}Controller.getAll);\nrouter.get('/$func/add', ${func}Controller.add);\nrouter.get('/$func/:id', ${func}Controller.viewDetail);\n\nmodule.exports = router;" > "routes/$func""Routes.js"
done

# Update the main index.js to include these routes
echo "const express = require('express');" > index.js
echo "const app = express();" >> index.js

for func in "${functionalities[@]}"
do
    echo "const ${func}Routes = require('./routes/$func""Routes');" >> index.js
done

echo "// ... (other setup like middleware, view engine, static directories) ..." >> index.js

for func in "${functionalities[@]}"
do
    echo "app.use('/$func', ${func}Routes);" >> index.js
done

echo "// Start the app\nconst port = process.env.PORT || 3000;\napp.listen(port, () => {\n\tconsole.log(\`Listening on port \$port\`);\n});" >> index.js
