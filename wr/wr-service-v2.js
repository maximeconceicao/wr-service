const Seneca = require('seneca')

// obtention d'une instance de Seneca
var seneca = Seneca()

// initialisation de seneca-entity pour la persistence de données
seneca.use('entity')

//Définition d'une énumération pour les états du wr
const states = {
    CREATED: 'created',
    CLOSED: 'closed'
}

// definition d'un plugin (constituant ici le microservice)
var wr = function (options) {

    //creation d'une DT qui retournera l'ensemble de la DT avec notamment 
    //son identifiant dans le champ data
    this.add('role:wr,cmd:create', function (msg, done) {
        this
            .make('wr')
            .data$({
                applicant: msg.applicant,
                work: msg.work,
                desiredCompletionDate: (msg.desiredCompletionDate === undefined) ? null : msg.desiredCompletionDate,
                effectiveCompletionDate: (msg.effectiveCompletionDate === undefined) ? null : msg.effectiveCompletionDate,
                state: states.CREATED,
            })
            .save$(function (err, wr) {
                if (err) return done(err, { success: false, msg: "Error during creation", data: {} })

                done(null, { success: true, msg: "Successful creation", data: [wr] })
            })
    })

    //obtention d'une DT (avec id) ou de l'ensemble des DT (sans id) qui
    //qui retournera l'ensemble des données disponibles
    this.add('role:wr,cmd:retrieve', function (msg, done) {
        if (msg.id !== undefined) {
            this.make('wr').load$(msg.id, function (err, wr) {
                if (err) return done(err, { success: false, msg: "Error during retrieve", data: {} })

                done(null, { success: true, msg: 'Successful retrieve', data: [wr] })
            })
        } else {
            this.make('wr').list$(function (err, list) {
                if (err) return done(err, { success: false, msg: "Error during retrieve", data: {} })

                let data = [];
                list.forEach(function (wr) {
                    data.push(wr);
                });
                done(null, { success: true, msg: 'Successful retrieve', data: data })
            })

        }
    })

    //mise à jour d'une DT en permettant de modifier uniquement la 
    //description (une DT réalisée ne pourra plus être modifiée)
    this.add('role:wr,cmd:update', function (msg, done) {

        if (msg.id === undefined) return done(null, { success: false, msg: "wr id not provided", data: {} })

        this.make('wr').load$(msg.id, function (err, wr) {

            if (err) return done(err, { success: false, msg: "Error during update", data: {} })
            if (wr !== null) {
                if (wr.state === states.CLOSED) {
                    done(err, { success: false, msg: "wr is already closed", data: {} })
                } else {
                    wr.state = (msg.state === undefined) ? wr.state : msg.state
                    wr.work = (msg.work === undefined) ? wr.work : msg.work
                    
                    var today = new Date();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                    var yyyy = today.getFullYear();

                    if (wr.state === states.CLOSED) wr.effectiveCompletionDate =  mm + '/' + dd + '/' + yyyy;
                    wr.save$(function (err, wr) {
                        if (err) return done(err, { success: false, msg: "Error during update", data: {} })

                        done(null, { success: true, msg: "Successful update", data: [wr] })
                    })
                }
            }
            else {
                done(err, { success: false, msg: 'wr not found', data: {} })
            }
        })

    })

    //suppression d'une DT seulement si elle n'a pas encore été réalisée

    this.add('role:wr,cmd:delete', function (msg, done) {
        if (msg.id === undefined) {
            this.make('wr').list$(function (err, list) {
                if (err) return done(err, { success: false, msg: "Error during retrieve", data: {} })

                list.forEach(function (wr) {
                    wr.remove$(wr.id, function (err) {
                        if (err) return done(err, { success: false, msg: "Error during delete", data: {} })
                    })
                });
                done(null, { success: true, msg: "wr all deleted", data: {} })
            })
        }
        else {
            this.make('wr').load$(msg.id, function (err, wr) {
                if (err) return done(err, { success: false, msg: "Error during delete", data: {} })

                if (wr === null) return done(null, { success: false, msg: 'wr not found', data: {} })


                if (wr.state === states.CLOSED) {
                    done(err, { success: false, msg: "wr is already closed", data: {} })
                } else {
                    wr.remove$(msg.id, function (err) {
                        if (err) return done(err, { success: false, msg: "Error during delete", data: {} })

                        done(null, { success: true, msg: "Successful delete", data: [wr] })
                    })
                }

            })
        }
    })


    return 'wr'

}



seneca.use(wr) // enregistrement du plugin ds Seneca

seneca.listen(4000)

//CODE DE TEST//

//TEST CREATE
/*
seneca.use(wr).act('role:wr, cmd:create, applicant:pierre, work:this is a description', console.log)
seneca.use(wr).act('role:wr, cmd:create, applicant:paul, work:this is a description', console.log)



//TEST RETRIEVE
let id;
seneca.use(wr).act('role:wr, cmd:retrieve', function(err, result){
    console.log(result)
    id = result.data[1].id

    seneca.use(wr).act({role:'wr', cmd:'retrieve', id:id}, function(err, result){
        console.log(result)


        //TEST UPDATE
        console.log(id)
        seneca.use(wr).act({role:'wr', cmd:'update', id:id, work:'hey sali salu', state:states.CLOSED}, function(err, result){
            console.log(result)

             //TEST DELETE
        console.log(id)
        seneca.use(wr).act({role:'wr', cmd:'delete', id:id}, function(err, result){
            console.log(result)
            seneca.use(wr).act('role:wr, cmd:retrieve', function(err, result){
                console.log(result)
            })
        })
        })





    })


})

*/