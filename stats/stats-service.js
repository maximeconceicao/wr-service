const Seneca = require('seneca')

// obtention d'une instance de Seneca
var seneca = Seneca()

// initialisation de seneca-entity pour la persistence de données
seneca.use('entity')

// definition d'un plugin (constituant ici le microservice)
var stats = function (options) {

    // POUR LA RECEPTION DES MESSAGES DE WR-SERVICE
    this.add('role:stats,cmd:created', function (msg) {

        this.make('stats').load$(msg.applicant, function (err, stats) {
            if (stats === null) {
                this
                    .make('stats')
                    .data$({
                        id: msg.applicant,
                        stats_wr_created: 1,
                        stats_wr_opened: 1,
                        stats_wr_closed: 0,
                        stats_wr_deleted: 0,
                    })
                    .save$()
            }
            else {
                stats.stats_wr_created += 1;
                stats.stats_wr_opened = stats.stats_wr_created - stats.stats_wr_closed - stats.stats_wr_deleted;
                stats.save$()
            }
        })

    })

    this.add('role:stats,cmd:deleted', function (msg) {
        
            this.make('stats').load$(msg.applicant, function (err, stats) {
                if (stats !== null) {
                    stats.stats_wr_deleted += 1;
                    stats.stats_wr_opened = stats.stats_wr_created - stats.stats_wr_closed - stats.stats_wr_deleted;
                    stats.save$()
                }
            })
        
    })

    this.add('role:stats,cmd:closed', function (msg) {

        this.make('stats').load$(msg.applicant, function (err, stats) {

            if (stats !== null) {
                stats.stats_wr_closed += 1;
                stats.stats_wr_opened = stats.stats_wr_created - stats.stats_wr_closed - stats.stats_wr_deleted;
                stats.save$()
            }
        })

    })

    // POUR LES REQUETES DE L'API
    this.add('role:stats,cmd:retrieve', function (msg, done) {
        if (msg.applicant !== undefined) {
            this.make('stats').load$(msg.applicant, function (err, stats) {
                if (err) return done(err, { success: false, msg: "Error loading applicant", data: {} })

                if (stats !== null) {
                    let stats_ = {
                        applicant: stats.id,
                        stats_wr_created: stats.stats_wr_created,
                        stats_wr_opened: stats.stats_wr_opened,
                        stats_wr_closed: stats.stats_wr_closed,
                        stats_wr_deleted: stats.stats_wr_deleted
                    };
                    done(null, { success: true, msg: "Successful update", data: stats_ })
                }
                else {
                    done(null, { success: false, msg: "applicant not found", data: stats })
                }
            })
        }
        else {

            let stats_ = {
                applicant: msg.applicant,
                global_stats_wr_created: 0,
                global_stats_wr_opened: 0,
                global_stats_wr_closed: 0,
                global_stats_wr_deleted: 0
            };

            this.make('stats').list$(function (err, list) {
                if (err) return done(err, { success: false, msg: "Error during retrieve", data: {} })

                list.forEach(function (stats) {
                    stats_.global_stats_wr_created += stats.stats_wr_created;
                    stats_.global_stats_wr_opened += stats.stats_wr_opened;
                    stats_.global_stats_wr_closed += stats.stats_wr_closed;
                    stats_.global_stats_wr_deleted += stats.stats_wr_deleted;
                });
                done(null, { success: true, msg: 'Successful retrieve', data: stats_ })
            })

        }

    })

    return 'stats'

}

seneca.use(stats) // enregistrement du plugin ds Seneca

seneca.listen(5000)