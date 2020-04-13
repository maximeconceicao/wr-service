# wr-service
University project in order to develop, with Seneca, a REST API, allowing the management of work requests, through 3 microservices.


## api/app.js

| Method | Route                     | Comment                                                |
|--------|---------------------------|--------------------------------------------------------|
| GET    | /api/wr/:id?              | Retrieve                                               |
| POST   | /api/wr/                  | Create                                                 |
| PUT    | /api/wr/:id?              | Update                                                 |
| DELETE | /api/wr/:id?              | Delete                                                 |
| GET    | /api/wr/stats/:applicant? | Know the statistics according to, or not, an applicant |
| GET    | /api/wr?search=term       | Search for a keyword in work requests                  |

## wr/wr-service.js


Microservice for managing work requests.



## stats/stats-service.js

Microservice which calculates statistics on work request according to an applicant or in general.



## search/search-service.js

Microservice which uses MiniSearch to search for work requests containing a specific keyword.