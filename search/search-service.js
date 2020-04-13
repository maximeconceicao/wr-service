const Seneca = require('seneca')
const MiniSearch = require('minisearch')
// obtention d'une instance de Seneca
var seneca = Seneca()

// initialisation de seneca-entity pour la persistence de données
seneca.use('entity')

seneca.client({      // ce module enverra les messages au service stats
    port: 4000,      // sur le port 5000 (qui est le port sur lequel le microservice
    pin: 'role:wr,cmd:*' // stats attend les messages...
})


// definition d'un plugin (constituant ici le microservice)
var search = function (options) {

    this.add('role:search,cmd:retrieve', function (msg, done) {
        if(msg.keyword.search === undefined) return done(null, { success: false, msg: 'query parameter invalid', data: [] })
        this.act({role:'wr',cmd:'retrieve'}, function(err, result){
            

            let miniSearch = new MiniSearch({
                fields:["applicant", "desiredCompletionDate", "effectiveCompletionDate","entity$","id", "state","work"],
                storeFields:["applicant", "desiredCompletionDate", "effectiveCompletionDate","entity$","id", "state","work"]
            })
            miniSearch.addAll(result.data)

            let results = miniSearch.search(msg.keyword.search)
            
            let data = []
            for(let i=0;i<results.length;i++){
                  let wr_ = {entity$:results[i].entity$,applicant:results[i].applicant, work:results[i].work,desiredCompletionDate: results[i].desiredCompletionDate, effectiveCompletionDate: results[i].effectiveCompletionDate,
                     state:results[i].state,id:results[i].id }
                data.push(wr_);
            }
            console.log("SEARCH HERE"+JSON.stringify(results))
            done(null, { success: true, msg: "Successful search", data: data })
        });
        
    })

    return 'search'
}
seneca.use(search) // enregistrement du plugin ds Seneca

seneca.listen(6000)

