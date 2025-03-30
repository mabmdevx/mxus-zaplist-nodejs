### ZapList
A checklist app written in NodeJS using MongoDB as the database

#### Features
- Signup new users to the app
- Session Management
- Create / update / delete Checklists
- Auto-save updates to the Checklist when the item is marked complete or incomplete
- Make a checklist public without needing authentication and share the unique checklist url


#### How to setup in Development Environment

##### Install the packages
```
npm install
```

##### Install MongoDB

##### Create the database: "zaplist"

##### Create the collections: 
- checklists
- users

##### Run the app
```
node app.js
```

#### How to setup in Production Environment

##### Install the packages
```
npm install
```
##### Install Process Manager (PM2)
```
npm install pm2 -g
```

##### To ensure your app restarts after a server reboot:
```
pm2 startup
pm2 save
```

##### Install MongoDB
###### Install natively
```
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc |  gpg --dearmor | sudo tee /usr/share/keyrings/mongodb.gpg > /dev/null
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install mongodb-org
```
OR
###### Install docker version
```
sudo docker run -d -p 27017:27017 --name mongodb -v /opt/mongodb/data:/data/db mongo:latest --restart=always
```

##### Start and Enable MongoDB
###### Start MongoDB:
```
sudo systemctl start mongod
```

###### Enable MongoDB to start on boot:
```
sudo systemctl enable mongod
```

###### Check MongoDB service status:
```
sudo systemctl status mongod
```

##### Create the First Admin User
With authentication enabled, you need to create an admin user to manage MongoDB. Initially, you will connect without authentication to create the user.
```
mongosh
```

Switch to the admin database:
```
use admin
```

Create the admin user:
Run the following command to create an admin user with root access. Replace your_admin_user and your_password with your desired credentials.
```
db.createUser({
  user: "your_admin_user",
  pwd: "your_password",
  roles: [{ role: "root", db: "admin" }]
});
```

Exit the Mongo shell:
```
exit
```

Access MongoDB with Authentication
Now that MongoDB requires authentication, you must specify a username and password to interact with the database.
Login using the new admin user:
```
mongosh -u "your_admin_user" -p "your_password" --authenticationDatabase "admin"
```

##### Create the database: "zaplist"
Create Application-Specific Database and User
Now you’ll create a database specifically for your app (e.g., checklist_app) and a user with limited access to it.

a. Login as the admin user:
```
mongo -u "your_admin_user" -p "your_password" --authenticationDatabase "admin"
```

b. Create your app database:
```
use zaplist
```

c. Create a user for your application:
Run the following command to create a user with readWrite access to your app database:
```
db.createUser({
  user: "app_user",
  pwd: "app_user_password",
  roles: [{ role: "readWrite", db: "zaplist" }]
});
```

d. Exit the Mongo shell:
```
exit
```

##### Create the collections: 
- checklists
- users

##### Run the app
```
pm2 start app.js --name "zaplist"
```