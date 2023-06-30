## Tutorial: Hacker News clone that uses Redis as a primary database (Redis JSON + Redis Search)

## Technical Stack

* Frontend - *React*, *NextJS*
* Backend - *NodeJS*, *ExpressJS*, *Redis*(Redis Search + Redis JSON)

## Database Schema

### User
```javascript
username: STRING  // unique id of user
password: STRING // hashed password of user
authToken: STRING // cookie token
authTokenExpiration: STRING
resetPasswordToken: STRING
resetPasswordTokenExpiration: STRING
email: STRING // email of user
created: NUMBER // timestamp of user createdAt
karma: NUMBER // karma of user
about: STRING
showDead: BOOLEAN // indicates if user account is dead
isModerator: BOOLEAN // indicates if user is moderator
shadowBanned: BOOLEAN // indicates if user account is shadow banned
banned: BOOLEAN // indicates if user account is banned
```

### Item
This is the item posted by user. I can be a link or post with some description.
```javascript
id: STRING // id of item
by: STRING // username who posted this item
title: STRING // title of item
type: STRING // 'show' | 'news' | 'ask'
url: STRING // link when type is news or show
domain: STRING // domain of url
text: STRING // description when type is ask
points: NUMBER // points of item
score: NUMBER // score of item
commentCount: NUMBER // total comment counts
created: NUMBER // created timestamp
dead: BOOLEAN // is killed by moderator
```

### Comment
```javascript
id: STRING
by: STRING // username of who posed this comment
parentItemId: STRING // id of parent item
parentItemTitle: STRING // title of parent item
isParent: BOOLEAN // if this is root comment of a item
parentCommentId: : STRING // if it's not root, indicate the parent comment id
children: ARRAY // id of array of children comments
text: STRING // comment content
points: NUMBER
created: NUMBER
dead: BOOLEAN
```

### UserFavorite
```javascript
username: STRING
type: STRING  // 'comment' | 'item'
id: STRING // id of that comment or item
date: NUMBER
```

### UserVote, UserHidden
The schema is exact same as `UserFavorite` but indicates if user has voted on item/comment, if user has marked hidden for a specific item/comment

### ModeratorLog
This schema is to store and keep track of moderator action history.

## How document and each data type is stored in Redis.

### How do you store a document?
We want to store a document(like a user) in redis.
Basically, *indexable* and *sortable* fields are stored in hash while we store rest of the fields in Redis JSON. We can applyRedis Searchqueries once we store in hash.

2 databases were in redislabs, one withRedis Searchenabled and the other one with Redis JSON enabled.
Example user document
```javascript
{
    username: 'andyr',
    password: '$2a$10$W4UUtt5hkoiDtKU1.ZR6H.EklDH1ePUpZTvEI2IBrYRrufx8WMvIO',
    authToken: 'EklDH1ePUpZTvEI2IBrYRrufx8WMvIO',
    created: 1541648957,
    isModerator: false,
}
```
We need to search by `username`, `created`, `isModerator` but we dont need to search by `password` and `authToken`. Thus, `username`, `created` and `isModerator` will be saved in Redis Search. `password` and `authToken` will be saved in Redis JSON.

Store indexable/sortable fields in hash ofRedis Searchdb
```
HSET user:1 username andyr created 1541648957 isModerator false
```

Store other fields in Redis JSON
```
JSON.SET user:1 . '{ "password": "$2a$10$W4UUtt5hkoiDtKU1.ZR6H.EklDH1ePUpZTvEI2IBrYRrufx8WMvIO", "authToken": "EklDH1ePUpZTvEI2IBrYRrufx8WMvIO" }'
```

Get user where username is 'andyr'
- First of all, search for that user.
```
FT.SEARCH idx:user @username:"andyr" NOCONTENT LIMIT 0 1 // Will return user id
```
Result - `['user:1']`
- Then, get values from hash and Redis JSON, and combine them
```
HMGET user:1
JSON.MGET user:1 .
```
*Note: For simplexity, it will store all fields in JSON.*

### Managing id of a new document
When a new document added, we need to know the unique key to store value. `{collectionName}:id-indicator` indicates the next unique number to use as key.
It's increased whenever a new document is creaed and that id is used.

### How to update a document?
We need to update isModerator to true from above user document.
If it's indexable field,
```
HSET user:1 isModerator true
```
If not,
```
JSON.SET user:1 isModerator true
```

### How to delete a document?
Just delete the keys on both dbs.
```
DEL user:1
```

### DataTypes
1. STRING - Stored as plain string format in hash key and in Redis JSON
2. NUMBER - Same as STRING
3. ARRAY - It won't be stored in hash, it will be only stored in Redis JSON
4. BOOLEAN - It can be stored as STRING, and apply queries
5. DATE - It can be converted into timestamp, and application will use the single timezone when it's stored in db.

