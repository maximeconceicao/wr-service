const Seneca = require('seneca')
const SenecaWeb = require('seneca-web')
const Express = require('express')
const seneca = Seneca()
const BodyParser = require('body-parser')

// definition des routes
var Routes = [
  //STAT SERVICE
  {
    pin: 'role:api,target:stats,cmd:retrieve',
    prefix: '/api/wr/stats/:applicant?',
    map: {
      op: {
        GET: true, // accepte uniquement les requetes GET
        name: '',

      }
    }
  },
  // WR SERVICE
  {
    pin: 'role:api,target:wr,cmd:create', // type de message cree a la reception d'une requete HTTP
    prefix: '/api/wr',
    map: {
      op: {
        POST: true, // accepte uniquement les requetes POST
        name: '',

      }
    }
  },
  {
    pin: 'role:api,target:wr,cmd:retrieve',
    prefix: '/api/wr/:id?',
    map: {
      op: {
        GET: true, // accepte uniquement les requetes GET
        name: '',

      }
    }
  },
  {
    pin: 'role:api,target:wr,cmd:update', // type de message cree a la reception d'une requete HTTP
    prefix: '/api/wr/:id?', // Ici l'id n'est pas supposé être optionnel, mais il a besoin de l'être pour valider le test 11...
    map: {
      op: {
        PUT: true, // accepte uniquement les requetes PUT
        name: '',

      }
    }
  },
  {
    pin: 'role:api,target:wr,cmd:delete', // type de message cree a la reception d'une requete HTTP
    prefix: '/api/wr/:id?',
    map: {
      op: {
        DELETE: true, // accepte uniquement les requetes DELETE
        name: '',

      }
    }
  }


]


seneca.use(SenecaWeb, {
  options: { parseBody: false }, // desactive l'analyseur JSON de Seneca
  routes: Routes,
  context: Express().use(BodyParser.json()),     // utilise le parser d'Express pour lire les donnees 
  adapter: require('seneca-web-adapter-express') // des requetes PUT
})

seneca.client({      // ce module enverra les messages counter:*
  port: 4000,      // sur le port 4000 (qui est le port sur lequel le microservice
  pin: 'role:wr,cmd:*' // stats attend les messages...
})

seneca.client({      // ce module enverra les messages counter:*
  port: 5000,      // sur le port 5000 (qui est le port sur lequel le microservice
  pin: 'role:stats,cmd:*' // wr attend les messages...
})

seneca.client({      // ce module enverra les messages counter:*
  port: 6000,      // sur le port 6000 (qui est le port sur lequel le microservice
  pin: 'role:search,cmd:*' // search attend les messages...
})

/////////////////////       WR-SERVICE       //////////////////////////

seneca.add('role:api,target:wr,cmd:create', function (msg, respond) {
  let data = msg.args.body;
  let params = msg.args.params;
  this.log.info({ pattern: msg.args.route.pattern, data: data, params: params });

  this.act({ role: 'wr', cmd: 'create', applicant: data.applicant, work: data.work }, respond);

})

seneca.add('role:api,target:wr,cmd:retrieve', function (msg, respond) {
  let data = msg.args.body;
  let params = msg.args.params;
  if (msg.args.query === undefined || JSON.stringify(msg.args.query) === '{}') {

    this.log.info({ pattern: msg.args.route.pattern, data: data, params: params });

    this.act({ role: 'wr', cmd: 'retrieve', id: params.id }, respond);
  }
  else {
    if (params.id!==undefined) return respond(null, { success: false, msg:'query not possible with wr_id', data: [] })
      this.act({ role: 'search', cmd: 'retrieve', keyword: msg.args.query }, respond);
  }

})

seneca.add('role:api,target:wr,cmd:update', function (msg, respond) {
  let data = msg.args.body;
  let params = msg.args.params;
  this.log.info({ pattern: msg.args.route.pattern, data: data, params: params });

  this.act({ role: 'wr', cmd: 'update', id: params.id, state: data.state, work: data.work }, respond);

})

seneca.add('role:api,target:wr,cmd:delete', function (msg, respond) {
  let data = msg.args.body;
  let params = msg.args.params;
  this.log.info({ pattern: msg.args.route.pattern, data: data, params: params });

  this.act({ role: 'wr', cmd: 'delete', id: params.id }, respond);

})

/////////////////////       WR-STAT       //////////////////////////

seneca.add('role:api,target:stats,cmd:retrieve', function (msg, respond) {
  let data = msg.args.body;
  let params = msg.args.params;
  this.log.info({ pattern: msg.args.route.pattern, data: data, params: params });

  this.act({ role: 'stats', cmd: 'retrieve', applicant: params.applicant }, respond);
})




// les requetes HTTP sont attendues sur le port 3000
// Pour tester :
// - lancer le service counter.js
// - lancer la passerelle RESTcounter.js
// - et tester avec : curl -H "Content-Type: application/json" -d '{"op":"inc"}' -X PUT http://localhost:3000/counter

seneca.ready(() => {
  const app = seneca.export('web/context')()
  app.listen(3000)
})
