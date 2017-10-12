// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
  appId: null,
  appPassword: null
});

var bot = new builder.UniversalBot(connector)
server.post('/api/messages', connector.listen());


var bot = new builder.UniversalBot(connector, [
    function (session, args, next) {
        if (!session.userData.name) {
            // Ask user for their name
            builder.Prompts.text(session, "Hello... What's your name?");
        } else {
            // Skip to next step
        next();
        }
    },
    function (session, results) {
        // Update name if answered
        if (results.response) {
            session.userData.name = results.response;
        }

        // Greet the user
        session.send("Hi %s!", session.userData.name);
    }
]);

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL);
bot.recognizer(recognizer);



//==================================================================================================


bot.dialog('FindInsurance',[
    function (session, args, next) {
    	session.send('Welcome to the company! If you would like some more information on our services, please click one of the linkes below!');
    	session.dialogData.entities = args.entities;
    	var homeEntity = builder.EntityRecognizer.findEntity(args.entities,'Home');
    	var autoEntity = builder.EntityRecognizer.findEntity(args.entities,'Auto');
    	if(homeEntity){
    		//Home Entity is detected, continue to the next step
    		session.userData.typeInsurance = 'home';
    	}
		else if(autoEntity){
		//Home Entity is detected, continue to the next step
			session.userData.typeInsurance = 'auto';
	    	}
		else{
            
			var cards = getCardsAttachments();
		    // create reply with Carousel AttachmentLayout
			var reply = new builder.Message(session)
				.attachmentLayout(builder.AttachmentLayout.carousel)
				.attachments(cards);
			session.send(reply);
    		builder.Prompts.choice(session, "What kind of insurance are you interested in?", "Home|Auto|Life|Business|Farm|Travel",{listStyle: builder.ListStyle.button});  
		}},
    function (session,results){
    		session.dialogData.typeInsurance = results.response
             switch (results.response.entity) {
            case "Home":
                session.dialogData.typeInsurance = "Home";
                break;
            case "Auto":
                session.dialogData.typeInsurance = "Auto";
                break;
            case "Life":
                session.dialogData.typeInsurance = "Life";
                break;
            case "Business":
                session.dialogData.typeInsurance = "Business";
                break;
            case "Farm":
                session.dialogData.typeInsurance = results.response.entity;
                break;
            default:
                session.dialogData.typeInsurance = "Travel";
                break;
        }
           // var type = InsuranceData[results.response.entity];
    		var message = "Let's get you started on your %s insurance";
	//		session.send("Let's get you started on your %(name) insurance", session.dialogData.typeInsurance);
            session.send(message,session.dialogData.typeInsurance);
			session.beginDialog('/getInfo', session.userData.profile);
    	}

]).triggerAction({
    matches: 'FindInsurance',
    onInterrupted: function (session) {
        session.send('Hi Please enter type of insurance');
    }
});

bot.dialog('/getInfo',[
	function (session,args,next) {
         builder.Prompts.text(session, "Hello... What's your name?");
        /*
        if (!session.userData.name) {
            // Ask user for their name
            builder.Prompts.text(session, "Hello... What's your name?");
        } else {
            // Skip to next step
            next();
        }
        */
    },
    function (session, results) {
        if(results.response){
            session.userData.name = results.response;
        }
       // builder.Prompts.number(session, 'Hi ' + session.userData.name + ', Please enter your Date of Birth');
		builder.Prompts.choice(session, "Tell us about yourself", ["Male","Female"],{listStyle:3});
    },
    function (session, results) {
             switch (results.response.entity) {
            case "Female":
                session.conversationData.Sex = "Female";
                break;
            case "Male":
                session.conversationData.Sex = "Male";
                break;
            default:
                session.conversationData.Sex = results.response.entity;
                break;
        }
       // builder.Prompts.number(session, 'Hi ' + session.userData.name + ', Please enter your Date of Birth');
        builder.Prompts.time(session, "Hi " + session.userData.name + ", Please enter your Date of Birth (MM/DD/YYYY)");
    },
    function (session, results) {
        if (results.response) {
            session.conversationData.time = builder.EntityRecognizer.parseTime([results.response]);
        }
         session.endDialog('Got it... ' + session.userData.name +
            ' you are a  ' + session.conversationData.Sex +
            ' born on ' + session.conversationData.time + '.');
    },
	]);

bot.dialog('FindInvestments', function (session) {
    session.endDialog("You're looking to invest! Have a nice day! :)");
}).triggerAction({
    matches: 'FindInvestments'
})

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Welcome to the company! Try asking me things like \'Home Insurance\', \'Car Insurance\' or \'Investing\'');
}).triggerAction({
    matches: 'Help'
})


///Helper Functions
function getCardsAttachments(session) {
    return [
        new builder.HeroCard(session)
            .title('Home Insurance')
            .subtitle('Protect your home and everything in it')
            .text('Gotta Save that home')
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'WEB_URL_HERE', 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title('Auto Insurance')
            .subtitle("Get auto insurance that's right for you")
            .text('Auto to protect your car from the store')
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'URL_HERE', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Life Insurance')
            .subtitle("It's worth it")
            .text('Probably need that stuff')
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'WEB_URL_HERE', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Business Insurance')
            .subtitle("From one Canadian business to anothert")
            .text('Good Business')
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'WEB_URL_HERE', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Farm Insurance')
            .subtitle("Insure your farm")
            .text("This is where you get your farm insurance")
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'WEB_URL_HERE', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Travel Insurance')
            .subtitle("Coverage wherever you roam")
            .text("Are you taking a business trip? Going on a cruise? Visiting Canada? Backpacking through Europe? Make sure you’ve packed travel insurance as protection against the unexpected. We can cover you for trip cancellation, interruptions in your plans, or medical expenses.")
            .images([
                builder.CardImage.create(session, 'IMAGE_URL_HERE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'WEB_URL_HERE', 'Learn More')
            ]),
    ];
}