### User Schema
```javascript
{
  id: {
    type: RedisDbTypes.STRING,
    indexed: true,
  },
  by: {
    type: RedisDbTypes.STRING,
    indexed: true,
  },
  parentItemId: {
    type: RedisDbTypes.STRING,
    indexed: true,
  },
  parentItemTitle: {
    type: RedisDbTypes.STRING,
    indexed: true,
    sortable: true,
  },
  isParent: {
    type: RedisDbTypes.BOOLEAN,
    indexed: true,
  },
  parentCommentId: {
    type: RedisDbTypes.STRING,
    indexed: true,
  },
  children: {
    type: RedisDbTypes.ARRAY,
    refIdx: 'comment',
    default: [],
  },
  text: {
    type: RedisDbTypes.STRING,
    indexed: true,
  },
  points: {
    type: RedisDbTypes.NUMBER,
    default: 1,
    min: -4,

    indexed: true,
    sortable: true,
  },
  created: {
    type: RedisDbTypes.NUMBER,

    indexed: true,
    sortable: true,
  },
  dead: {
    type: RedisDbTypes.BOOLEAN,
    default: false,
    indexed: true,
  }
}
```
## Creating Indices
When schema is created, it should check db, and make sure indexable/sortable fields are configured properly.
To check if indcies are configured properly.
```
FT.INFO idx:user
```

If one of the field is not configured, it should reconfigureRedis Searchfor example
```
FT.CREATE idx:user ON hash PREFIX 1 user: SCHEMA username TEXT SORTABLE email TEXT SORTABLE created NUMERIC SORTABLE karma NUMERIC SORTABLE about TEXT showDead TEXT isModerator TEXT shadowBanned TEXT banned TEXT _id TEXT SORTABLE
```
Please note that how each field are indexed and marked as sortable.

## Example Key/Values of each schema
- user: 1
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> HGETALL user:1
 1) "username"
 2) "KennyFromIT"
 3) "email"
 4) ""
 5) "created"
 6) "1541648957"
 7) "karma"
 8) "348"
 9) "about"
10) ""
11) "showDead"
12) "false"
13) "isModerator"
14) "false"
15) "shadowBanned"
16) "false"
17) "banned"
18) "false"
19) "_id"
20) "1"
```
- user:id-indicator
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> GET user:id-indicator
"81"
```
- item:1
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> HGETALL item:1
 1) "_id"
 2) "1"
 3) "by"
 4) "mmhsieh"
 5) "score"
 6) "913"
 7) "dead"
 8) "false"
 9) "created"
10) "1615845546"
11) "url"
12) "https://www.pcgamer.com/rockstar-thanks-gta-online-player-who-fixed-poor-load-times-official-update-coming/"
13) "id"
14) "5Do6n69V9U0E"
15) "domain"
16) "pcgamer.com"
17) "title"
18) "Rockstar thanks GTA Online player who fixed load times, official update coming"
19) "points"
20) "1"
21) "type"
22) "news"
```
- item:id-indicator
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> GET item:id-indicator
"20"
```

- comment:1
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> HGETALL comment:1
 1) "parentItemId"
 2) "SnCQJf1P3QH4"
 3) "_id"
 4) "1"
 5) "text"
 6) "This is a sad reminder of the masses of invisible labor (unpaid and paid) that hold up our world. Social scientists have been studying how labor becomes visible (or invisible) for a while without finding obvious solutions to &quot;the situation.&quot;<p>How can we build a world where an infinite procession specialists like Roy can get the care they need and also find and train successors in their important work? Not just because we will all die, but also because we might all want to retire or go on long vacations or, even if we are good at it, change careers."
 7) "by"
 8) "aeturnum"
 9) "parentCommentId"
