var appointment = require("..//model/Appointment");
var mongoose = require("mongoose");
var AppointmentFactory = require("../factories/AppointmentFactory");
var mailer = require("nodemailer");

const Appo = mongoose.model("Appointment", appointment)

class AppointmentService {

    async Create(name,email,description,cpf,date,time) {
        var newAppo = new Appo({
            name,
            email,
            description,
            cpf,
            date,
            time,
            finished: false,
            notified: false
        });
        try{
            await newAppo.save();
            return true;
        }
        catch(err){
            console.log(err);
            return false;
        }
    }

    async GetAll(showFinished){
        if(showFinished){
            return await Appo.find();
        }else{
            var appos = await Appo.find({'finished':false});
            var appointments = [];
            appos.forEach(appointment => {

                if (appointment.date !=  undefined){
                    appointments.push(AppointmentFactory.Build(appointment))
                }

            });

            return appointments;
        }
    }

    async GetById (id){
        try{
            var event = await Appo.findOne({'_id':id});
            return event;
        }
        catch(err){
            console.log(err)
        }
        
    }

    async Finish(id){
        try{
            await Appo.findByIdAndUpdate(id,{finished:true})
            return true
        }
        catch(err){
            console.log(err);
            return false;
        }
    }

    async Search (query){
        try{
            var appos = await Appo.find().or([{email: query},{cpf: query}])
            return appos;
        }catch(err){
            console.log(err);
            return[];
        }
    }

    async SendNotification() {
        var appos = await  this.GetAll(false)

        var transporter = mailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "659f3bfedf8cc8",
                pass: "e94d07affe5ac3"
            }
        })

        appos.forEach( async app => {
            var date = app.start.getTime();
            var hour = 1000 * 60 * 60;
            var gap = date - Date.now();

            if(gap <= hour){
                if (!app.notified){

                    Appo.findByIdAndUpdate(app.id,{notified:true});

                    transporter.sendMail({
                        from: "Clinica <clinica@teste.com>",
                        to: app.email,
                        subject: "Sua consulta está marcada para breve",
                        text:"Sua consukta ocorrerá em 1 hora. Não se atrase !!"
                    }).then(message => {

                    }).catch(err => {
                        console.log(err);
                    })
                }
            }

        })
    }
}

module.exports = new AppointmentService();
