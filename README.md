## How it works
### User Schema (Example)
```javascript
{
	username: STRING, // indexed
	email: STRING,    // indexed
	karma: NUMBER,    // indexed
	password: STRING,
	settings: OBJECT,
}
```

### There are 2 type of fields, indexed and non-indexed.
1. Indexed fields will be stored in hash using HSET/HGET.
2. Non-indexed fields will be stored in RedisJSON.


- Create RediSearch Index
When schema is created, it should created index.
```
FT.CREATE idx:user ON hash PREFIX 1 "user:" SCHEMA username TEXT SORTABLE email TEXT SORTABLE karma NUMERIC SORTABLE
```

- Drop RediSearch Index
Should drop/update index if the schema has changed
```
FT.DROPINDEX idx:user
```

- Get RediSearch Info
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


## Running Locally

### .env

Copy `.env.sample` to `.env` and provide the values.