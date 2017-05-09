Start mongo server process
$> sudo  mongod

check db
$> mongo
>db.user.find()

start node server
$> node app.js

check db from browser
localhost:3000/user/list

test insert
$>wget http://localhost:3000/user/create \
  --header='content-type: application/json' \
  --post-data='{"name":"Betty",
    "css_map":{"background-color":"#ddd",
    "top" : 22, "left" : 500 }
  }' -O -
