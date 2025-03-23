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

##### Create the database: "zaplist"

##### Create the collections: 
- checklists
- users

##### Run the app
```
pm2 start app.js --name "zaplist"

```