10) ""
11) "dead"
12) "false"
13) "isParent"
14) "true"
15) "created"
16) "1615668352"
17) "id"
18) "nIMVX4cAFZxh"
19) "parentItemTitle"
20) "Dhcpcd Will Need a New Maintainer"
21) "points"
22) "1"
```
- comment:id-indicator
```
redis-10292.c10.us-east-1-2.ec2.cloud.redislabs.com:10292> GET comment:id-indicator
"60"
```



## How it works

### By Screens
#### Signup
![Signup Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-signup.png)
- Make sure user(where username is andy1) does not exist.
```
FT.SEARCH idx:user  (@username:"andy1") NOCONTENT LIMIT 0 1 SORTBY _id DESC
```
- Get and increase the next id in users collection.
```
GET user:id-indicator // 63
INCR user:id-indicator  // 64 will be next user id, 63 is current user id
```
- Create user:63 hash and json.(json also collects authToken and password hash etc)
```
HSET user:63 username andy1 email  created 1615569194 karma 0 about  showDead false isModerator false shadowBanned false banned false _id 63
JSON.SET user:63 . '{"username":"andy1","password":"$2a$10$zy8tsCske8MfmDX5CcWMce5S1U7PJbPI7CfaqQ7Bo1PORDeqJxqhe","authToken":"AAV07FIwTiEkNrPj0x1yj6BPJQSGIPzV0sICw2u0","authTokenExpiration":1647105194,"email":"","created":1615569194,"karma":0,"showDead":false,"isModerator":false,"shadowBanned":false,"banned":false,"_id":63}'
```
- Gernerate cookie with expiration time.



#### Login
![Login Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-login.png)
- Find user
```
FT.SEARCH idx:user  (@username:"andy1") NOCONTENT LIMIT 0 1 SORTBY _id DESC
```
- Make sure password is correct
```
JSON.MGET user:63 .
```
- Compare password and new password hash and create cookie if it's successful

### Item list page
![Newest Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-newest.png)
- Check if user has toggled hidden attribute on a specific item.
```
FT.SEARCH idx:user-hidden  (@username:"andy1") NOCONTENT LIMIT 0 10000 SORTBY _id DESC
// Result - [0, "item:4"]
```
- If that is not null
```
FT.SEARCH idx:item  (-(@id:"item:4")) (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY _id ASC
```
- If it's empty array
```
FT.SEARCH idx:item (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY _id ASC
// Result - [3,"item:1","item:2","item:3"]
```
- Get all items from Redis JSON
```
JSON.MGET item:1 item:2 item:3 .
// Result - [{"id":"bkWCjcyJu5WT","by":"todsacerdoti","title":"Total Cookie Protection","type":"news","url":"https://blog.mozilla.org/security/2021/02/23/total-cookie-protection/","domain":"mozilla.org","points":1,"score":1514,"commentCount":0,"created":1614089461,"dead":false,"_id":3}]]
```

- Get items posted within last 1 week
```
FT.SEARCH idx:item  (@created:[(1615652598 +inf]) (@dead:"false") NOCONTENT LIMIT 0 0 SORTBY _id DESC
// Result - [13,"item:19","item:17","item:16","item:15","item:14","item:13","item:12","item:11","item:8","item:5","item:4","item:3","item:1"]
```
Note that 1615652598 is timestamp of 1 week ealier than current timestamp
```
JSON.MGET item:19 item:17 item:16 item:15 item:14 item:13 item:12 item:11 item:8 item:5 item:4 item:3 item:1 .
// Result - the JSON of selected items
```
### Item Detail
![Item Detail Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-item-detail.png)
- Get the item object first
```
JSON.MGET item:1 .
```
- Find item:1 's root comments
```
FT.SEARCH idx:comment  (@parentItemId:"kDiN0RhTivmJ") (@isParent:"true") (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY points ASC
// Result - [3,"comment:1","comment:2","comment:12"]
```
- Get those comments
```
JSON.MGET comment:1 comment:2 comment:12 .
// one comment example result - {"id":"jnGWS8TTOecC","by":"ploxiln","parentItemId":"kDiN0RhTivmJ","parentItemTitle":"The Framework Laptop","isParent":true,"parentCommentId":"","children":[13,17,20],"text":"I don&#x27;t see any mention of the firmware and drivers efforts for this. Firmware and drivers always end up more difficult to deal with than expected.<p>The Fairphone company was surprised by difficulties upgrading and patching android without support from their BSP vendor, causing many months delays of updates _and_ years shorter support life than they were planning for their earlier models.<p>I purchased the Purism Librem 13 laptop from their kickstarter, and they had great plans for firmware and drivers, but also great difficulty following through. The trackpad chosen for the first models took much longer than expected to get upstream linux support, and it was never great (it turned out to be impossible to reliably detect their variant automatically). They finally hired someone with sufficient skill to do the coreboot port _months_ after initial units were delivered, and delivered polished coreboot firmware for their initial laptops _years_ after they started the kickstarter.<p>So, why should we have confidence in the firmware and drivers that Framework will deliver :)","points":1,"created":1614274058,"dead":false,"_id":12}
```
- Using children of each comment, fetch children comments
```
FT.SEARCH idx:comment  (@dead:"false") (@_id:("3"|"7"|"11")) NOCONTENT LIMIT 0 10000 SORTBY _id DESC
```
- Iterate this over until all comments are resolved

#### Submit
![Submit Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-submit.png)
- Get next item's id and increase it
```
GET item:id-indicator
// Result - 4
SET item:id-indicator 5
```
- Create hash and Redis JSON index
```
HSET item:4 id iBi8sU4HRcZ2 by andy1 title Firebase trends type ask url  domain  text Firebase Performance Monitoring is a service that helps you to gain insight into the performance characteristics of your iOS, Android, and web apps. points 1 score 0 created 1615571392 dead false _id 4
JSON.SET item:4 . '{"id":"iBi8sU4HRcZ2","by":"andy1","title":"Firebase trends","type":"ask","url":"","domain":"","text":"Firebase Performance Monitoring is a service that helps you to gain insight into the performance characteristics of your iOS, Android, and web apps.","points":1,"score":0,"commentCount":0,"created":1615571392,"dead":false,"_id":4}'
```

#### Update Profile
![Update Profile Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-update-profile.png)
- Get the user
```
FT.SEARCH idx:user  (@username:"andy1") NOCONTENT LIMIT 0 1 SORTBY _id DESC
JSON.MGET user:63 .
```
- Update new user
```
HSET user:63 username andy1 email  created 1615569194 karma 1 about I am a software engineer. showDead false isModerator false shadowBanned false banned false _id 63
JSON.SET user:63 . '{"username":"andy1","password":"$2a$10$zy8tsCske8MfmDX5CcWMce5S1U7PJbPI7CfaqQ7Bo1PORDeqJxqhe","authToken":"KJwPLN1idyQrMp5qEY5hR3VhoPFTKRcC8Npxxoju","authTokenExpiration":1647106257,"email":"","created":1615569194,"karma":1,"about":"I am a software engineer.","showDead":false,"isModerator":false,"shadowBanned":false,"banned":false,"_id":63}'
```
#### Moderation Logs screen
![Moderation Logs](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/moderation-logs.png)
- Find all moderation logs
```
FT.SEARCH idx:moderation-log * NOCONTENT LIMIT 0 0 SORTBY _id DESC
// Result - [1,"moderation-log:1"]
```
- Get that moderation logs
```
JSON.MGET moderation-log:1 .
```

#### Search
![Search Screen](https://raw.githubusercontent.com/redis-developer/redis-hacker-news-demo/master/docs/screenshot-search.png)
- Get items that contains "fa"
```
FT.SEARCH idx:item  (@title:fa*) (-(@id:"aaaaaaaaa")) (@dead:"false") NOCONTENT LIMIT 0 30 SORTBY score ASC
// Result - [2,"item:18","item:16"]
```
- Get those items via json
```
JSON.MGET item:18 item:16 .
```

## Example commands
#### There are 2 type of fields, indexed and non-indexed.
1. Indexed fields will be stored in hash using HSET/HGET.
2. Non-indexed fields will be stored in Redis JSON.


- CreateRedis SearchIndex
When schema is created, it should created index.
```
FT.CREATE idx:user ON hash PREFIX 1 "user:" SCHEMA username TEXT SORTABLE email TEXT SORTABLE karma NUMERIC SORTABLE
```

- DropRedis SearchIndex
Should drop/update index if the schema has changed
```
FT.DROPINDEX idx:user
```

- GetRedis SearchInfo
Validate if the fields are indexed properly. If not, it will update the index fields or drop/recreate.
```
FT.INFO idx:user
```


- Create a new user
It will require new hash and new JSON record
```
HSET user:andy username "andy" email "andy@gmail.com" karma 0
JSON.SET user:andy '{"passoword": "hashed_password", "settings": "{ \"showDead\": true }" }'
```


- Update a user
```
HSET user:1 username "newusername"
JSON.SET user:andy username "newusername"
```

- Find user with username 'andy'
1. Find  the user's hash first
```
FT.SEARCH idx:user '@username:{andy}'
```
2. Fetch the JSON object to get the related JSON object
```
JSON.GET user:andy
```

- Find user whose id is andy1 or andy2
```
FT.SEARCH idx:user '@id:("andy1"|"andy2")'
```

- Find user whose id is not andy1 or andy2
```
FT.SEARCH idx:user '(-(@id:("andy1"|"andy2")))'
```

- Find user whose id is andy1 or username is andy
```
FT.SEARCH idx:user '(@id:"andy1") | (@username:"andy")'
```

- Find user whose id is andy1 and username is andy
```
FT.SEARCH idx:user '(@id:"andy1") (@username:"andy")'
```

- Find first 10 users order by username
```
FT.SEARCH idx:user '*' LIMIT 0 10 SORTBY username ASC
```

- Find next 10 users
```
FT.SEARCH idx:user '*' LIMIT 10 20 SORTBY username ASC
```

- Get from RedisJson from multiple keys
```
JSON.MGET idx:user "andy1" "andy2" "andy3"
```



## Pull Hacker News API to seed database
Using [API](https://github.com/HackerNews/API), it pulls the latest hackernews data.

- Seed top stories from hacker news
- Create a moderator with `moderator:password123`
```sh
node ./backend/scripts/seed.js
```

## Running Locally

#### .env

Copy `.env.sample` to `.env` and provide the values.
#### Start the dev server
```sh
npm run dev
```

#### Start the production server
```sh
npm run build
npm start
```
