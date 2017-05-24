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
    	session.send('Welcome to the Cooperators! If you would like some more information on our services, please click one of the linkes below!');
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
    session.endDialog('Hi! Welcome to the Cooperators, try asking me things like \'Home Insurance\', \'Car Insurance\' or \'Investing\'');
}).triggerAction({
    matches: 'Help'
})


///Helper Functions
function getCardsAttachments(session) {
    return [
        new builder.HeroCard(session)
            .title('Home Insurance')
            .subtitle('Protect your home and everything in it')
            .text('The Co-operators handles hundreds of thousands of home insurance policies for people just like you, and our network of Financial Advisors will help you make sure you are getting exactly what you need.')
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Home/Home-Landing.png?la=en&hash=EF3322C0F1F9AB3E47E61F5DC289F518EE5F3EBB')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/home.aspx', 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title('Auto Insurance')
            .subtitle("Get auto insurance that's right for you")
            .text('If you own a vehicle of any kind, you probably know that insurance is required by law. Plans vary widely depending on your vehicle, how you use it and what province you live in.')
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Auto/Auto-Landing.png?la=en&hash=F526DD9EF8C07CE99D579B047BCDE1A0457DDBDE')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/auto.aspx', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Life Insurance')
            .subtitle("It's worth it")
            .text('Your Co-operators Financial Advisor is a great resource to determine how insurance fits into your life. You can also easily discover the right balance of life insurance for your needs, online.')
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Life/Life-Landing.png?la=en&hash=537943E82F64E84F8960D01A4DA56FF12DBEEFE0')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/life.aspx', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Business Insurance')
            .subtitle("From one Canadian business to anothert")
            .text('You’ve invested a lot of time and effort to build your business. Protect everything you’ve worked hard to achieve with business insurance from The Co-operators. For over 65 years, we’ve been helping Canadian businesses just like yours with commercial insurance solutions and financial plans.')
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Business/Business-Landing.png?la=en&hash=1734967A066A6BC70E446BFB3612EA3AD020B1E9')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/business.aspx', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Farm Insurance')
            .subtitle("Insure your farm with a company founded by farmers")
            .text("Farming isn’t like other business, so The Co-operators offers insurance plans specially designed to meet farmers' needs. It’s what you’d expect from a company founded by farmers.")
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Farm/Farm-Landing.png?la=en&hash=518D3DFD87480BCD76E2939F33B057DEC676FC61')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/farm.aspx', 'Learn More')
            ]),
        new builder.HeroCard(session)
            .title('Travel Insurance')
            .subtitle("Coverage wherever you roam")
            .text("Are you taking a business trip? Going on a cruise? Visiting Canada? Backpacking through Europe? Make sure you’ve packed travel insurance as protection against the unexpected. We can cover you for trip cancellation, interruptions in your plans, or medical expenses.")
            .images([
                builder.CardImage.create(session, 'https://www.cooperators.ca/en/-/media/Cooperators-Media/Section-Media/Insurance/Travel/Travel-Landing.png?la=en&hash=35661A846E9932F3AAE0A600A65AB694459DE37E')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://www.cooperators.ca/en/insurance/travel.aspx', 'Learn More')
            ]),
    ];
}
